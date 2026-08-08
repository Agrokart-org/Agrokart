"""
AgroKart RAG Engine — Real Retrieval-Augmented Generation
Architecture: Query → Embed → Hybrid Search (Vector + BM25) → Rerank → Context → LLM/Format
NO hardcoded answers. All responses grounded in retrieved documents.
"""
import os
import re
import uuid
import time
import logging
from typing import Optional, List, Dict, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# ─── Unit conversion constants ─────────────────────────────────────────────────
HA_TO_ACRE = 2.47105
ACRE_TO_HA = 0.40469

# ─── Session store (in-memory, per-process) ────────────────────────────────────
_sessions: Dict[str, List[Dict]] = {}

# ─── Data classes ──────────────────────────────────────────────────────────────
@dataclass
class RetrievedChunk:
    content: str
    source: str
    score: float
    page: Optional[int] = None
    retrieval_method: str = "vector"

@dataclass
class QueryIntent:
    crop: Optional[str] = None
    fertilizer: Optional[str] = None
    area_unit: Optional[str] = None  # "acre" or "hectare"
    area_value: Optional[float] = None
    soil_ph: Optional[float] = None
    topic: Optional[str] = None     # "dosage", "pest", "irrigation", "soil", "general"
    is_followup: bool = False


# ─── Intent Extractor ──────────────────────────────────────────────────────────
def extract_intent(query: str, conversation_history: List[Dict]) -> QueryIntent:
    """Extract structured intent from a natural language query."""
    q = query.lower().strip()
    intent = QueryIntent()

    # Crop detection
    crops = {
        "wheat": ["wheat", "gehun", "गेहूं", "gehu"],
        "rice": ["rice", "paddy", "dhan", "धान", "chawal"],
        "cotton": ["cotton", "kapas", "कपास"],
        "sugarcane": ["sugarcane", "ganna", "गन्ना", "ऊस"],
        "maize": ["maize", "corn", "makka", "मक्का"],
        "tomato": ["tomato", "tamatar", "टमाटर"],
        "potato": ["potato", "aloo", "आलू"],
        "soybean": ["soybean", "soya", "सोयाबीन"],
        "groundnut": ["groundnut", "peanut", "मूंगफली"],
    }
    for crop, keywords in crops.items():
        if any(k in q for k in keywords):
            intent.crop = crop
            break

    # If no crop found, check conversation history for context
    if not intent.crop and conversation_history:
        for msg in reversed(conversation_history):
            if msg.get("role") == "user":
                prev_q = msg.get("content", "").lower()
                for crop, keywords in crops.items():
                    if any(k in prev_q for k in keywords):
                        intent.crop = crop
                        intent.is_followup = True
                        break
                if intent.crop:
                    break

    # Fertilizer detection
    fertilizers = {
        "urea": ["urea", "यूरिया", "युरिया", "nitrogen fertilizer"],
        "dap": ["dap", "di-ammonium", "diammonium", "phosphate fertilizer", "डीएपी"],
        "mop": ["mop", "muriate of potash", "potassium chloride", "kcl"],
        "npk": ["npk", "complex fertilizer", "mixed fertilizer"],
        "ssp": ["ssp", "single super phosphate", "superphosphate"],
        "lime": ["lime", "limestone", "agricultural lime", "calcium carbonate", "चूना"],
        "gypsum": ["gypsum", "calcium sulfate", "जिप्सम"],
        "zinc": ["zinc", "zn", "zinc sulfate", "जिंक"],
    }
    for fert, keywords in fertilizers.items():
        if any(k in q for k in keywords):
            intent.fertilizer = fert
            break

    # Area unit detection
    if any(w in q for w in ["acre", "एकड़", "एकर", "एकड"]):
        intent.area_unit = "acre"
    elif any(w in q for w in ["hectare", "hectares", "ha", "हेक्टेयर"]):
        intent.area_unit = "hectare"

    # Area value extraction
    area_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:acre|hectare|ha)', q)
    if area_match:
        intent.area_value = float(area_match.group(1))

    # Topic detection
    if any(w in q for w in ["pest", "disease", "insect", "spray", "fungicide", "कीट", "रोग"]):
        intent.topic = "pest"
    elif any(w in q for w in ["irrigation", "water", "सिंचाई", "पानी", "drip", "flood"]):
        intent.topic = "irrigation"
    elif any(w in q for w in ["ph", "acid", "alkaline", "lime", "gypsum", "soil test", "organic carbon"]):
        intent.topic = "soil"
    elif any(w in q for w in ["how much", "dose", "dosage", "rate", "quantity", "कितना", "मात्रा"]):
        intent.topic = "dosage"
    else:
        intent.topic = "general"

    return intent


# ─── Unit Converter ────────────────────────────────────────────────────────────
def apply_unit_conversions(text: str, intent: QueryIntent) -> str:
    """Convert ha-based recommendations to acre if user asked for per-acre."""
    if intent.area_unit != "acre":
        return text

    # Pattern: number followed by kg/ha or kg per hectare
    def convert_match(m):
        value = float(m.group(1))
        converted = round(value / HA_TO_ACRE, 1)
        return f"**{converted} kg/acre** ({value} kg/ha)"

    text = re.sub(r'(\d+(?:\.\d+)?)\s*kg(?:\s*/\s*ha|\s+per\s+hectare|\s+per\s+ha)', convert_match, text, flags=re.IGNORECASE)

    # Add explicit note at top if conversion occurred
    if "kg/acre" in text:
        note = f"\n> 📐 **Unit Note**: Recommendations converted to **per acre** as requested (1 ha = 2.471 acres)\n\n"
        text = note + text

    return text


# ─── BM25 Keyword Search ────────────────────────────────────────────────────────
class BM25Retriever:
    """Simple BM25 retriever for keyword-based search."""
    def __init__(self):
        self.corpus = []
        self.tokenized = []
        self.bm25 = None

    def index(self, documents: List):
        """Index a list of LangChain Document objects."""
        try:
            from rank_bm25 import BM25Okapi
            self.corpus = documents
            self.tokenized = [
                doc.page_content.lower().split() for doc in documents
            ]
            self.bm25 = BM25Okapi(self.tokenized)
        except ImportError:
            logger.warning("rank_bm25 not installed — BM25 search disabled")

    def search(self, query: str, k: int = 5) -> List[Tuple]:
        """Return top-k (document, score) pairs."""
        if not self.bm25:
            return []
        tokenized_query = query.lower().split()
        scores = self.bm25.get_scores(tokenized_query)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
        return [(self.corpus[i], float(scores[i])) for i in top_indices if scores[i] > 0]


# ─── Main RAG Engine ───────────────────────────────────────────────────────────
class AgroKartRAG:
    def __init__(self, chroma_dir: str = "./chroma_db"):
        self.chroma_dir = chroma_dir
        self.vector_store = None
        self.retriever = None
        self.bm25 = BM25Retriever()
        self.all_documents = []
        self.llm = None
        self.llm_provider = None
        self.embeddings = None
        self.embeddings_model_name = "none"
        self._initialize()

    def _initialize(self):
        """Initialize embeddings, vector store, BM25, and LLM (if key available)."""
        self._init_embeddings()
        self._init_vector_store()
        self._init_bm25()
        self._init_llm()

    def _init_embeddings(self):
        """Load best available embedding model. Prefer sentence-transformers over fake."""
        openai_key = os.getenv("OPENAI_API_KEY", "")
        if openai_key and not openai_key.startswith("sk-your") and len(openai_key) > 20:
            try:
                from langchain_openai import OpenAIEmbeddings
                self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=openai_key)
                self.embeddings_model_name = "openai/text-embedding-3-small"
                logger.info("✓ OpenAI Embeddings loaded")
                return
            except Exception as e:
                logger.warning(f"OpenAI embeddings failed: {e}")

        # Sentence-transformers (local, free, real embeddings)
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
            self.embeddings_model_name = "sentence-transformers/all-MiniLM-L6-v2"
            logger.info("✓ Sentence-transformers (all-MiniLM-L6-v2) loaded")
            return
        except Exception as e:
            logger.warning(f"HuggingFace embeddings failed: {e}")

        # Last resort: fake (but we'll still have BM25)
        try:
            from langchain_community.embeddings import FakeEmbeddings
            self.embeddings = FakeEmbeddings(size=384)
            self.embeddings_model_name = "fake (BM25 will be primary retriever)"
            logger.warning("⚠️ Using FakeEmbeddings — BM25 will handle most retrieval")
        except Exception as e:
            logger.error(f"Could not load any embeddings: {e}")
            self.embeddings = None

    def _init_vector_store(self):
        """Load Chroma vector store from disk."""
        if not self.embeddings:
            return
        try:
            from langchain_community.vectorstores import Chroma
            if os.path.exists(self.chroma_dir):
                self.vector_store = Chroma(
                    persist_directory=self.chroma_dir,
                    embedding_function=self.embeddings,
                )
                self.retriever = self.vector_store.as_retriever(
                    search_type="similarity",
                    search_kwargs={"k": 6}
                )
                # Cache all documents for BM25
                try:
                    col = self.vector_store._collection
                    result = col.get(include=["documents", "metadatas"])
                    from langchain_core.documents import Document
                    self.all_documents = [
                        Document(
                            page_content=doc,
                            metadata=meta or {}
                        )
                        for doc, meta in zip(result["documents"], result["metadatas"])
                    ]
                    logger.info(f"✓ Chroma loaded: {len(self.all_documents)} chunks available")
                except Exception as e:
                    logger.warning(f"Could not cache docs for BM25: {e}")
            else:
                logger.warning(f"Chroma DB not found at {self.chroma_dir}")
        except Exception as e:
            logger.error(f"Chroma init error: {e}")

    def _init_bm25(self):
        """Index all documents into BM25."""
        if self.all_documents:
            self.bm25.index(self.all_documents)
            logger.info(f"✓ BM25 index built on {len(self.all_documents)} chunks")

    def _init_llm(self):
        """Initialize LLM if API key available."""
        openai_key = os.getenv("OPENAI_API_KEY", "")
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        groq_key = os.getenv("GROQ_API_KEY", "")

        if openai_key and not openai_key.startswith("sk-your") and len(openai_key) > 20:
            try:
                from langchain_openai import ChatOpenAI
                model = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
                self.llm = ChatOpenAI(model_name=model, temperature=0.1, max_tokens=1500, api_key=openai_key)
                self.llm_provider = f"openai/{model}"
                logger.info(f"✓ LLM: OpenAI {model}")
                return
            except Exception as e:
                logger.warning(f"OpenAI LLM init failed: {e}")

        if gemini_key:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                model = os.getenv("LLM_MODEL", "gemini-1.5-flash")
                self.llm = ChatGoogleGenerativeAI(model=model, temperature=0.1, google_api_key=gemini_key)
                self.llm_provider = f"google/{model}"
                logger.info(f"✓ LLM: Google Gemini {model}")
                return
            except Exception as e:
                logger.warning(f"Gemini LLM init failed: {e}")

        if groq_key:
            try:
                from langchain_groq import ChatGroq
                model = os.getenv("LLM_MODEL", "llama3-8b-8192")
                self.llm = ChatGroq(model_name=model, temperature=0.1, groq_api_key=groq_key)
                self.llm_provider = f"groq/{model}"
                logger.info(f"✓ LLM: Groq {model}")
                return
            except Exception as e:
                logger.warning(f"Groq LLM init failed: {e}")

        logger.warning("⚠️ No LLM configured — will use structured retrieval without generative LLM")

    # ─── Hybrid Retrieval ───────────────────────────────────────────────────────
    def _hybrid_retrieve(self, query: str, k: int = 5) -> List[RetrievedChunk]:
        """Run vector + BM25 search, merge by Reciprocal Rank Fusion, return top-k."""
        chunks: List[RetrievedChunk] = []
        vector_results = []
        bm25_results = []

        # Vector search
        if self.retriever:
            try:
                docs = self.retriever.get_relevant_documents(query)
                vector_results = docs
                for rank, doc in enumerate(docs):
                    chunks.append(RetrievedChunk(
                        content=doc.page_content,
                        source=doc.metadata.get("source", "ICAR Agricultural Handbook"),
                        score=1.0 / (rank + 1),  # RRF: 1/(rank+1)
                        page=doc.metadata.get("page"),
                        retrieval_method="vector",
                    ))
            except Exception as e:
                logger.warning(f"Vector search error: {e}")

        # BM25 search
        bm25_hits = self.bm25.search(query, k=k)
        bm25_results = bm25_hits
        for rank, (doc, score) in enumerate(bm25_hits):
            # Check for duplicates (same content already from vector search)
            already_exists = any(
                c.content[:100] == doc.page_content[:100] for c in chunks
            )
            if already_exists:
                # Boost the existing chunk's score
                for c in chunks:
                    if c.content[:100] == doc.page_content[:100]:
                        c.score += 1.0 / (rank + 1)
                        c.retrieval_method = "hybrid"
            else:
                chunks.append(RetrievedChunk(
                    content=doc.page_content,
                    source=doc.metadata.get("source", "ICAR Agricultural Handbook"),
                    score=1.0 / (rank + 1),
                    page=doc.metadata.get("page"),
                    retrieval_method="bm25",
                ))

        # Sort by merged score, take top-k
        chunks.sort(key=lambda c: c.score, reverse=True)
        return chunks[:k], {
            "vector_hits": len(vector_results),
            "bm25_hits": len(bm25_results),
            "merged_chunks": len(chunks),
        }

    # ─── Context builder ────────────────────────────────────────────────────────
    def _build_context(self, chunks: List[RetrievedChunk]) -> str:
        """Build a formatted context string from retrieved chunks."""
        if not chunks:
            return ""
        parts = []
        for i, chunk in enumerate(chunks):
            source_label = chunk.source
            if chunk.page:
                source_label += f" (p.{chunk.page})"
            parts.append(f"[DOCUMENT {i+1} — Source: {source_label}]\n{chunk.content.strip()}")
        return "\n\n---\n\n".join(parts)

    # ─── LLM answer with grounding ──────────────────────────────────────────────
    def _generate_with_llm(self, query: str, context: str, intent: QueryIntent, history: List[Dict]) -> str:
        """Send context + query to LLM with strict agricultural grounding prompt."""
        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

        system_content = """You are Kisan Mitra, an expert agricultural AI assistant serving Indian farmers. You are backed by ICAR (Indian Council of Agricultural Research) knowledge.

STRICT RULES — NEVER VIOLATE:
1. Use ONLY the retrieved document context below to answer agricultural factual questions.
2. Do NOT fabricate fertilizer dosages, pesticide names, or soil recommendations.
3. If the context does not contain enough information, say: "I don't have enough verified information in my knowledge base to answer this confidently."
4. Always preserve units exactly as in the source. Convert units when explicitly requested (use: 1 ha = 2.47105 acres).
5. When giving per-acre recommendations, show the calculation: e.g., "260 kg/ha ÷ 2.471 = 105 kg/acre"
6. Distinguish between product weight (kg Urea) and nutrient weight (kg N).
7. Use markdown: **bold** for important values, ## for section headers, bullet lists for steps.
8. Cite sources at the end of every factual answer using exactly the document source names provided.
9. For pest/disease recommendations involving pesticides, always add a safety caution.
10. If this is a multi-turn conversation and the user refers to "it" or "that crop", use context from chat history."""

        messages = [SystemMessage(content=system_content)]

        # Add relevant history (last 4 turns)
        for msg in history[-8:]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        # Current query with context
        user_msg = f"""Retrieved Agricultural Knowledge:
---
{context}
---

User Question: {query}"""
        if intent.area_unit == "acre":
            user_msg += f"\n\nIMPORTANT: The user asked about per-ACRE recommendations. Convert all kg/ha values to kg/acre by dividing by 2.47105. Show the calculation."
        if intent.crop and intent.is_followup:
            user_msg += f"\n\nNote: This appears to be a follow-up question about {intent.crop} (from conversation history)."

        messages.append(HumanMessage(content=user_msg))

        response = self.llm.invoke(messages)
        return response.content

    # ─── No-LLM structured response ─────────────────────────────────────────────
    def _format_retrieved_response(self, query: str, chunks: List[RetrievedChunk], intent: QueryIntent) -> str:
        """Format retrieved chunks as a structured response WITHOUT an LLM."""
        if not chunks:
            return (
                "I don't have enough verified information in my knowledge base to answer this confidently.\n\n"
                "Please contact the Kisan Call Center at **1800-180-1551** (free, toll-free) for expert advice."
            )

        # Build response from top chunks
        top_chunks = chunks[:3]
        response_parts = []

        # Extract most relevant sentences from chunks
        for chunk in top_chunks:
            content = chunk.content.strip()
            # Find sentences most relevant to query keywords
            query_words = set(query.lower().split())
            sentences = [s.strip() for s in re.split(r'[.!?\n]', content) if len(s.strip()) > 20]
            scored = []
            for sent in sentences:
                sent_words = set(sent.lower().split())
                overlap = len(query_words & sent_words)
                if overlap > 0:
                    scored.append((overlap, sent))
            scored.sort(reverse=True)
            relevant = [s for _, s in scored[:8]]
            if relevant:
                response_parts.append("\n".join(relevant))
            else:
                # Use beginning of chunk
                response_parts.append(content[:600])

        full_text = "\n\n".join(response_parts)

        # Apply unit conversion if needed
        full_text = apply_unit_conversions(full_text, intent)

        # Build sources section
        unique_sources = list(dict.fromkeys(c.source for c in chunks[:3]))
        sources_str = "\n".join(f"📄 {s}" for s in unique_sources)

        return f"{full_text}\n\n---\n**Sources:**\n{sources_str}"

    # ─── Public ask method ──────────────────────────────────────────────────────
    def ask(self, query: str, session_id: Optional[str] = None) -> dict:
        """
        Main Q&A interface.
        Returns: answer, sources, engine, debug_info, session_id
        """
        start_time = time.time()

        # Session management
        if not session_id:
            session_id = str(uuid.uuid4())
        if session_id not in _sessions:
            _sessions[session_id] = []
        history = _sessions[session_id]

        # Extract intent
        intent = extract_intent(query, history)

        # Hybrid retrieval
        chunks, retrieval_debug = self._hybrid_retrieve(query, k=5)
        sources = list(dict.fromkeys(c.source for c in chunks)) if chunks else ["ICAR Agricultural Handbook"]

        # Build context
        context = self._build_context(chunks)

        # Generate answer
        answer = ""
        engine = "retrieval_only"

        if self.llm and context:
            try:
                answer = self._generate_with_llm(query, context, intent, history)
                engine = self.llm_provider or "llm"
            except Exception as e:
                logger.error(f"LLM generation error: {e}")
                answer = self._format_retrieved_response(query, chunks, intent)
                engine = "retrieval_fallback"
        else:
            answer = self._format_retrieved_response(query, chunks, intent)
            engine = "retrieval_only"

        # Apply unit conversion if LLM answered (LLM should do it, but safety net)
        if engine != "retrieval_only":
            answer = apply_unit_conversions(answer, intent)

        # Update session history
        _sessions[session_id].append({"role": "user", "content": query})
        _sessions[session_id].append({"role": "assistant", "content": answer})
        # Keep last 20 messages
        if len(_sessions[session_id]) > 20:
            _sessions[session_id] = _sessions[session_id][-20:]

        latency_ms = round((time.time() - start_time) * 1000)

        debug_info = {
            "query": query,
            "intent": {
                "crop": intent.crop,
                "fertilizer": intent.fertilizer,
                "area_unit": intent.area_unit,
                "area_value": intent.area_value,
                "topic": intent.topic,
                "is_followup": intent.is_followup,
            },
            "retrieval": retrieval_debug,
            "chunks_used": len(chunks),
            "top_chunk_scores": [round(c.score, 3) for c in chunks[:3]],
            "engine": engine,
            "latency_ms": latency_ms,
            "embeddings_model": self.embeddings_model_name,
        }

        return {
            "answer": answer,
            "sources": sources,
            "engine": engine,
            "session_id": session_id,
            "debug": debug_info,
        }

    def get_health(self) -> dict:
        return {
            "status": "OK",
            "service": "AgroKart Real RAG Engine",
            "chroma_loaded": self.vector_store is not None,
            "documents_indexed": len(self.all_documents),
            "bm25_indexed": self.bm25.bm25 is not None,
            "llm_provider": self.llm_provider or "none",
            "embeddings_model": self.embeddings_model_name,
        }


# ─── Global singleton ───────────────────────────────────────────────────────────
rag_engine = AgroKartRAG()
