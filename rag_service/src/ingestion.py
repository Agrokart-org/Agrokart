"""
AgroKart Document Ingestion Pipeline
Processes TXT/PDF agricultural docs → chunks with metadata → real embeddings → Chroma DB
"""
import os
import logging
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)


def _extract_metadata(content: str, filename: str) -> dict:
    """Extract topic metadata from document content for filtering."""
    content_lower = content.lower()
    filename_lower = filename.lower()

    topics = []
    crops = []

    # Topic detection
    if any(w in content_lower for w in ["urea", "nitrogen", "npk", "fertilizer", "dap", "mop"]):
        topics.append("fertilizer")
    if any(w in content_lower for w in ["pest", "disease", "insect", "fungicide", "herbicide"]):
        topics.append("pest_management")
    if any(w in content_lower for w in ["irrigation", "water", "drip", "sprinkler"]):
        topics.append("irrigation")
    if any(w in content_lower for w in ["soil", "ph", "acidic", "alkaline", "organic carbon"]):
        topics.append("soil_health")

    # Crop detection
    for crop in ["wheat", "rice", "paddy", "cotton", "sugarcane", "maize", "tomato", "potato"]:
        if crop in content_lower:
            crops.append(crop)

    # Source name from filename
    source = filename.replace("_", " ").replace(".txt", "").replace(".pdf", "").title()
    if "icar" in filename_lower or "iari" in filename_lower:
        source = f"ICAR — {source}"

    return {
        "source": source,
        "filename": filename,
        "topics": ",".join(topics),
        "crops": ",".join(set(crops)),
    }


def ingest_documents(
    doc_dir: str = "./data/agricultural_docs",
    chroma_dir: str = "./chroma_db",
    chunk_size: int = 800,
    chunk_overlap: int = 120,
):
    """
    Full ingestion pipeline:
    1. Load TXT + PDF files from doc_dir
    2. Clean and split into chunks
    3. Attach metadata (source, topics, crops)
    4. Generate real sentence-transformer embeddings
    5. Store in Chroma DB (overwrite existing)
    """
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_core.documents import Document

    logger.info(f"📚 Ingestion pipeline starting from: {doc_dir}")

    all_docs: List[Document] = []
    doc_path = Path(doc_dir)

    # ── Load TXT files ──────────────────────────────────────────────────────────
    txt_files = list(doc_path.glob("*.txt"))
    for txt_file in txt_files:
        try:
            content = txt_file.read_text(encoding="utf-8", errors="replace")
            meta = _extract_metadata(content, txt_file.name)
            all_docs.append(Document(page_content=content, metadata=meta))
            logger.info(f"  ✓ Loaded TXT: {txt_file.name} ({len(content)} chars)")
        except Exception as e:
            logger.warning(f"  ⚠ Failed to load {txt_file.name}: {e}")

    # ── Load PDF files ──────────────────────────────────────────────────────────
    pdf_files = list(doc_path.glob("*.pdf"))
    for pdf_file in pdf_files:
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(pdf_file))
            full_text = ""
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                full_text += f"\n[PAGE {i+1}]\n{page_text}"
            if full_text.strip():
                meta = _extract_metadata(full_text, pdf_file.name)
                meta["page_count"] = len(reader.pages)
                all_docs.append(Document(page_content=full_text, metadata=meta))
                logger.info(f"  ✓ Loaded PDF: {pdf_file.name} ({len(reader.pages)} pages)")
        except Exception as e:
            logger.warning(f"  ⚠ Failed to load PDF {pdf_file.name}: {e}")

    if not all_docs:
        logger.error("❌ No documents found! Check doc_dir path.")
        return False

    logger.info(f"  Total raw docs: {len(all_docs)}")

    # ── Split into chunks ───────────────────────────────────────────────────────
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n### ", "\n## ", "\n# ", "\n", ". ", " "],
    )
    chunks = splitter.split_documents(all_docs)

    # Carry source metadata forward to all chunks
    for chunk in chunks:
        if "source" not in chunk.metadata:
            chunk.metadata["source"] = "ICAR Agricultural Handbook"

    logger.info(f"  ✓ Created {len(chunks)} chunks (avg ~{chunk_size} chars each)")

    # ── Load embeddings ─────────────────────────────────────────────────────────
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
            logger.error("  Install with: pip install sentence-transformers")
            return False

    # ── Write to Chroma DB ──────────────────────────────────────────────────────
    from langchain_community.vectorstores import Chroma
    import shutil

    # Remove old DB for clean rebuild
    if os.path.exists(chroma_dir):
        shutil.rmtree(chroma_dir)
        logger.info(f"  🗑  Removed old Chroma DB at {chroma_dir}")

    logger.info(f"  🔤 Generating embeddings for {len(chunks)} chunks (this may take a minute)...")

    # Batch to avoid memory issues
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
    return True


if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv
    load_dotenv()

    doc_dir = sys.argv[1] if len(sys.argv) > 1 else "./data/agricultural_docs"
    success = ingest_documents(doc_dir=doc_dir)
    sys.exit(0 if success else 1)
