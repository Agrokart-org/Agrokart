"""
AgroKart Official Agricultural Recommendations Extractor
Parses official MPKV & ICAR agricultural documents and extracts structured recommendations
with full source provenance into data/knowledge/official_recommendations.json
"""
import os
import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def extract_year(text: str, filename: str) -> Optional[int]:
    """Extract publication or recommendation year from text or filename."""
    # Check filename first (e.g. MPKV_Recommendations_2025.pdf -> 2025)
    match_file = re.search(r'(20\d{2})', filename)
    if match_file:
        return int(match_file.group(1))

    # Check text patterns like '2019-20', '2025', '2018-19'
    match_year_range = re.search(r'\b(20\d{2})[-–](?:\d{2}|\d{4})\b', text)
    if match_year_range:
        return int(match_year_range.group(1))

    match_year = re.search(r'\b(20\d{2})\b', text)
    if match_year:
        return int(match_year.group(1))

    return 2025  # Default known baseline for MPKV documents if unstated


def detect_crop(text: str, filename: str) -> Optional[str]:
    """Detect crop name from recommendation text or filename."""
    text_lower = text.lower()
    fn_lower = filename.lower()

    crops_map = {
        "wheat": ["wheat", "gehun", "गेहूं", "samadhan", "niaw"],
        "paddy": ["paddy", "rice", "भात", "धान", "phule samruddhi"],
        "sugarcane": ["sugarcane", "ganna", "ऊस", "com 0265", "phule 0265", "ms 10001"],
        "cotton": ["cotton", "kapas", "कपास", "akh", "phule dhanwantari"],
        "maize": ["maize", "corn", "मक्का"],
        "soybean": ["soybean", "soya", "सोयाबीन"],
        "groundnut": ["groundnut", "peanut", "मूंगफली"],
        "onion": ["onion", "pyaz", "कांदा"],
        "coriander": ["coriander", "dhaniya"],
        "chickpea": ["chickpea", "gram", "चना"]
    }

    # Check filename crop
    for crop, kw_list in crops_map.items():
        if crop in fn_lower:
            return crop

    # Check text content
    for crop, kw_list in crops_map.items():
        if any(kw in text_lower for kw in kw_list):
            return crop

    return None


def detect_soil_condition(text: str) -> Optional[str]:
    """Extract explicit soil type/condition if mentioned in the recommendation."""
    patterns = [
        r'(medium\s+black\s+soil[s]?)',
        r'(deep\s+black\s+soil[s]?)',
        r'(medium\s+to\s+deep\s+black\s+soil[s]?)',
        r'(medium\s+deep\s+black\s+soil[s]?)',
        r'(medium\s+deep\s+soil[s]?)',
        r'(shallow\s+soil[s]?)',
        r'(zinc\s+deficient\s+soil[s]?)',
        r'(iron\s+deficient\s+soil[s]?)',
        r'(sulphur\s+deficient\s+soil[s]?)',
        r'(acidic\s+soil[s]?)',
        r'(alkaline\s+soil[s]?)',
        r'(saline\s+soil[s]?)',
        r'(puddled\s+soil[s]?)',
        r'(light\s+soil[s]?)',
        r'(sandy\s+loam\s+soil[s]?)'
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def detect_fertilizer_and_dose(text: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Extract fertilizer name, dose, and unit if explicitly present."""
    # NPK ratio dose e.g., 120:60:40 NPK kg ha-1
    npk_match = re.search(r'(\d+:\d+:\d+)\s*(?:N:P:K|NPK)?\s*(?:kg\s*ha-1|kg/ha|kg\s*per\s*ha)?', text, re.IGNORECASE)
    if npk_match:
        return "NPK (N:P:K)", npk_match.group(1), "kg/ha"

    # Specific fertilizer with quantity
    fert_pat = re.search(r'(Urea|DAP|MOP|Zinc\s+Sulphate|Single\s+Super\s+Phosphate|SSP|Gypsum|Lime|FYM|Compost)\s*[@:]?\s*(\d+(?:\.\d+)?)\s*(kg|t|q)\s*(?:ha-1|/ha|per\s+ha)?', text, re.IGNORECASE)
    if fert_pat:
        fert_name = fert_pat.group(1).strip()
        qty = fert_pat.group(2)
        unit = f"{fert_pat.group(3)}/ha" if fert_pat.group(3) in ['kg', 't', 'q'] else fert_pat.group(3)
        return fert_name, f"{qty} {unit}", unit

    # Sulphur or micronutrient application
    micro_pat = re.search(r'(elemental\s+sulphur|sulphur|zinc|iron|boron)\s*@\s*(\d+(?:\.\d+)?)\s*(kg|g|L)\s*(?:ha-1|/ha|per\s+ha)?', text, re.IGNORECASE)
    if micro_pat:
        return micro_pat.group(1).title(), micro_pat.group(2), f"{micro_pat.group(3)}/ha"

    return None, None, None


def detect_application_stage(text: str) -> Optional[str]:
    """Extract application timing / stage if explicitly present."""
    stages = [
        r'(at\s+the\s+time\s+of\s+sowing)',
        r'(before\s+sowing)',
        r'(at\s+sowing)',
        r'(at\s+planting)',
        r'(before\s+planting)',
        r'(\d+\s*DAS)',
        r'(\d+\s*days\s+after\s+sowing)',
        r'(\d+\s*days\s+after\s+planting)',
        r'(at\s+tillering\s+stage)',
        r'(at\s+flowering\s+stage)',
        r'(basal\s+dose)',
        r'(top\s+dressing)'
    ]
    for st in stages:
        m = re.search(st, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def detect_conditions(text: str) -> Optional[str]:
    """Extract irrigation/regional conditions if explicitly present."""
    conds = [
        r'(deficit\s+irrigation)',
        r'(under\s+irrigated\s+condition[s]?)',
        r'(irrigated\s+condition[s]?)',
        r'(rainfed\s+condition[s]?)',
        r'(sub-montane\s+zone\s+of\s+maharashtra)',
        r'(plain\s+zone\s+of\s+western\s+maharashtra)',
        r'(western\s+maharashtra)'
    ]
    for c in conds:
        m = re.search(c, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def extract_recommendations_from_text(text: str, filename: str, page_num: int, org: str) -> List[Dict[str, Any]]:
    """Extract individual numbered or bulleted recommendation blocks from page text."""
    results = []
    year = extract_year(text, filename)

    # Split page text into numbered recommendation blocks (e.g. "1 Sowing of...", "2019-20 1 Sowing...", "2 It is recommended...")
    # Clean text lines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    full_text = " ".join(lines)

    # Regex pattern to match recommendation entries numbered e.g. "1 ", "2 ", "24 ", "2019-20 1 "
    blocks = re.split(r'(?:\b(?:20\d{2}[-–]\d{2}\s+)?(\d{1,3})\s+(?=[A-Z]|Application|Sowing|Planting|Treatment|Foliar|In|Under|For|The|It\s+is))', full_text)

    # Reconstruct blocks
    raw_recs = []
    if len(blocks) > 1:
        for i in range(1, len(blocks), 2):
            rec_num = blocks[i]
            rec_content = blocks[i+1] if i+1 < len(blocks) else ""
            if len(rec_content.strip()) > 30:
                raw_recs.append(rec_content.strip())
    else:
        # Fallback to paragraph or sentence splits if no explicit numbers found
        paras = [p.strip() for p in full_text.split('.') if len(p.strip()) > 40]
        raw_recs = paras

    for rec_text in raw_recs:
        # Filter out administrative headers
        if any(h in rec_text.lower() for h in ["mahatma phule krishi vidyapeeth", "research recommendations released", "recommendation released in last"]):
            if len(rec_text) < 100:
                continue

        crop = detect_crop(rec_text, filename)
        soil_cond = detect_soil_condition(rec_text)
        fert, dose, unit = detect_fertilizer_and_dose(rec_text)
        stage = detect_application_stage(rec_text)
        conditions = detect_conditions(rec_text)

        rec_entry = {
            "crop": crop,
            "state": "Maharashtra" if ("maharashtra" in rec_text.lower() or org == "MPKV") else None,
            "season": "rabi" if crop == "wheat" else ("kharif" if crop in ["paddy", "cotton", "soybean", "maize"] else None),
            "soil_condition": soil_cond,
            "recommendation": rec_text[:600].strip(),
            "fertilizer": fert,
            "dose": dose,
            "unit": unit,
            "application_stage": stage,
            "conditions": conditions,
            "target_yield": None,  # Populated only if present in text
            "source": {
                "organization": org,
                "document": filename,
                "page": page_num,
                "year": year
            }
        }
        results.append(rec_entry)

    return results


def run_extraction(
    official_dir: str = "rag_service/data/agricultural_docs/official",
    output_path: str = "rag_service/data/knowledge/official_recommendations.json"
) -> tuple[int, int, List[Dict[str, Any]]]:
    """Run full extraction across all PDF and TXT official documents."""
    logger.info(f"🔍 Running structured agricultural recommendation extraction from: {official_dir}")
    doc_path = Path(official_dir)
    extracted_items = []
    failures = []

    # 1. Process Official PDF files
    pdf_files = list(doc_path.rglob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files in {official_dir}")

    for pdf_file in sorted(pdf_files):
        try:
            reader = PdfReader(str(pdf_file))
            org = "MPKV" if "MPKV" in str(pdf_file) else "ICAR"
            file_items_count = 0

            for p_idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if not page_text.strip():
                    continue

                page_recs = extract_recommendations_from_text(
                    text=page_text,
                    filename=pdf_file.name,
                    page_num=p_idx + 1,
                    org=org
                )
                extracted_items.extend(page_recs)
                file_items_count += len(page_recs)

            logger.info(f"  ✓ {pdf_file.name}: Extracted {file_items_count} recommendations across {len(reader.pages)} pages")
        except Exception as e:
            logger.error(f"  ❌ Failed to extract PDF {pdf_file.name}: {e}")
            failures.append({"file": pdf_file.name, "error": str(e)})

    # Save to JSON output
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(extracted_items, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ Successfully written {len(extracted_items)} structured recommendations to '{output_path}'")
    return len(pdf_files), len(extracted_items), failures


if __name__ == "__main__":
    docs_count, recs_count, fails = run_extraction()
    print(f"\nExtraction complete: {docs_count} PDFs ingested, {recs_count} recommendations extracted, {len(fails)} failures.")
