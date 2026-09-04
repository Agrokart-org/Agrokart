"""
AgroKart Clean ML Candidate Fertilizer Dataset Builder & Report Generator
Processes official MPKV agricultural PDFs with strict semantic, unit, and input category classification.

Generates:
1. rag_service/data/knowledge/ml_candidate_fertilizer_data.json
2. rag_service/data/knowledge/ml_candidate_report.json
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
        "sugarcane": ["sugarcane", "ganna", "ऊस", "com 0265", "phule 0265", "ms 10001", "suru sugarcane", "adsali sugarcane", "ratoon"],
        "cotton": ["cotton", "kapas", "कपास", "akh", "phule dhanwantari", "bt. cotton"],
        "maize": ["maize", "corn", "मक्का"],
        "soybean": ["soybean", "soya", "सोयाबीन"],
        "groundnut": ["groundnut", "peanut", "मूंगफली"],
        "onion": ["onion", "pyaz", "कांदा"],
        "coriander": ["coriander", "dhaniya"],
        "chickpea": ["chickpea", "gram", "चना"],
        "safflower": ["safflower", "karadai"],
        "pearl millet": ["pearl millet", "bajra", "बाजरा", "dhanshakti"]
    }

    for crop, kw_list in crops_map.items():
        if crop in fn_lower:
            return crop

    for crop, kw_list in crops_map.items():
        if any(kw in text_lower for kw in kw_list):
            return crop

    return None


def detect_soil_condition(text: str) -> Optional[str]:
    """Extract explicit soil condition if mentioned in the recommendation."""
    patterns = [
        r'(medium\s+black\s+soil[s]?)',
        r'(deep\s+black\s+soil[s]?)',
        r'(medium\s+to\s+deep\s+black\s+soil[s]?)',
        r'(medium\s+deep\s+black\s+soil[s]?)',
        r'(medium\s+deep\s+soil[s]?)',
        r'(shallow\s+black\s+soil[s]?)',
        r'(shallow\s+soil[s]?)',
        r'(inceptisols\s+of\s+western\s+maharashtra)',
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


def classify_input_category(text: str) -> str:
    """
    Classify recommendation block into exact input category:
    - crop_protection: pesticides, herbicides, insecticides, fungicides, sprays for pests
    - irrigation_input: water management, ETc, drip interval, wooden plank
    - organic_amendment: FYM, compost, manure, bagasse ash, mulch
    - micronutrient: zinc sulphate, ferrous sulphate, elemental sulphur, boron
    - fertilizer: chemical N/P/K fertilizers (Urea, DAP, MOP, SSP, NPK ratio)
    - other: biofertilizers, bio-inoculants, growth regulators
    """
    text_lower = text.lower()

    # 1. Explicit Chemical NPK Doses always classify as "fertilizer"
    if re.search(r'\b\d+\s*:\s*\d+\s*:\s*\d+\b', text_lower) or re.search(r'\b\d+\s*kg\s*n\b', text_lower):
        return "fertilizer"

    # Crop protection keywords
    pesticide_kws = [
        'jassid', 'aphid', 'thrips', 'whitefly', 'bolworm', 'smut', 'rust', 'weeds',
        'insecticide', 'pesticide', 'fungicide', 'herbicide', 'metribuzine', 'metribuzin',
        'emamectin', 'lambda cyhalothrin', 'flonicamid', 'thiamethoxam', 'acetamiprid',
        'neem oil', 'biopesticide', 'spray for the management of', 'control of'
    ]
    if any(kw in text_lower for kw in pesticide_kws) and not any(n in text_lower for n in ['120:60:40', '90:60:40', 'urea', 'dap', 'mop', 'npk']):
        return "crop_protection"

    # Irrigation input keywords
    irrigation_kws = [
        'planking', 'wooden plank', 'dragging', 'subsurface drip', 'etc water', 'crop evapotranspiration',
        'irrigation interval', 'rain gun', 'sprinkler irrigation system', 'water scarcity conditions'
    ]
    if any(kw in text_lower for kw in irrigation_kws) and not any(n in text_lower for n in ['urea', 'dap', 'mop', 'npk', 'kg ha']):
        return "irrigation_input"

    # Organic amendments
    organic_kws = ['fym', 'farm yard manure', 'compost', 'vermi compost', 'bagasse ash', 'pressmud', 'sugarcane trash']
    if any(kw in text_lower for kw in organic_kws) and not any(n in text_lower for n in ['120:60:40', '90:60:40', '240:120:120']):
        return "organic_amendment"

    # Micronutrients
    micro_kws = ['zinc sulphate', 'zinc sulfate', 'ferrous sulphate', 'elemental sulphur', 'boron', 'multimacronutrient grade ii']
    if any(kw in text_lower for kw in micro_kws) and not any(n in text_lower for n in ['120:60:40', '90:60:40']):
        return "micronutrient"

    # Chemical fertilizers
    fert_kws = ['urea', 'dap', 'mop', 'ssp', 'npk', 'nitrogen', 'phosphorus', 'potassium', '120:60:40', '90:60:40', '600 kg n']
    if any(kw in text_lower for kw in fert_kws):
        return "fertilizer"

    # Bio-inoculants / Growth regulators / Other
    if any(kw in text_lower for kw in ['azotobacter', 'azospirillum', 'acetobacter', 'rhizobium', 'psb', 'kmb', 'som', 'chitosan', 'bioinoculant', 'bio-inoculant', 'biofertilizer']):
        return "other"

    return "other"


def extract_exact_dose_and_unit(text: str) -> Tuple[Optional[str], Optional[str], Optional[int], Optional[int], Optional[int]]:
    """
    Extract source_dose, source_unit, recommended_n, recommended_p, recommended_k without unit conversion or fabrication.
    """
    # 1. N:P:K Ratio e.g. "120:60:40 NPK kg ha-1" or "90:45:30 kg/ha"
    npk_match = re.search(r'\b(\d+)\s*:\s*(\d+)\s*:\s*(\d+)\s*(?:N:P:K|NPK|N:P\s*2O5:K\s*2O|N:P)?\s*(?:kg\s*ha-1|kg/ha|kg\s*per\s*ha)?\b', text, re.IGNORECASE)
    if npk_match:
        n = int(npk_match.group(1))
        p = int(npk_match.group(2))
        k = int(npk_match.group(3))
        unit = "kg/ha" if ("ha" in text.lower() or "hectare" in text.lower()) else "kg/ha"
        return f"{n}:{p}:{k}", unit, n, p, k

    # 2. Explicit N, P, K quantities e.g. "600 Kg N, 230 kg P2O5 and 115 kg K2O"
    explicit_npk = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*N\b.*?\b(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*P(?:\s*2O5)?.*?\b(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*K(?:\s*2O)?', text, re.IGNORECASE)
    if explicit_npk:
        n = int(float(explicit_npk.group(1)))
        p = int(float(explicit_npk.group(2)))
        k = int(float(explicit_npk.group(3)))
        return f"{n}:{p}:{k}", "kg/ha", n, p, k

    # 3. Explicit tonnage e.g. "10 t ha-1" or "20 t ha-1" or "50 t FYM"
    t_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:t|ton|tonne|tonnes)\s*(?:ha-1|/ha|per\s+ha)?', text, re.IGNORECASE)
    if t_match:
        val = t_match.group(1)
        # Parse numeric float if integer
        num_val = int(float(val)) if float(val).is_integer() else float(val)
        return str(num_val), "t/ha", None, None, None

    # 4. Explicit kg/ha e.g. "25 kg ha-1" or "20 kg ha-1" or "1.25 kg a.i./ha"
    kg_match = re.search(r'(\d+(?:\.\d+)?)\s*kg\s*(?:a\.i\./ha|ha-1|/ha|per\s+ha)', text, re.IGNORECASE)
    if kg_match:
        val = kg_match.group(1)
        num_val = int(float(val)) if float(val).is_integer() else float(val)
        return str(num_val), "kg/ha", None, None, None

    # 5. Liquid dosage e.g. "5 lit. /ha" or "3 lit/ ha" or "2.5 L" or "500 ml"
    liquid_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lit\.|liters|litres|L|ml)\s*(?:/ha|ha-1|per\s+ha)?', text, re.IGNORECASE)
    if liquid_match:
        val = liquid_match.group(1)
        num_val = int(float(val)) if float(val).is_integer() else float(val)
        unit = "L/ha" if ("lit" in text.lower() or " l " in text.lower()) else "ml/ha"
        return str(num_val), unit, None, None, None

    # 6. Quintal e.g. "25 q ha-1" or "1.25 q/ha"
    q_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:q|quintal|quintals)\s*(?:ha-1|/ha|per\s+ha)?', text, re.IGNORECASE)
    if q_match:
        val = q_match.group(1)
        num_val = int(float(val)) if float(val).is_integer() else float(val)
        return str(num_val), "q/ha", None, None, None

    return None, None, None, None, None


def detect_fertilizer_product(text: str, category: str) -> str:
    """Identify explicit product name or general fertilizer name."""
    text_lower = text.lower()

    if re.search(r'\bneem\s+coated\s+urea\b', text_lower):
        return "Neem Coated Urea"
    if re.search(r'\burea\s+phosphate\b', text_lower):
        return "Urea Phosphate"
    if re.search(r'\burea\b', text_lower):
        return "Urea"
    if re.search(r'\bdap\b|\bdi-ammonium\s+phosphate\b', text_lower):
        return "DAP"
    if re.search(r'\bmop\b|\bmuriate\s+of\s+potash\b', text_lower):
        return "MOP"
    if re.search(r'\bssp\b|\bsingle\s+super\s+phosphate\b', text_lower):
        return "Single Super Phosphate (SSP)"
    if re.search(r'\bzinc\s+sulphate\b|\bzinc\s+sulfate\b', text_lower):
        return "Zinc Sulphate"
    if re.search(r'\bferrous\s+sulphate\b', text_lower):
        return "Ferrous Sulphate"
    if re.search(r'\belemental\s+sulphur\b|\bsulphur\b|\bsulfur\b', text_lower):
        return "Elemental Sulphur"
    if re.search(r'\bvermi\s*compost\b', text_lower):
        return "Vermicompost"
    if re.search(r'\bfym\b|\bfarm\s+yard\s+manure\b', text_lower):
        return "Farm Yard Manure (FYM)"
    if re.search(r'\bbagasse\s+ash\b', text_lower):
        return "Bagasse Ash"
    if re.search(r'\b19:19:19\b|\b19-19-19\b', text_lower):
        return "NPK 19-19-19 Water Soluble"

    if category == "organic_amendment":
        return "Organic Manure / FYM"
    if category == "micronutrient":
        return "Micronutrient Application"
    if category == "fertilizer":
        return "Chemical Fertilizer (NPK)"

    return "Agricultural Input"


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


def build_ml_candidate_dataset(
    doc_dir: str = "rag_service/data/agricultural_docs/official",
    candidates_output: str = "rag_service/data/knowledge/ml_candidate_fertilizer_data.json",
    report_output: str = "rag_service/data/knowledge/ml_candidate_report.json"
):
    """
    Process official MPKV PDF documents and generate:
    1. ml_candidate_fertilizer_data.json (Clean ML dataset)
    2. ml_candidate_report.json (Detailed breakdown & audit log)
    """
    logger.info(f"🔬 Building ML Candidate Fertilizer Dataset from: {doc_dir}")
    doc_path = Path(doc_dir)

    pdf_files = list(doc_path.rglob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files.")

    total_records_examined = 0
    valid_ml_candidates = []
    rejected_records = []
    records_needing_manual_verification = []

    records_by_crop = {}
    records_by_source = {}
    records_by_input_category = {}
    records_by_unit = {}
    duplicate_count = 0
    missing_field_count = 0

    seen_hashes = set()

    for pdf_file in sorted(pdf_files):
        reader = PdfReader(str(pdf_file))
        file_name = pdf_file.name
        org = "MPKV" if "MPKV" in str(pdf_file) else "ICAR"

        for p_idx, page in enumerate(reader.pages):
            page_num = p_idx + 1
            page_text = page.extract_text() or ""
            if not page_text.strip():
                continue

            lines = [l.strip() for l in page_text.split('\n') if l.strip()]
            full_page = " ".join(lines)

            # Split into individual recommendation blocks
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
                total_records_examined += 1

                # Classify input category
                category = classify_input_category(block_text)

                # EXCLUDE non-fertilizer input categories from ML candidates
                if category in ["crop_protection", "irrigation_input", "other"]:
                    rejected_records.append({
                        "document": file_name,
                        "page": page_num,
                        "category": category,
                        "reason": f"Excluded non-fertilizer input category ({category})",
                        "snippet": block_text[:120]
                    })
                    continue

                # Detect crop (MUST be identifiable)
                crop = detect_crop(block_text, file_name)
                if not crop:
                    missing_field_count += 1
                    records_needing_manual_verification.append({
                        "document": file_name,
                        "page": page_num,
                        "reason": "Crop unstated or ambiguous",
                        "snippet": block_text[:120]
                    })
                    rejected_records.append({
                        "document": file_name,
                        "page": page_num,
                        "category": category,
                        "reason": "Crop unstated",
                        "snippet": block_text[:120]
                    })
                    continue

                # Extract exact dose & unit from source (NO fabrication)
                source_dose, source_unit, n_val, p_val, k_val = extract_exact_dose_and_unit(block_text)

                if not source_dose or not source_unit:
                    missing_field_count += 1
                    rejected_records.append({
                        "document": file_name,
                        "page": page_num,
                        "category": category,
                        "reason": "No explicit numeric dose or unit in source text",
                        "snippet": block_text[:120]
                    })
                    continue

                # Soil condition & product
                soil_cond = detect_soil_condition(block_text)
                product_name = detect_fertilizer_product(block_text, category)
                stage = detect_application_stage(block_text)
                conditions = detect_conditions(block_text)
                year = extract_year(block_text, file_name)

                # Nutrient basis labeling
                nutrient_label = "NPK" if (n_val or p_val or k_val) else ("Organic Amendment" if category == "organic_amendment" else "Micronutrient")
                nutrient_basis = "N:P2O5:K2O" if (n_val or p_val or k_val) else "Total Product Mass / Organic"

                # Numeric source dose format
                parsed_source_dose = float(source_dose) if source_dose and source_dose.replace('.', '', 1).isdigit() else source_dose

                record = {
                    "crop": crop,
                    "state": "Maharashtra",
                    "season": "rabi" if crop == "wheat" else ("kharif" if crop in ["paddy", "cotton", "soybean", "maize"] else "annual"),
                    "soil_condition": soil_cond,
                    "input_category": category,
                    "fertilizer_product": product_name,
                    "nutrient": nutrient_label,
                    "recommended_n": n_val,
                    "recommended_p": p_val,
                    "recommended_k": k_val,
                    "source_dose": parsed_source_dose,
                    "source_unit": source_unit,
                    "nutrient_rate": f"{n_val}:{p_val}:{k_val} kg/ha" if (n_val is not None) else None,
                    "application_rate": f"{parsed_source_dose} {source_unit}",
                    "unit": source_unit,
                    "application_stage": stage,
                    "conditions": conditions,
                    "target_yield": None,  # Kept null (never fabricated)
                    "nutrient_basis": nutrient_basis,
                    "verification_status": "verified",
                    "source": {
                        "organization": org,
                        "document": file_name,
                        "page": page_num,
                        "year": year
                    }
                }

                # Deduplication check
                rec_hash = (
                    crop,
                    category,
                    n_val,
                    p_val,
                    k_val,
                    parsed_source_dose,
                    source_unit,
                    stage,
                    file_name,
                    page_num
                )
                if rec_hash in seen_hashes:
                    duplicate_count += 1
                    rejected_records.append({
                        "document": file_name,
                        "page": page_num,
                        "category": category,
                        "reason": "Duplicate record",
                        "snippet": block_text[:120]
                    })
                    continue

                seen_hashes.add(rec_hash)
                valid_ml_candidates.append(record)

                # Update stats
                records_by_crop[crop] = records_by_crop.get(crop, 0) + 1
                records_by_source[file_name] = records_by_source.get(file_name, 0) + 1
                records_by_input_category[category] = records_by_input_category.get(category, 0) + 1
                records_by_unit[source_unit] = records_by_unit.get(source_unit, 0) + 1

    # Write clean ML candidate file
    out_file = Path(candidates_output)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(valid_ml_candidates, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ Created clean ML candidate dataset at '{candidates_output}' with {len(valid_ml_candidates)} records.")

    # Write ML candidate report file
    report_data = {
        "total_records_examined": total_records_examined,
        "valid_ml_candidates": len(valid_ml_candidates),
        "rejected_records": len(rejected_records),
        "records_needing_manual_verification": len(records_needing_manual_verification),
        "records_by_crop": records_by_crop,
        "records_by_source": records_by_source,
        "records_by_input_category": records_by_input_category,
        "records_by_unit": records_by_unit,
        "duplicate_count": duplicate_count,
        "missing_field_count": missing_field_count,
        "notice": "This dataset represents clean, rule-verified candidates extracted from official MPKV PDFs. Manual domain expert verification is recommended before training Random Forest."
    }

    report_file = Path(report_output)
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    logger.info(f"📊 ML Candidate report written to '{report_output}'.")

    return report_data


if __name__ == "__main__":
    rep = build_ml_candidate_dataset()
    print("\nML Candidate Dataset Summary:")
    print(f"  - Total Examined: {rep['total_records_examined']}")
    print(f"  - Valid ML Candidates: {rep['valid_ml_candidates']}")
    print(f"  - Rejected Records: {rep['rejected_records']}")
    print(f"  - Needing Manual Verification: {rep['records_needing_manual_verification']}")
    print(f"  - Duplicate Count: {rep['duplicate_count']}")
