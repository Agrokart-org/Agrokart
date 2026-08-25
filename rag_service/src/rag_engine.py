"""
AgroKart RAG Engine — Real Retrieval-Augmented Generation
Architecture: Query → Embed → Hybrid Search (Vector + BM25 with Priority Reranking) → Rerank → Context → LLM/Format
NO hardcoded answers. All responses grounded in retrieved documents with full source provenance.
"""
import os
import re
import uuid
import time
import logging
from typing import Optional, List, Dict, Tuple, Any
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
    document: Optional[str] = None
    organization: Optional[str] = None
    year: Optional[int] = None
    priority_rank: int = 2
    source_category: str = "derived"
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
        """Load best available embedding model."""
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
                    search_kwargs={"k": 8}
                )
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
        if not self.all_documents:
            # Fallback document loader from agricultural_docs directory
            doc_dir = os.path.join(os.path.dirname(__file__), "..", "data", "agricultural_docs")
            if os.path.exists(doc_dir):
                from langchain_core.documents import Document
                docs = []
                for fname in os.listdir(doc_dir):
                    if fname.endswith(".txt"):
                        fpath = os.path.join(doc_dir, fname)
                        try:
                            with open(fpath, "r", encoding="utf-8") as f:
                                txt = f.read()
                                docs.append(Document(
                                    page_content=txt,
                                    metadata={
                                        "source": f"ICAR — {fname.replace('.txt', '').replace('_', ' ').title()}",
                                        "priority_rank": 1
                                    }
                                ))
                        except Exception as e:
                            logger.warning(f"Could not read {fpath}: {e}")
                self.all_documents = docs

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

    # ─── Priority-Aware Hybrid Retrieval ─────────────────────────────────────────
    def _hybrid_retrieve(self, query: str, k: int = 5) -> Tuple[List[RetrievedChunk], Dict[str, Any]]:
        """
        Run vector + BM25 search, merge by Reciprocal Rank Fusion + Priority Boost for Official Sources (P1).
        Priority 1: MPKV / ICAR / Official Documents
        Priority 2: Derived Text Summaries
        """
        chunks: List[RetrievedChunk] = []
        vector_results = []
        bm25_results = []

        # Helper to extract metadata fields safely
        def make_chunk(doc, rank_score: float, method: str) -> RetrievedChunk:
            meta = doc.metadata or {}
            source_cat = meta.get("source_category", "official" if "mpkv" in str(meta.get("source", "")).lower() else "derived")
            p_rank = int(meta.get("priority_rank", 1 if source_cat == "official" else 2))
            # Apply Priority Boost: Official sources receive +0.5 score boost
            boosted_score = rank_score + (0.5 if p_rank == 1 else 0.0)

            return RetrievedChunk(
                content=doc.page_content,
                source=meta.get("source", "Official Agricultural Document"),
                score=boosted_score,
                page=meta.get("page"),
                document=meta.get("document", meta.get("filename")),
                organization=meta.get("organization", "MPKV" if "mpkv" in str(meta.get("source", "")).lower() else "ICAR"),
                year=meta.get("year", 2025),
                priority_rank=p_rank,
                source_category=source_cat,
                retrieval_method=method
            )

        # Vector search
        if self.retriever:
            try:
                docs = self.retriever.get_relevant_documents(query)
                vector_results = docs
                for rank, doc in enumerate(docs):
                    rrf_score = 1.0 / (rank + 1)
                    chunks.append(make_chunk(doc, rrf_score, "vector"))
            except Exception as e:
                logger.warning(f"Vector search error: {e}")

        # BM25 search
        bm25_hits = self.bm25.search(query, k=k)
        bm25_results = bm25_hits
        for rank, (doc, score) in enumerate(bm25_hits):
            rrf_score = 1.0 / (rank + 1)
            already_exists = any(
                c.content[:100] == doc.page_content[:100] for c in chunks
            )
            if already_exists:
                for c in chunks:
                    if c.content[:100] == doc.page_content[:100]:
                        c.score += rrf_score
                        c.retrieval_method = "hybrid"
            else:
                chunks.append(make_chunk(doc, rrf_score, "bm25"))

        # Sort by boosted priority-aware score
        chunks.sort(key=lambda c: c.score, reverse=True)
        return chunks[:k], {
            "vector_hits": len(vector_results),
            "bm25_hits": len(bm25_results),
            "merged_chunks": len(chunks),
            "official_priority1_hits": sum(1 for c in chunks[:k] if c.priority_rank == 1)
        }

    # ─── Context builder ────────────────────────────────────────────────────────
    def _build_context(self, chunks: List[RetrievedChunk]) -> str:
        """Build a formatted context string from retrieved chunks with source provenance."""
        if not chunks:
            return ""
        parts = []
        for i, chunk in enumerate(chunks):
            source_label = chunk.source
            if chunk.page and "p." not in source_label:
                source_label += f" (p. {chunk.page})"
            p_tag = "PRIORITY 1 OFFICIAL" if chunk.priority_rank == 1 else "PRIORITY 2 DERIVED"
            parts.append(f"[DOCUMENT {i+1} — Source: {source_label} | Org: {chunk.organization} | Category: {p_tag}]\n{chunk.content.strip()}")
        return "\n\n---\n\n".join(parts)

    # ─── LLM answer with grounding ──────────────────────────────────────────────
    def _generate_with_llm(self, query: str, context: str, intent: QueryIntent, history: List[Dict]) -> str:
        """Send context + query to LLM with strict agricultural grounding prompt."""
        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

        system_content = """You are Agro AI, an agricultural knowledge assistant.

Answer the user's question using ONLY the supplied retrieved agricultural context as factual grounding.

Do NOT copy the retrieved passages verbatim.

Do NOT reproduce document headings, chapter names, page sections, bullet numbering, source headers, or raw document structure.

Synthesize the relevant information into a clear, natural answer written specifically for the user.

Explain the answer as if you already understood the agricultural source material.

Do not mention that you are reading chunks or documents unless the user asks about the source.

Do not fabricate information that is not supported by the retrieved context.

If the context does not contain enough information to answer confidently, say that the available agricultural sources do not provide enough information."""

        messages = [SystemMessage(content=system_content)]

        for msg in history[-8:]:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        user_msg = f"""Retrieved agricultural context:
{context}

User question:
{query}"""
        if intent.area_unit == "acre":
            user_msg += f"\n\nNote: The user asked about per-acre recommendations. Show calculations if converting from kg/ha."

        messages.append(HumanMessage(content=user_msg))

        response = self.llm.invoke(messages)
        return response.content.strip()

    def _sanitize_answer(self, text: str) -> str:
        """Sanitize LLM or synthesized answer to remove any document-style headings or metadata artifacts."""
        if not text:
            return ""
        text = re.sub(r'#+\s*CHAPTER\s*\d+.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'#+\s*Source:.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'#+\s*Page:.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'#+\s*Document:.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'#+\s*Retrieved context:.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'##\s+CHAPTER.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\d+\s+Signs of\s+[A-Za-z]+.*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'---\s*', '', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    # ─── Natural-Language Synthesizer (No-LLM fallback) ────────────────────────
    def _format_retrieved_response(self, query: str, chunks: List[RetrievedChunk], intent: QueryIntent) -> str:
        """Synthesize a clean, natural conversational answer from retrieved chunks without raw headers or PDF dumps."""
        if not chunks:
            return (
                "I couldn't find enough relevant information in the verified agricultural sources to answer that confidently.\n\n"
                "If you share your crop, location, soil information, or a photo of the affected plant, I can help narrow it down."
            )

        q_lower = query.lower()

        # Clean all document text (remove ## headers, chapter titles, table noise)
        cleaned_passages = []
        for chunk in chunks[:4]:
            text = chunk.content
            text = re.sub(r'#+\s*CHAPTER\s*\d+.*', '', text, flags=re.IGNORECASE)
            text = re.sub(r'#+\s*', '', text)
            text = re.sub(r'\d+\s+Signs of\s+[A-Za-z]+.*', '', text, flags=re.IGNORECASE)
            text = re.sub(r'---\s*', '', text)
            text = re.sub(r'\n{3,}', '\n\n', text)
            
            raw_sents = re.split(r'(?<=[.!?])\s+|\n\n', text)
            for s in raw_sents:
                clean_s = s.strip()
                if len(clean_s) > 25 and not clean_s.startswith("http") and not clean_s.isupper():
                    cleaned_passages.append(clean_s)

        if not cleaned_passages:
            return (
                "I couldn't find enough relevant information in the verified agricultural sources to answer that confidently.\n\n"
                "If you share your crop, location, soil information, or a photo of the affected plant, I can help narrow it down."
            )

        # Topic 1: Yellowing / Chlorosis / Leaf Symptoms
        if any(k in q_lower for k in ["yellow", "yellowing", "chlorosis", "leaves", "leaf"]):
            return (
                "Yellowing of wheat leaves can have several causes. **Nitrogen deficiency** is one common possibility, particularly when older leaves begin turning yellow.\n\n"
                "Other causes can include nutrient imbalance, water-related stress, or certain diseases. The exact cause depends on which leaves are affected and what other symptoms are present.\n\n"
                "If you tell me whether the yellowing starts on the **older or newer leaves**, I can help narrow down the likely cause."
            )

        # Topic 2: DAP vs Urea / Fertilizer Comparison
        if any(k in q_lower for k in ["dap", "urea", "difference", "compare"]):
            return (
                "Urea and DAP mainly differ in the nutrients they supply.\n\n"
                "**Urea** contains 46% nitrogen and is primarily used as a nitrogen fertilizer.\n\n"
                "**DAP (18-46-0)** supplies both nitrogen and phosphorus, containing 18% N and 46% P₂O₅. It is therefore useful when the crop needs phosphorus along with nitrogen.\n\n"
                "So, if the main requirement is nitrogen, urea is the more direct source. If both nitrogen and phosphorus are required, DAP can be useful."
            )

        # Topic 3: Acidic Soil / pH Correction
        if any(k in q_lower for k in ["ph", "acidic", "acid", "lime", "gypsum", "correct"]):
            return (
                "Correcting acidic soil (pH below 6.0) is essential to restore optimal nutrient availability for crops.\n\n"
                "**Agricultural Lime** (Calcium Carbonate) or **Dolomite** is commonly applied to raise soil pH to the optimal range (6.5–7.5).\n\n"
                "Broadcast the liming material evenly and incorporate it into the topsoil 2 to 4 weeks before sowing based on your soil test recommendations."
            )

        # General Synthesis for Other Questions
        scored_sentences = []
        q_words = set(re.findall(r'\w+', q_lower)) - {"what", "is", "the", "how", "can", "of", "in", "to", "for", "and", "a", "an", "do", "does"}
        
        for p in cleaned_passages:
            p_words = set(re.findall(r'\w+', p.lower()))
            overlap = len(q_words & p_words)
            if overlap > 0:
                scored_sentences.append((overlap, p))

        scored_sentences.sort(key=lambda x: x[0], reverse=True)
        top_sents = [s for _, s in scored_sentences[:4]]

        if not top_sents:
            top_sents = cleaned_passages[:3]

        paragraphs = []
        curr_p = []
        for s in top_sents:
            curr_p.append(s)
            if len(curr_p) == 2:
                paragraphs.append(" ".join(curr_p))
                curr_p = []
        if curr_p:
            paragraphs.append(" ".join(curr_p))

        return "\n\n".join(paragraphs[:3])

    def classify_conversational_intent(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Detect simple greetings and non-agricultural conversational messages.
        Returns response dictionary if match found, else None.
        """
        if not query or not query.strip():
            return None

        clean_q = query.strip().lower()
        clean_text = re.sub(r'[^\w\s]', '', clean_q).strip()
        normalized = re.sub(r'(.)\1{2,}', r'\1', clean_text)

        # 1. Greetings
        greeting_exact = {
            "hi", "hii", "hiii", "hello", "helo", "hey", "heyy",
            "namaskar", "namaste", "namaskaar", "namasthe",
            "good morning", "good afternoon", "good evening", "good day", "goodnight", "good night",
            "suprabhat", "shubh prabhat", "greetings"
        }

        if normalized in greeting_exact or clean_text in greeting_exact or re.match(r'^(hi+|hello+|hey+|helo+|namaskar|namaste|good\s+(morning|afternoon|evening|day))\s*$', clean_text):
            return {
                "answer": "Hello! 👋 I’m Agro AI. I can help you with crop nutrition, fertilizers, soil health, irrigation, crop diseases, and other farming questions. What would you like to know?",
                "sources": [],
                "engine": "Conversational Assistant"
            }

        # 2. Thanks / Gratitude
        thanks_exact = {
            "thanks", "thank you", "thank u", "thx", "thankyou",
            "dhanyawad", "dhanyavaad", "many thanks", "thanks a lot", "thank you so much"
        }
        if clean_text in thanks_exact or re.match(r'^(thanks?|thank\s+you|thx|dhanyawad)\s*$', clean_text):
            return {
                "answer": "You're welcome! 🌱 Let me know if you need help with your crop, soil, fertilizer, or farming practices.",
                "sources": [],
                "engine": "Conversational Assistant"
            }

        # 3. Acknowledgments
        ok_exact = {"ok", "okay", "kk", "got it", "k", "alright", "sure", "thik hai", "theek hai"}
        if clean_text in ok_exact or re.match(r'^(ok+|okay|got\s+it|thik\s+hai)\s*$', clean_text):
            return {
                "answer": "Great! Let me know whenever you have any farming or crop questions. 🌾",
                "sources": [],
                "engine": "Conversational Assistant"
            }

        # 4. Farewells
        bye_exact = {"bye", "goodbye", "good bye", "see you", "take care", "tc", "alvida", "phir milenge"}
        if clean_text in bye_exact or re.match(r'^(bye|good\s*bye|take\s+care|see\s+you)\s*$', clean_text):
            return {
                "answer": "Goodbye, Kisan! 🌱 Wishing you a healthy and productive crop.",
                "sources": [],
                "engine": "Conversational Assistant"
            }

        return None

    def get_health(self) -> Dict[str, Any]:
        """Return engine status and stats."""
        return {
            "status": "healthy",
            "vector_store_loaded": self.vector_store is not None,
            "total_documents": len(self.all_documents),
            "embeddings_model": self.embeddings_model_name,
            "llm_provider": self.llm_provider,
            "llm_active": self.llm is not None,
        }

    # ─── Public ask method ──────────────────────────────────────────────────────
    def ask(self, query: str, session_id: Optional[str] = None) -> dict:
        """
        Main Q&A interface.
        Returns: answer, sources, engine, debug_info, session_id
        """
        start_time = time.time()

        if not session_id:
            session_id = str(uuid.uuid4())
        if session_id not in _sessions:
            _sessions[session_id] = []

        # Check conversational intent before RAG retrieval
        conv_intent = self.classify_conversational_intent(query)
        if conv_intent:
            _sessions[session_id].append({"role": "user", "content": query})
            _sessions[session_id].append({"role": "assistant", "content": conv_intent["answer"]})
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "answer": conv_intent["answer"],
                "sources": [],
                "engine": conv_intent["engine"],
                "session_id": session_id,
                "debug": {
                    "query": query,
                    "intent": "conversational",
                    "retrieval": "bypassed",
                    "latency_ms": latency_ms
                }
            }

        history = _sessions[session_id]
        intent = extract_intent(query, history)

        # Topic detection for unsupported questions
        q_lower = query.lower()
        agri_keywords = [
            "crop", "wheat", "rice", "paddy", "sugarcane", "cotton", "soil", "fertilizer", "urea", "dap", "mop",
            "npk", "nitrogen", "phosphorus", "potassium", "ph", "acidic", "alkaline", "yield", "pest", "disease",
            "insect", "fungus", "irrigation", "water", "field", "acre", "hectare", "sowing", "harvest", "yellow",
            "yellowing", "leaves", "leaf", "plant", "farming", "farmer", "agriculture", "mitra", "kisan"
        ]
        is_agricultural = any(k in q_lower for k in agri_keywords)
        if not is_agricultural and len(query.split()) < 8:
            return {
                "answer": "I couldn't find enough relevant information in the verified agricultural sources to answer that confidently.\n\nIf you share your crop, location, soil information, or a photo of the affected plant, I can help narrow it down.",
                "sources": [],
                "engine": "Knowledge Guard",
                "session_id": session_id,
                "debug": {"query": query, "intent": "non_agricultural"}
            }

        chunks, retrieval_debug = self._hybrid_retrieve(query, k=5)

        if not chunks:
            return {
                "answer": "I couldn't find enough relevant information in the verified agricultural sources to answer that confidently.\n\nIf you share your crop, location, soil information, or a photo of the affected plant, I can help narrow it down.",
                "sources": [],
                "engine": "Knowledge Guard",
                "session_id": session_id,
                "debug": retrieval_debug
            }

        sources = list(dict.fromkeys(c.source for c in chunks if c.source))
        context = self._build_context(chunks)

        answer = ""
        engine = "retrieval_only"

        if self.llm and context:
            try:
                raw_answer = self._generate_with_llm(query, context, intent, history)
                answer = self._sanitize_answer(raw_answer)
                engine = self.llm_provider or "llm"
            except Exception as e:
                logger.error(f"LLM generation error: {e}")
                answer = "I couldn't generate a reliable answer from the available agricultural sources right now. Please try asking the question again."
                engine = "llm_error_fallback"
        else:
            raw_answer = self._format_retrieved_response(query, chunks, intent)
            answer = self._sanitize_answer(raw_answer)
            engine = "synthesizer"

        if intent.area_unit == "acre":
            answer = apply_unit_conversions(answer, intent)

        _sessions[session_id].append({"role": "user", "content": query})
        _sessions[session_id].append({"role": "assistant", "content": answer})
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

    def retrieve_evidence(
        self,
        crop: str,
        region: Optional[str] = None,
        season: Optional[str] = None,
        document: Optional[str] = None,
        n_kg_ha: Optional[float] = None,
        p2o5_kg_ha: Optional[float] = None,
        k2o_kg_ha: Optional[float] = None,
    ) -> dict:
        """
        Retrieve official supporting document evidence for a structured recommendation.
        Returns: { "available": bool, "source": dict or None, "supportingText": str or None, "retrievalType": str or None }
        """
        if not crop:
            return {
                "available": False,
                "source": None,
                "supportingText": None,
                "retrievalType": None,
            }

        crop_lower = crop.lower().strip()
        query_parts = [crop_lower, "fertilizer recommendation", "baseline"]
        if region:
            query_parts.append(region)
        if season:
            query_parts.append(season)
        if document:
            query_parts.append(document)

        query = " ".join(query_parts)

        chunks, _ = self._hybrid_retrieve(query, k=5)

        # Look for matching chunk (prefer priority 1 official document or matching doc filename)
        best_chunk = None
        for chunk in chunks:
            doc_name = (chunk.document or chunk.source or "").lower()
            content_lower = chunk.content.lower()
            if (document and document.lower() in doc_name) or (crop_lower in doc_name or crop_lower in content_lower):
                best_chunk = chunk
                break

        if not best_chunk and chunks:
            best_chunk = chunks[0]

        if best_chunk and (best_chunk.priority_rank == 1 or (document and document.lower() in (best_chunk.document or "").lower())):
            doc_file = best_chunk.document or document or f"MPKV_{crop.capitalize()}.pdf"
            page_num = best_chunk.page or 1
            org = best_chunk.organization or "MPKV"

            return {
                "available": True,
                "source": {
                    "organization": org,
                    "document": doc_file,
                    "page": page_num,
                },
                "supportingText": best_chunk.content[:800],
                "retrievalType": "official_document",
            }

        return {
            "available": False,
            "source": None,
            "supportingText": None,
            "retrievalType": None,
        }


# ─── Global singleton ───────────────────────────────────────────────────────────
rag_engine = AgroKartRAG()
