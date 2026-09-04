"""
Wrapper for src/ingestion.py to support both command names:
python src/ingest_docs.py and python src/ingestion.py
"""
import sys
import os
from pathlib import Path

# Add project root to sys.path so 'src.xxx' imports resolve whether called directly or as a module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv()

from src.ingestion import ingest_documents

if __name__ == "__main__":
    doc_dir = sys.argv[1] if len(sys.argv) > 1 else "./data/agricultural_docs"
    success = ingest_documents(doc_dir=doc_dir)
    sys.exit(0 if success else 1)
