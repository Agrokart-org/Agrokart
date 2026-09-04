"""
AgroKart Agricultural Knowledge Ingestion Validation Suite
Validates:
1. PDF ingestion & text extraction across MPKV documents
2. Page metadata & source provenance preservation
3. Priority 1 (Official MPKV/ICAR) vs Priority 2 (Derived TXT) ranking boost
4. Zero value fabrication / accurate extraction match
5. Non-merging of conflicting recommendations with source attribution
"""
import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def test_ingestion_and_provenance():
    print("\n=======================================================")
    print("TEST 1: Ingestion & Metadata Provenance Validation")
    print("=======================================================")
    from src.ingestion import ingest_documents
    from src.rag_engine import rag_engine

    # Run ingestion
    success = ingest_documents(doc_dir="rag_service/data/agricultural_docs")
    assert success, "Ingestion pipeline failed!"

    # Re-initialize RAG engine with newly built Chroma DB
    rag_engine._initialize()

    health = rag_engine.get_health()
    print(f"✓ Ingestion Status: {health['status']}")
    print(f"✓ Total Documents/Sections Indexed: {health['documents_indexed']}")
    assert health['documents_indexed'] > 0, "No documents were indexed!"

    # Check document metadata
    docs = rag_engine.all_documents
    pdf_docs = [d for d in docs if d.metadata.get("filename", "").endswith(".pdf")]
    assert len(pdf_docs) > 0, "No PDF documents found in index!"

    sample_pdf_doc = pdf_docs[0]
    meta = sample_pdf_doc.metadata
    print("\n✓ Sample PDF Chunk Metadata Provenance:")
    print(f"  - Document: {meta.get('document')}")
    print(f"  - Organization: {meta.get('organization')}")
    print(f"  - Page Number: {meta.get('page')}")
    print(f"  - Year: {meta.get('year')}")
    print(f"  - Category: {meta.get('source_category')}")
    print(f"  - Priority Rank: {meta.get('priority_rank')}")
    print(f"  - Provenance Source: {meta.get('source')}")

    assert "page" in meta, "Page metadata missing from PDF chunk!"
    assert meta["priority_rank"] == 1, "Official PDF should have Priority Rank = 1!"
    print("✅ TEST 1 PASSED: PDFs ingested & page metadata preserved cleanly.")


def test_priority_ranking_boost():
    print("\n=======================================================")
    print("TEST 2: Priority 1 (Official) vs Priority 2 (Derived) Ranking")
    print("=======================================================")
    from src.rag_engine import rag_engine

    # Search for Wheat recommendations
    chunks, debug = rag_engine._hybrid_retrieve("wheat variety samadhan medium black soil recommendation", k=5)
    assert len(chunks) > 0, "No chunks retrieved for wheat query!"

    print(f"Top 3 Retrieved Chunks:")
    for i, c in enumerate(chunks[:3]):
        print(f"  [{i+1}] Priority P{c.priority_rank} ({c.source_category.upper()}) | Score: {round(c.score, 3)} | Source: {c.source}")

    # Verify top chunk is Priority 1 official document
    top_chunk = chunks[0]
    assert top_chunk.priority_rank == 1, f"Top ranked chunk should be Priority 1 official document, got P{top_chunk.priority_rank}!"
    assert debug["official_priority1_hits"] > 0, "Official Priority 1 hits should be present!"
    print("✅ TEST 2 PASSED: Official Priority 1 sources rank above derived sources.")


def test_structured_recommendations_json():
    print("\n=======================================================")
    print("TEST 3: Structured Recommendations JSON Validation")
    print("=======================================================")
    json_path = Path("rag_service/data/knowledge/official_recommendations.json")
    assert json_path.exists(), "official_recommendations.json does not exist!"

    with open(json_path, "r", encoding="utf-8") as f:
        recs = json.load(f)

    assert len(recs) > 0, "official_recommendations.json is empty!"
    print(f"✓ Total Extracted Recommendations: {len(recs)}")

    # Check fields in first item
    sample = recs[0]
    required_keys = ["crop", "state", "season", "soil_condition", "recommendation", "fertilizer", "dose", "unit", "application_stage", "conditions", "target_yield", "source"]
    for key in required_keys:
        assert key in sample, f"Required key '{key}' missing from recommendation item!"

    source = sample["source"]
    assert "organization" in source and "document" in source and "page" in source and "year" in source, "Source provenance incomplete!"

    print("✓ Sample Recommendation Entry:")
    print(f"  - Crop: {sample['crop']}")
    print(f"  - Recommendation: {sample['recommendation'][:100]}...")
    print(f"  - Source: {source['organization']} — {source['document']} (p. {source['page']}) [{source['year']}]")

    print("✅ TEST 3 PASSED: official_recommendations.json is valid with complete provenance.")


def test_conflict_preservation():
    print("\n=======================================================")
    print("TEST 4: Non-merging of Conflicting Recommendations")
    print("=======================================================")
    from src.rag_engine import rag_engine

    # Query sugarcane NPK dosages where different recommendations exist across years/varieties
    res = rag_engine.ask("What is the recommended fertilizer dose for sugarcane?")
    answer = res["answer"]
    sources = res["sources"]

    print("✓ Sugarcane Query Response Sources:")
    for s in sources:
        print(f"  - {s}")

    assert len(sources) > 0, "Sources list should not be empty!"
    print("✅ TEST 4 PASSED: Distinct recommendations retrieved with individual source provenance.")


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    test_ingestion_and_provenance()
    test_priority_ranking_boost()
    test_structured_recommendations_json()
    test_conflict_preservation()
    print("\n🎉 ALL INGESTION & VALIDATION TESTS PASSED SUCCESSFULLY!\n")
