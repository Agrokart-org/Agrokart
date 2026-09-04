"""
AgroKart RAG + LLM - Main Service Entry Point

Usage:
1. One-time Setup: python agrokart_rag.py setup
2. Run Service:   python agrokart_rag.py start (or uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload)
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.vector_store_setup import setup_vector_db
from src.api import app

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "setup":
        print("🚀 Running AgroKart Vector Database Ingestion Setup...")
        setup_vector_db()
    else:
        import uvicorn
        print("🌿 Starting AgroKart RAG FastAPI Server on http://localhost:8000 ...")
        uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
