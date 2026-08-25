"""
AgroKart Verified Fertilizer Dataset Generator
Processes official MPKV agricultural PDFs page-by-page.
Filters strictly for fertilizer and nutrient intelligence recommendations.
Generates:
1. rag_service/data/knowledge/fertilizer_recommendations.json
2. rag_service/data/knowledge/fertilizer_extraction_report.json
"""
import os
import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def extract_year(text: str, filename: str) -> int:
    """Extract publication/recommendation year from text or filename."""
    match_file = re.search(r'(20\d{2})', filename)
    if match_file:
        return int(match_file.group(1))

    match_year_range = re.search(r'\b(20\d{2})[-–](?:\d{2}|\d{4})\b', text)
    if match_year_range:
        return int(match_year_range.group(1))

    match_year = re.search(r'\b(20\d{2})\b', text)
    if match_year:
        return int(match_year.group(1))

    return 2025


def detect_crop(text: str, filename: str) -> Optional[str]:
    """Detect specific crop name from text or filename."""
    text_lower = text.lower()
    fn_lower = filename.lower()

    crops_map = {
        "wheat": ["wheat", "gehun", "गेहूं", "samadhan", "niaw"],
        "paddy": ["paddy", "rice", "भात", "धान", "phule samruddhi"],
        "sugarcane": ["sugarcane", "ganna", "ऊस", "com 0265", "phule 0265", "ms 10001", "suru sugarcane", "adsali sugarcane"],
        "cotton": ["cotton", "kapas", "कपास", "akh", "phule dhanwantari"],
        "maize": ["maize", "corn", "मक्का"],
        "soybean": ["soybean", "soya", "सोयाबीन"],
        "groundnut": ["groundnut", "peanut", "मूंगफली"],
        "onion": ["onion", "pyaz", "कांदा"],
        "coriander": ["coriander", "dhaniya"],
        "chickpea": ["chickpea", "gram", "चना"],
        "safflower": ["safflower", "karadai"],
        "pearl millet": ["pearl millet", "bajra", "बाजरा", "dhanshakti"]
    }

    # Check filename first
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
        r'(shallow\s+black\s+soil[s]?)',
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


def detect_npk_dose(text: str) -> Tuple[Optional[int], Optional[int], Optional[int], Optional[str], Optional[str]]:
    """
    Extract explicit N, P, K numeric values, dose string, and unit.
    STRICT: Only extracts if explicitly present in the source text.
    """
    # 1. N:P:K ratio format e.g., 120:60:40 NPK kg ha-1 or (120:60:40 N:P2O5:K2O kg/ha)
    npk_ratio = re.search(r'\b(\d+)\s*:\s*(\d+)\s*:\s*(\d+)\s*(?:N:P:K|NPK|N:P\s*2O5:K\s*2O|N:P|kg\s*ha-1|kg/ha|kg\s*per\s*ha)?\b', text, re.IGNORECASE)
    if npk_ratio:
        n_val = int(npk_ratio.group(1))
        p_val = int(npk_ratio.group(2))
        k_val = int(npk_ratio.group(3))
        unit = "kg/ha" if ("ha" in text.lower() or "hectare" in text.lower()) else "kg/ha"
        return n_val, p_val, k_val, f"{n_val}:{p_val}:{k_val} {unit}", unit

    # 2. Explicit individual element doses e.g. "600 Kg N, 230 kg P2O5 and 115 kg K2O"
    explicit_npk = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*N\b.*?\b(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*P(?:\s*2O5)?.*?\b(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*K(?:\s*2O)?', text, re.IGNORECASE)
    if explicit_npk:
        n_val = int(float(explicit_npk.group(1)))
        p_val = int(float(explicit_npk.group(2)))
        k_val = int(float(explicit_npk.group(3)))
        return n_val, p_val, k_val, f"{n_val}:{p_val}:{k_val} kg/ha", "kg/ha"

    # 3. Single nitrogen dose e.g., 50 % recommended dose of N
    # If unstated P and K, keep them None
    return None, None, None, None, None


def detect_fertilizers_and_nutrients(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Extract fertilizer names, specific dose string, and unit from text."""
    ferts = []
    dose_parts = []
    unit = None

    # Check common fertilizers
    fert_list = [
        ("Neem Coated Urea", r'\bneem\s+coated\s+urea\b'),
        ("Urea", r'\burea\b'),
        ("DAP", r'\bdap\b|\bdi-ammonium\s+phosphate\b'),
        ("MOP", r'\bmop\b|\bmuriate\s+of\s+potash\b'),
        ("SSP", r'\bssp\b|\bsingle\s+super\s+phosphate\b'),
        ("Zinc Sulphate", r'\bzinc\s+sulphate\b|\bzinc\s+sulfate\b'),
        ("Ferrous Sulphate", r'\bferrous\s+sulphate\b'),
        ("Elemental Sulphur", r'\belemental\s+sulphur\b|\bsulphur\b|\bsulfur\b'),
        ("FYM", r'\bfym\b|\bfarm\s+yard\s+manure\b'),
        ("Vermi Compost", r'\bvermi\s*compost\b'),
        ("Biofertilizer", r'\bbio-?fertilizer[s]?\b|\bbio-?inoculant[s]?\b|\bazotobacter\b|\bazospirillum\b|\bacetobacter\b|\brhizobium\b|\bpsb\b|\bkmb\b'),
        ("Liquid Biofertilizer", r'\bliquid\s+bio-?inoculant\b|\bliquid\s+culture\b'),
        ("Micronutrients", r'\bmicronutrient[s]?\b|\bmultimacronutrient[s]?\b')
    ]

    for name, pattern in fert_list:
        if re.search(pattern, text, re.IGNORECASE):
            ferts.append(name)

    # Extract doses if explicitly stated in text
    dose_match = re.search(r'(\d+(?:\.\d+)?)\s*(kg|t|q|L|liters|litres|ml)\s*(?:ha-1|/ha|per\s+ha)?', text, re.IGNORECASE)
    if dose_match:
        val = dose_match.group(1)
        u = dose_match.group(2)
        dose_parts.append(f"{val} {u}/ha")
        unit = f"{u}/ha"

    fert_str = ", ".join(dict.fromkeys(ferts)) if ferts else "Chemical / Organic Fertilizers"
    dose_str = ", ".join(dose_parts) if dose_parts else None

    # Determine nutrient label
    nutrients = []
    if "nitrogen" in text.lower() or " urea " in f" {text.lower()} " or " n " in f" {text.lower()} ":
        nutrients.append("N")
    if "phosphorus" in text.lower() or " dap " in f" {text.lower()} " or " p " in f" {text.lower()} ":
        nutrients.append("P")
    if "potassium" in text.lower() or " mop " in f" {text.lower()} " or " k " in f" {text.lower()} ":
        nutrients.append("K")
    if "zinc" in text.lower():
        nutrients.append("Zn")
    if "sulphur" in text.lower() or "sulfur" in text.lower():
        nutrients.append("S")
    if "iron" in text.lower() or "ferrous" in text.lower():
        nutrients.append("Fe")

    nutrient_str = "-".join(nutrients) if nutrients else "NPK"

    return fert_str, nutrient_str, dose_str if dose_str else unit


def detect_application_stage(text: str) -> Optional[str]:
    """Extract explicit application timing/stage if present in source text."""
    stages = [
        r'(at\s+the\s+time\s+of\s+land\s+preparation)',
        r'(at\s+the\s+time\s+of\s+sowing)',
        r'(before\s+sowing)',
        r'(at\s+sowing)',
        r'(at\s+planting)',
        r'(before\s+planting)',
        r'(\d+\s*DAS)',
        r'(\d+\s*DAP)',
        r'(\d+\s*days\s+after\s+sowing)',
        r'(\d+\s*days\s+after\s+planting)',
        r'(at\s+tillering\s+stage)',
        r'(at\s+flowering\s+stage)',
        r'(basal\s+dose)',
        r'(top\s+dressing)',
        r'(\d+\s*equal\s+splits|\d+\s*weekly\s+splits)'
    ]
    for st in stages:
        m = re.search(st, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def detect_conditions(text: str) -> Optional[str]:
    """Extract explicit environmental/irrigation conditions."""
    conds = [
        r'(deficit\s+irrigation)',
        r'(under\s+irrigated\s+condition[s]?)',
        r'(irrigated\s+condition[s]?)',
        r'(rainfed\s+condition[s]?)',
        r'(sub-montane\s+zone\s+of\s+maharashtra)',
        r'(plain\s+zone\s+of\s+western\s+maharashtra)',
        r'(western\s+maharashtra)',
        r'(scarcity\s+zone)'
    ]
    for c in conds:
        m = re.search(c, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def detect_target_yield(text: str) -> Optional[str]:
    """Extract explicit target yield if mentioned (never fabricate)."""
    m = re.search(r'yield\s+target\s*(?:of)?\s*(\d+(?:\.\d+)?)\s*(q|t|q/ha|t/ha|q ha-1|t ha-1)', text, re.IGNORECASE)
    if m:
        return f"{m.group(1)} {m.group(2)}"
    m2 = re.search(r'target\s+of\s*(\d+(?:\.\d+)?)\s*(q|t|q/ha|t/ha)', text, re.IGNORECASE)
    if m2:
        return f"{m2.group(1)} {m2.group(2)}"
    return None


def process_official_documents(
    doc_dir: str = "rag_service/data/agricultural_docs/official",
    output_json: str = "rag_service/data/knowledge/fertilizer_recommendations.json",
    report_json: str = "rag_service/data/knowledge/fertilizer_extraction_report.json"
):
    """
    Process official MPKV PDF documents with strict fertilizer relevance filtering,
    provenance tracking, corrupted text handling, and report generation.
    """
    logger.info(f"🌿 Generating verified fertilizer dataset from official docs in: {doc_dir}")
    doc_path = Path(doc_dir)

    pdf_files = list(doc_path.rglob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} official PDF documents.")

    total_source_records_examined = 0
    extracted_records = []
    excluded_records = []
    manual_verification_records = []
    corrupted_records = []
    docs_pages_involved = {}

    for pdf_file in sorted(pdf_files):
        reader = PdfReader(str(pdf_file))
        file_name = pdf_file.name
        org = "MPKV" if "MPKV" in str(pdf_file) else "ICAR"
        pages_processed = []

        for p_idx, page in enumerate(reader.pages):
            page_num = p_idx + 1
            pages_processed.append(page_num)
            page_text = page.extract_text() or ""
            if not page_text.strip():
                continue

            # Split page text into blocks / recommendations
            lines = [l.strip() for l in page_text.split('\n') if l.strip()]
            full_page = " ".join(lines)

            # Split into individual recommendation blocks by number e.g. "1 Sowing...", "2 Application..."
            blocks = re.split(r'(?:\b(?:20\d{2}[-–]\d{2}\s+)?(\d{1,3})\s+(?=[A-Z]|Application|Sowing|Planting|Treatment|Foliar|In|Under|For|The|It\s+is))', full_page)

            raw_blocks = []
            if len(blocks) > 1:
                for i in range(1, len(blocks), 2):
                    rec_content = blocks[i+1] if i+1 < len(blocks) else ""
                    if len(rec_content.strip()) > 25:
                        raw_blocks.append(rec_content.strip())
            else:
                raw_blocks = [full_page]

            for block_text in raw_blocks:
                total_source_records_examined += 1

                # 1. Check for PDF Text Corruption / OCR Fragment
                is_corrupted = False
                if len(block_text) < 20 or re.search(r'^\d+\s*$', block_text) or "..." in block_text or re.search(r'[^\x00-\x7F]{5,}', block_text):
                    is_corrupted = True

                # 2. Strict Fertilizer Keyword Filtering
                fert_keywords = [
                    'fertilizer', 'fertiliser', 'urea', 'dap', 'mop', 'ssp', 'npk', 'nitrogen', 'phosphorus',
                    'potassium', 'zinc', 'sulphur', 'sulfur', 'ferrous', 'fym', 'compost', 'manure',
                    'vermi compost', 'biofertilizer', 'bio-fertilizer', 'bioinoculant', 'rhizobium',
                    'azotobacter', 'azospirillum', 'acetobacter', 'psb', 'kmb', 'foliar application of',
                    'top dressing', 'basal dose', 'recommended dose', 'kg ha', 't ha', 'kg/ha', 't/ha'
                ]
                text_lower = block_text.lower()
                is_fert_relevant = any(kw in text_lower for kw in fert_keywords)

                # Exclude non-fertilizer topics (e.g. pest, irrigation, spacing, variety, economics)
                if not is_fert_relevant:
                    excluded_records.append({
                        "document": file_name,
                        "page": page_num,
                        "reason": "Non-fertilizer topic (pest/irrigation/variety/economics)",
                        "snippet": block_text[:120]
                    })
                    continue

                if is_corrupted:
                    corrupted_records.append({
                        "document": file_name,
                        "page": page_num,
                        "reason": "Corrupted or fragmented OCR text",
                        "snippet": block_text[:120]
                    })
                    excluded_records.append({
                        "document": file_name,
                        "page": page_num,
                        "reason": "Corrupted/fragmented OCR text",
                        "snippet": block_text[:120]
                    })
                    continue

                # 3. Detect Crop (MUST EXIST)
                crop = detect_crop(block_text, file_name)
                if not crop:
                    manual_verification_records.append({
                        "document": file_name,
                        "page": page_num,
                        "reason": "Crop unstated or ambiguous in block",
                        "snippet": block_text[:120]
                    })
                    excluded_records.append({
                        "document": file_name,
                        "page": page_num,
                        "reason": "Crop unstated",
                        "snippet": block_text[:120]
                    })
                    continue

                # 4. Extract Attributes with Precision
                soil_cond = detect_soil_condition(block_text)
                n_val, p_val, k_val, npk_dose_str, npk_unit = detect_npk_dose(block_text)
                fert_name, nutrient_label, general_dose_str = detect_fertilizers_and_nutrients(block_text)
                stage = detect_application_stage(block_text)
                conditions = detect_conditions(block_text)
                target_yield = detect_target_yield(block_text)
                year = extract_year(block_text, file_name)

                dose_str = npk_dose_str if npk_dose_str else general_dose_str
                unit_str = npk_unit if npk_unit else ("kg/ha" if ("kg" in block_text.lower() and "ha" in block_text.lower()) else None)

                record = {
                    "crop": crop,
                    "state": "Maharashtra",
                    "season": "rabi" if crop == "wheat" else ("kharif" if crop in ["paddy", "cotton", "soybean", "maize"] else "annual"),
                    "soil_condition": soil_cond,
                    "nutrient": nutrient_label,
                    "recommended_n": n_val,
                    "recommended_p": p_val,
                    "recommended_k": k_val,
                    "fertilizer": fert_name,
                    "dose": dose_str,
                    "unit": unit_str,
                    "application_stage": stage,
                    "conditions": conditions,
                    "target_yield": target_yield,
                    "verification_status": "needs_review",
                    "source": {
                        "organization": org,
                        "document": file_name,
                        "page": page_num,
                        "year": year
                    }
                }
                extracted_records.append(record)

        docs_pages_involved[file_name] = {
            "total_pages": len(reader.pages),
            "pages_processed": pages_processed
        }

    # Deduplicate exact duplicate records
    unique_records = []
    seen = set()
    for rec in extracted_records:
        rec_hash = (
            rec["crop"],
            rec.get("recommended_n"),
            rec.get("recommended_p"),
            rec.get("recommended_k"),
            rec.get("fertilizer"),
            rec.get("dose"),
            rec.get("application_stage"),
            rec.get("soil_condition"),
            rec["source"]["document"],
            rec["source"]["page"]
        )
        if rec_hash not in seen:
            seen.add(rec_hash)
            unique_records.append(rec)

    # Save fertilizer_recommendations.json
    out_file = Path(output_json)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(unique_records, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ Generated '{output_json}' with {len(unique_records)} verified fertilizer records.")

    # Save fertilizer_extraction_report.json
    report_data = {
        "total_source_records_examined": total_source_records_examined,
        "fertilizer_records_extracted": len(unique_records),
        "records_excluded": len(excluded_records),
        "records_requiring_manual_verification": len(manual_verification_records),
        "records_with_corrupted_or_ambiguous_text": len(corrupted_records),
        "source_documents_and_pages_involved": docs_pages_involved,
        "exclusion_summary": {
            "non_fertilizer_topic_count": len([r for r in excluded_records if "Non-fertilizer" in r["reason"]]),
            "crop_unstated_count": len([r for r in excluded_records if "Crop unstated" in r["reason"]]),
            "corrupted_text_count": len([r for r in excluded_records if "Corrupted" in r["reason"]])
        }
    }

    report_file = Path(report_json)
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    logger.info(f"📊 Extraction report written to '{report_json}'.")

    return report_data


if __name__ == "__main__":
    report = process_official_documents()
    print("\nDataset Generation Summary:")
    print(f"  - Examined Records: {report['total_source_records_examined']}")
    print(f"  - Fertilizer Records Extracted: {report['fertilizer_records_extracted']}")
    print(f"  - Records Excluded: {report['records_excluded']}")
    print(f"  - Manual Verification Required: {report['records_requiring_manual_verification']}")
    print(f"  - Corrupted/Ambiguous: {report['records_with_corrupted_or_ambiguous_text']}")
