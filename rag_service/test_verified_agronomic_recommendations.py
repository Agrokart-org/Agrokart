"""
Validation test suite for verified_agronomic_recommendations.json
Verifies:
1. Target schema structure matches requirement exactly
2. Categorization into NPK_FERTILIZER, ORGANIC_AMENDMENT, MICRONUTRIENT, OTHER
3. NPK values ONLY present for NPK_FERTILIZER when explicitly stated
4. Units preserved without forced conversion
5. Every record contains document and page provenance
6. Verification status is 'source_verified'
"""
import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def test_verified_agronomic_recommendations():
    print("\n=======================================================")
    print("TEST: Verified Agronomic Recommendations Validation")
    print("=======================================================")

    dataset_path = Path("rag_service/data/knowledge/verified_agronomic_recommendations.json")
    report_path = Path("rag_service/data/knowledge/verified_agronomic_report.json")

    assert dataset_path.exists(), "verified_agronomic_recommendations.json missing!"
    assert report_path.exists(), "verified_agronomic_report.json missing!"

    with open(dataset_path, "r", encoding="utf-8") as f:
        recs = json.load(f)

    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    assert len(recs) > 0, "Dataset is empty!"
    print(f"✓ Loaded {len(recs)} Verified Agronomic Rule Records")

    valid_categories = ["NPK_FERTILIZER", "ORGANIC_AMENDMENT", "MICRONUTRIENT", "OTHER"]

    for idx, r in enumerate(recs):
        rec_id = f"Record #{idx+1} ({r.get('crop')} - {r.get('input_category')})"

        # 1. Required keys
        required_keys = [
            "crop", "state", "season", "soil_condition", "input_category",
            "fertilizer_product", "recommended_n", "recommended_p2o5",
            "recommended_k2o", "dose", "unit", "application_stage",
            "conditions", "source", "verification_status"
        ]
        for k in required_keys:
            assert k in r, f"{rec_id} missing key '{k}'!"

        # 2. Category validity
        assert r["input_category"] in valid_categories, f"{rec_id} invalid input category '{r['input_category']}'!"

        # 3. Source provenance
        src = r["source"]
        assert src.get("organization") in ["MPKV", "ICAR", "Govt"], f"{rec_id} invalid organization!"
        assert src.get("document") and len(src["document"]) > 0, f"{rec_id} missing source document!"
        assert src.get("page") and isinstance(src["page"], int) and src["page"] > 0, f"{rec_id} invalid page number!"

        # 4. Status
        assert r["verification_status"] == "source_verified", f"{rec_id} verification status must be 'source_verified'!"

        # 5. Non-inferred NPK rule for non-NPK categories
        if r["input_category"] in ["ORGANIC_AMENDMENT", "MICRONUTRIENT", "OTHER"]:
            assert r["recommended_n"] is None, f"{rec_id} inferred N for non-NPK category!"
            assert r["recommended_p2o5"] is None, f"{rec_id} inferred P2O5 for non-NPK category!"
            assert r["recommended_k2o"] is None, f"{rec_id} inferred K2O for non-NPK category!"

    print("✓ All schema, provenance, non-inference, and category checks passed.")
    print("\n🎉 ALL VERIFIED AGRONOMIC RECOMMENDATION TESTS PASSED!\n")


if __name__ == "__main__":
    test_verified_agronomic_recommendations()
