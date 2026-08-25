"""
AgroKart RAG API — FastAPI server
Endpoints: /chat, /ingest, /debug, /health, /session/{id}/clear
"""
import os
import logging
import time
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

from src.rag_engine import rag_engine, _sessions

app = FastAPI(
    title="AgroKart RAG + AI Service",
    description="Real Retrieval-Augmented Generation for Agricultural Q&A. Hybrid vector+BM25 retrieval.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response models ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    ml_recommendation: Optional[str] = None  # backward-compat

class ChatResponse(BaseModel):
    success: bool = True
    answer: str
    sources: List[str]
    engine: str
    session_id: str

class IngestRequest(BaseModel):
    doc_dir: str = "./data/agricultural_docs"

class SessionClearResponse(BaseModel):
    success: bool
    message: str

class EvidenceRequest(BaseModel):
    crop: str
    region: Optional[str] = None
    season: Optional[str] = None
    document: Optional[str] = None
    n_kg_ha: Optional[float] = None
    p2o5_kg_ha: Optional[float] = None
    k2o_kg_ha: Optional[float] = None

class EvidenceResponse(BaseModel):
    success: bool = True
    evidence: Dict[str, Any]


# ─── Health endpoint ───────────────────────────────────────────────────────────

@app.get("/")
@app.get("/health")
def health_check():
    """Service health and capabilities."""
    return rag_engine.get_health()


# ─── Chat endpoint ─────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    Answer an agricultural question using real hybrid RAG retrieval.

    Supports:
    - Multi-turn conversation via session_id
    - Unit conversion (ha ↔ acre detected automatically)
    - Hybrid vector + BM25 retrieval
    - LLM grounding (if API key configured)
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    query = request.message.strip()

    # Enrich query with ML recommendation context if provided (backward compat)
    if request.ml_recommendation:
        query = f"Soil Analysis Context: {request.ml_recommendation}\n\nFarmer Question: {query}"

    try:
        result = rag_engine.ask(query, session_id=request.session_id)
        return ChatResponse(
            success=True,
            answer=result["answer"],
            sources=result["sources"],
            engine=result["engine"],
            session_id=result["session_id"],
        )
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="I couldn't process that right now. Please try again."
        )


# ─── Evidence endpoint ─────────────────────────────────────────────────────────

@app.post("/evidence", response_model=EvidenceResponse)
def get_evidence(request: EvidenceRequest):
    """
    Retrieve official document supporting evidence for a structured recommendation.
    """
    if not request.crop or not request.crop.strip():
        return EvidenceResponse(
            success=True,
            evidence={
                "available": False,
                "source": None,
                "supportingText": None,
                "retrievalType": None,
            }
        )

    ev = rag_engine.retrieve_evidence(
        crop=request.crop.strip(),
        region=request.region,
        season=request.season,
        document=request.document,
        n_kg_ha=request.n_kg_ha,
        p2o5_kg_ha=request.p2o5_kg_ha,
        k2o_kg_ha=request.k2o_kg_ha,
    )
    return EvidenceResponse(success=True, evidence=ev)


# ─── Debug endpoint (dev-only) ─────────────────────────────────────────────────

@app.post("/debug/chat")
def debug_chat(request: ChatRequest):
    """
    Developer-only endpoint: returns full retrieval debug info.
    Do NOT expose this in production to users.
    """
    query = request.message.strip()
    result = rag_engine.ask(query, session_id=request.session_id)
    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "engine": result["engine"],
        "session_id": result["session_id"],
        "debug": result.get("debug", {}),
    }


# ─── Ingest endpoint ───────────────────────────────────────────────────────────

@app.post("/ingest")
def ingest_documents(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Trigger document ingestion from a directory.
    Rebuilds the Chroma vector database with real sentence-transformer embeddings.
    """
    doc_dir = request.doc_dir
    if not os.path.exists(doc_dir):
        raise HTTPException(status_code=404, detail=f"Directory not found: {doc_dir}")

    def run_ingestion():
        try:
            from src.ingestion import ingest_documents as do_ingest
            do_ingest(doc_dir=doc_dir, chroma_dir=rag_engine.chroma_dir)
            logger.info("✓ Re-initializing RAG engine after ingestion...")
            rag_engine._initialize()
        except Exception as e:
            logger.error(f"Ingestion error: {e}", exc_info=True)

    background_tasks.add_task(run_ingestion)
    return {"success": True, "message": f"Ingestion started from {doc_dir}. Check /health for status."}


# ─── Session management ─────────────────────────────────────────────────────────

@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    """Clear conversation history for a session."""
    if session_id in _sessions:
        del _sessions[session_id]
        return {"success": True, "message": f"Session {session_id} cleared"}
    return {"success": False, "message": "Session not found"}

@app.get("/session/{session_id}/history")
def get_session_history(session_id: str):
    """Get conversation history for a session (dev use)."""
    history = _sessions.get(session_id, [])
    return {"session_id": session_id, "turns": len(history) // 2, "history": history}


# ─── Evaluation dataset endpoint ───────────────────────────────────────────────

@app.get("/eval/dataset")
def get_eval_dataset():
    """Return the evaluation question set for testing retrieval quality."""
    return {
        "dataset": [
            # Simple factual
            {"q": "What percentage of nitrogen does urea contain?", "category": "factual"},
            {"q": "What does DAP stand for and what are its contents?", "category": "factual"},
            {"q": "What is the composition of MOP fertilizer?", "category": "factual"},
            # Dosage
            {"q": "How much urea should I apply for wheat per hectare?", "category": "dosage"},
            {"q": "What is the recommended DAP dose for wheat?", "category": "dosage"},
            {"q": "How much MOP for rice per acre?", "category": "dosage_unit_conversion"},
            {"q": "How much urea for 1 acre wheat?", "category": "dosage_unit_conversion"},
            {"q": "How much gypsum for sodic soil?", "category": "dosage"},
            # Unit conversion
            {"q": "Convert 260 kg urea per hectare to per acre", "category": "unit_conversion"},
            {"q": "What is 120 kg N/ha in kg/acre?", "category": "unit_conversion"},
            # Multi-turn (context-dependent)
            {"q": "How much urea for cotton? [turn 1]", "category": "multiturn_t1"},
            {"q": "What about for 2 acres? [turn 2 — needs cotton context]", "category": "multiturn_t2"},
            # Soil
            {"q": "How to treat acidic soil with pH 5?", "category": "soil"},
            {"q": "What should I apply to alkaline sodic soil?", "category": "soil"},
            {"q": "What is the ideal pH range for wheat?", "category": "soil"},
            # Pest
            {"q": "My rice has yellow patches with hoppers — what is it?", "category": "pest"},
            {"q": "How to control yellow rust in wheat?", "category": "pest"},
            {"q": "My cotton leaves are curling down — why?", "category": "pest"},
            # Insufficient information
            {"q": "How much fertilizer should I use?", "category": "insufficient_info"},
            {"q": "What is the best fertilizer?", "category": "insufficient_info"},
            # Not in knowledge base
            {"q": "What is the weather tomorrow?", "category": "out_of_domain"},
            {"q": "Tell me a joke about farming", "category": "out_of_domain"},
            # Irrigation
            {"q": "When should I irrigate wheat?", "category": "irrigation"},
            {"q": "How many irrigations does rice need?", "category": "irrigation"},
        ]
    }
