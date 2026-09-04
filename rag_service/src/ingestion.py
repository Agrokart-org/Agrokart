"""
AgroKart Document Ingestion Pipeline
Processes TXT/PDF agricultural docs (recursive) → chunks with source provenance & priority → embeddings → Chroma DB
Extracts structured recommendations into data/knowledge/official_recommendations.json
"""
import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Any

from src.extractor import run_extraction, extract_year

logger = logging.getLogger(__name__)


def _extract_metadata(content: str, filename: str, filepath: str, page_num: int = 1) -> Dict[str, Any]:
    """Extract provenance, priority, topics, and crops metadata from content and file path."""
    content_lower = content.lower()
    filename_lower = filename.lower()
    filepath_lower = str(filepath).lower()

    # Source Priority Classification
    is_official = ("official" in filepath_lower or "mpkv" in filename_lower or "mpkv" in filepath_lower)
    source_category = "official" if is_official else "derived"
    priority_rank = 1 if is_official else 2

    # Organization Identification
    if "mpkv" in filename_lower or "mpkv" in filepath_lower:
        org = "MPKV"
    elif "icar" in filename_lower or "iari" in filename_lower:
        org = "ICAR"
    elif is_official:
        org = "Official Agricultural Authority"
    else:
        org = "Agricultural Knowledge Base"

    # Year Extraction
    year = extract_year(content, filename)

    # Topic detection
    topics = []
    if any(w in content_lower for w in ["urea", "nitrogen", "npk", "fertilizer", "dap", "mop"]):
        topics.append("fertilizer")
    if any(w in content_lower for w in ["pest", "disease", "insect", "fungicide", "herbicide"]):
        topics.append("pest_management")
    if any(w in content_lower for w in ["irrigation", "water", "drip", "sprinkler"]):
        topics.append("irrigation")
    if any(w in content_lower for w in ["soil", "ph", "acidic", "alkaline", "organic carbon"]):
        topics.append("soil_health")

    # Crop detection
    crops = []
    for crop in ["wheat", "rice", "paddy", "cotton", "sugarcane", "maize", "tomato", "potato", "soybean", "groundnut", "onion"]:
        if crop in content_lower or crop in filename_lower:
            crops.append(crop)

    # Formatted Provenance String
    clean_name = filename.replace("_", " ").replace(".txt", "").replace(".pdf", "").title()
    if page_num > 0 and filename.endswith(".pdf"):
        source_provenance = f"{org} — {filename} (p. {page_num})"
    else:
        source_provenance = f"{org} — {filename}"

    return {
        "source": source_provenance,
        "organization": org,
        "document": filename,
        "document_title": clean_name,
        "page": page_num,
        "year": year,
        "source_category": source_category,
        "priority_rank": priority_rank,
        "filename": filename,
        "topics": ",".join(topics),
        "crops": ",".join(set(crops)),
        "url": ""
    }


def ingest_documents(
    doc_dir: str = "./data/agricultural_docs",
    chroma_dir: str = "./chroma_db",
    chunk_size: int = 800,
    chunk_overlap: int = 120,
):
    """
    Full ingestion pipeline:
    1. Load TXT + PDF files recursively from doc_dir
    2. Extract page-by-page text for PDFs with page metadata
    3. Attach source provenance (organization, document, page, year, priority_rank)
    4. Split into chunks while preserving provenance
    5. Generate sentence-transformer / OpenAI embeddings
    6. Store in Chroma DB
    7. Generate official_recommendations.json
    """
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_core.documents import Document

    logger.info(f"📚 Starting recursive ingestion pipeline from: {doc_dir}")

    all_docs: List[Document] = []
    doc_path = Path(doc_dir)

    # ── 1. Load TXT files recursively ──────────────────────────────────────────
    txt_files = list(doc_path.rglob("*.txt"))
    for txt_file in txt_files:
        try:
            content = txt_file.read_text(encoding="utf-8", errors="replace")
            if content.strip():
                meta = _extract_metadata(content, txt_file.name, str(txt_file), page_num=1)
                all_docs.append(Document(page_content=content, metadata=meta))
                logger.info(f"  ✓ Loaded TXT ({meta['source_category'].upper()} P{meta['priority_rank']}): {txt_file.name}")
        except Exception as e:
            logger.warning(f"  ⚠ Failed to load TXT {txt_file.name}: {e}")

    # ── 2. Load PDF files recursively (Page by Page) ───────────────────────────
    pdf_files = list(doc_path.rglob("*.pdf"))
    for pdf_file in pdf_files:
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(pdf_file))
            pdf_page_count = len(reader.pages)

            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    meta = _extract_metadata(page_text, pdf_file.name, str(pdf_file), page_num=i + 1)
                    meta["page_count"] = pdf_page_count
                    all_docs.append(Document(page_content=page_text, metadata=meta))

            logger.info(f"  ✓ Loaded PDF ({len(reader.pages)} pages, P1 Official): {pdf_file.name}")
        except Exception as e:
            logger.warning(f"  ⚠ Failed to load PDF {pdf_file.name}: {e}")

    if not all_docs:
        logger.error("❌ No documents found! Check doc_dir path.")
        return False

    logger.info(f"  Total raw document sections/pages: {len(all_docs)}")

    # ── 3. Split into chunks ───────────────────────────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n### ", "\n## ", "\n# ", "\n", ". ", " "],
    )
    chunks = splitter.split_documents(all_docs)

    logger.info(f"  ✓ Created {len(chunks)} chunks with full provenance metadata")

    # ── 4. Load embeddings ─────────────────────────────────────────────────────
    openai_key = os.getenv("OPENAI_API_KEY", "")
    embeddings = None

    if openai_key and not openai_key.startswith("sk-your") and len(openai_key) > 20:
        try:
            from langchain_openai import OpenAIEmbeddings
            embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=openai_key)
            logger.info("  🔑 Using OpenAI embeddings")
        except Exception as e:
            logger.warning(f"  OpenAI embeddings failed: {e}")

    if embeddings is None:
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
            logger.info("  🤗 Using sentence-transformers/all-MiniLM-L6-v2")
        except Exception as e:
            logger.error(f"  ❌ Could not load sentence-transformers: {e}")
            return False

    # ── 5. Write to Chroma DB ──────────────────────────────────────────────────
    from langchain_community.vectorstores import Chroma
    import shutil

    if os.path.exists(chroma_dir):
        shutil.rmtree(chroma_dir)
        logger.info(f"  🗑  Removed old Chroma DB at {chroma_dir}")

    logger.info(f"  🔤 Generating embeddings for {len(chunks)} chunks...")

    batch_size = 50
    vector_store = None
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        if vector_store is None:
            vector_store = Chroma.from_documents(
                documents=batch,
                embedding=embeddings,
                persist_directory=chroma_dir,
            )
        else:
            vector_store.add_documents(batch)
        logger.info(f"    Embedded {min(i + batch_size, len(chunks))}/{len(chunks)} chunks...")

    logger.info(f"  ✓ Chroma DB ready at '{chroma_dir}' with {len(chunks)} chunks")

    # ── 6. Extract Structured Recommendations JSON ────────────────────────────
    official_dir = os.path.join(doc_dir, "official") if os.path.exists(os.path.join(doc_dir, "official")) else doc_dir
    json_path = os.path.join(os.path.dirname(doc_dir), "knowledge", "official_recommendations.json")
    try:
        run_extraction(official_dir=official_dir, output_path=json_path)
    except Exception as e:
        logger.warning(f"Extraction warning: {e}")

    return True


if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv
    load_dotenv()

    doc_dir = sys.argv[1] if len(sys.argv) > 1 else "./data/agricultural_docs"
    success = ingest_documents(doc_dir=doc_dir)
    sys.exit(0 if success else 1)
