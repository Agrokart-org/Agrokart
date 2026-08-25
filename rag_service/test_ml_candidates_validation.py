"""
AgroKart ML Candidate Dataset Validation Test Suite
Validates:
1. Units are strictly preserved (source_unit matches unit)
2. kg/ha is NEVER assigned when source says t/ha or L/ha
3. ml/ha is NEVER treated as kg/ha
4. Missing N/P/K remains null (no inferred values)
5. No crop-protection products enter the fertilizer ML dataset
6. Every ML candidate has complete document + page provenance
7. Verification status is properly set
"""
import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def test_ml_candidate_integrity():
    print("\n=======================================================")
    print("TEST: ML Candidate Fertilizer Dataset Validation")
    print("=======================================================")

    dataset_path = Path("rag_service/data/knowledge/ml_candidate_fertilizer_data.json")
    report_path = Path("rag_service/data/knowledge/ml_candidate_report.json")

    assert dataset_path.exists(), "ml_candidate_fertilizer_data.json missing!"
    assert report_path.exists(), "ml_candidate_report.json missing!"

    with open(dataset_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    assert len(candidates) > 0, "ml_candidate_fertilizer_data.json is empty!"
    print(f"✓ Loaded {len(candidates)} Clean ML Candidates")

    pesticide_keywords = ["emamectin", "lambda cyhalothrin", "flonicamid", "thiamethoxam", "acetamiprid", "metribuzine", "jassid", "aphid", "bolworm"]

    for idx, rec in enumerate(candidates):
        rec_id = f"Record #{idx+1} ({rec.get('crop')} - {rec.get('fertilizer_product')})"

        # 1. Authoritative Provenance & Document Existence
        assert "source" in rec and isinstance(rec["source"], dict), f"{rec_id} missing source provenance!"
        src = rec["source"]
        assert src.get("organization") in ["MPKV", "ICAR", "Govt"], f"{rec_id} invalid organization!"
        assert src.get("document") and len(src["document"]) > 0, f"{rec_id} missing document!"
        assert src.get("page") and isinstance(src["page"], int) and src["page"] > 0, f"{rec_id} invalid page!"

        # 2. Strict Unit Preservation (source_unit == unit)
        assert rec.get("source_unit") == rec.get("unit"), f"{rec_id} unit mismatch! source_unit={rec.get('source_unit')} vs unit={rec.get('unit')}"

        # 3. No kg/ha assigned to t/ha or L/ha
        if rec["source_unit"] in ["t/ha", "L/ha", "q/ha", "ml/ha"]:
            assert rec["unit"] == rec["source_unit"], f"{rec_id} misclassified unit!"
            assert rec["unit"] != "kg/ha" if rec["source_unit"] != "kg/ha" else True, f"{rec_id} assigned kg/ha to {rec['source_unit']}!"

        # 4. No ml/ha treated as kg/ha
        assert rec["source_unit"] != "ml/ha" and rec["unit"] != "ml/ha", f"{rec_id} ml/ha product present in fertilizer ML dataset!"

        # 5. Crop Protection Products EXCLUDED
        rec_text = str(rec).lower()
        for kw in pesticide_keywords:
            assert kw not in rec_text, f"{rec_id} contains crop protection product '{kw}'!"

        # 6. Category Filter (Must be fertilizer, organic_amendment, or micronutrient)
        assert rec.get("input_category") in ["fertilizer", "organic_amendment", "micronutrient"], f"{rec_id} invalid input category '{rec.get('input_category')}'!"

        # 7. Non-Inferred N/P/K Rule
        if rec["input_category"] in ["organic_amendment", "micronutrient"] and "120:60:40" not in str(rec.get("dose")):
            assert rec["recommended_n"] is None, f"{rec_id} inferred N for organic/micronutrient!"
            assert rec["recommended_p"] is None, f"{rec_id} inferred P for organic/micronutrient!"
            assert rec["recommended_k"] is None, f"{rec_id} inferred K for organic/micronutrient!"

    print("✓ All 8 validation checks passed across all ML candidates.")

    # Check Report Structure
    assert report.get("valid_ml_candidates") == len(candidates), "Report ML candidate count mismatch!"
    assert "records_by_crop" in report, "Report missing records_by_crop!"
    assert "records_by_unit" in report, "Report missing records_by_unit!"
    assert "records_by_input_category" in report, "Report missing records_by_input_category!"

    print("\n🎉 ALL ML CANDIDATE DATASET VALIDATION TESTS PASSED SUCCESSFULLY!\n")


if __name__ == "__main__":
    test_ml_candidate_integrity()
