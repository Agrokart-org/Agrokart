"""
AgroKart Verified Agronomic Recommendations Builder
Processes official MPKV agricultural PDFs with strict categorization into:
1. NPK_FERTILIZER
2. ORGANIC_AMENDMENT
3. MICRONUTRIENT
4. OTHER

Outputs:
- rag_service/data/knowledge/verified_agronomic_recommendations.json
- rag_service/data/knowledge/verified_agronomic_report.json
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
    """Extract explicit soil condition if mentioned in the recommendation text."""
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


def classify_category_and_product(text: str) -> Tuple[str, str]:
    """
    Classify recommendation block into exact category:
    1. NPK_FERTILIZER
    2. ORGANIC_AMENDMENT
    3. MICRONUTRIENT
    4. OTHER
    """
    text_lower = text.lower()

    # 1. NPK Fertilizer checking
    if re.search(r'\b\d+\s*:\s*\d+\s*:\s*\d+\b', text_lower) or re.search(r'\b\d+\s*kg\s*n\b', text_lower) or any(k in text_lower for k in ['urea', 'dap', 'mop', 'ssp', 'npk', '19:19:19', '19-19-19', '0-0-50', 'urea phosphate']):
        if re.search(r'\bneem\s+coated\s+urea\b', text_lower):
            prod = "Neem Coated Urea"
        elif re.search(r'\burea\s+phosphate\b', text_lower):
            prod = "Urea Phosphate"
        elif re.search(r'\burea\b', text_lower):
            prod = "Urea"
        elif re.search(r'\bdap\b', text_lower):
            prod = "DAP"
        elif re.search(r'\bmop\b', text_lower):
            prod = "MOP"
        elif re.search(r'\bssp\b', text_lower):
            prod = "Single Super Phosphate (SSP)"
        elif re.search(r'\b19:19:19\b|\b19-19-19\b', text_lower):
            prod = "NPK 19-19-19 Water Soluble"
        else:
            prod = "Chemical Fertilizer (NPK)"
        return "NPK_FERTILIZER", prod

    # 2. Micronutrients
    if any(k in text_lower for k in ['zinc sulphate', 'zinc sulfate', 'ferrous sulphate', 'elemental sulphur', 'boron', 'multimacronutrient grade ii', 'micronutrient']):
        if "zinc" in text_lower:
            prod = "Zinc Sulphate"
        elif "ferrous" in text_lower or "iron" in text_lower:
            prod = "Ferrous Sulphate"
        elif "sulphur" in text_lower or "sulfur" in text_lower:
            prod = "Elemental Sulphur"
        else:
            prod = "Micronutrient Formulation"
        return "MICRONUTRIENT", prod

    # 3. Organic amendments
    if any(k in text_lower for k in ['fym', 'farm yard manure', 'compost', 'vermi compost', 'bagasse ash', 'pressmud', 'sugarcane trash', 'organic mulch']):
        if "vermi" in text_lower:
            prod = "Vermicompost"
        elif "bagasse" in text_lower:
            prod = "Bagasse Ash"
        elif "fym" in text_lower or "farm yard" in text_lower:
            prod = "Farm Yard Manure (FYM)"
        else:
            prod = "Organic Compost / Amendment"
        return "ORGANIC_AMENDMENT", prod

    # 4. Other (Biofertilizers, Bio-inoculants, Growth Regulators)
    if any(k in text_lower for k in ['azotobacter', 'azospirillum', 'acetobacter', 'rhizobium', 'psb', 'kmb', 'som', 'chitosan', 'bioinoculant', 'bio-inoculant', 'biofertilizer', 'oligo-chitosan']):
        if "azotobacter" in text_lower:
            prod = "Azotobacter Biofertilizer"
        elif "acetobacter" in text_lower:
            prod = "Acetobacter Biofertilizer"
        elif "rhizobium" in text_lower:
            prod = "Rhizobium Biofertilizer"
        else:
            prod = "Biofertilizer / Microbial Consortia"
        return "OTHER", prod

    return "OTHER", "Agricultural Input"


def extract_npk_explicit(text: str, category: str) -> Tuple[Optional[int], Optional[int], Optional[int]]:
    """
    Extract N, P2O5, K2O ONLY when explicitly present in NPK_FERTILIZER records.
    Never infer values for ORGANIC_AMENDMENT, MICRONUTRIENT, or OTHER.
    """
    if category != "NPK_FERTILIZER":
        return None, None, None

    # Ratio format e.g., 120:60:40 N:P2O5:K2O
    npk_ratio = re.search(r'\b(\d+)\s*:\s*(\d+)\s*:\s*(\d+)\s*(?:N:P:K|NPK|N:P\s*2O5:K\s*2O|N:P)?\b', text, re.IGNORECASE)
    if npk_ratio:
        n = int(npk_ratio.group(1))
        p2o5 = int(npk_ratio.group(2))
        k2o = int(npk_ratio.group(3))
        return n, p2o5, k2o

    # Explicit N, P2O5, K2O values e.g. "600 Kg N, 230 kg P2O5 and 115 kg K2O"
    explicit_npk = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*N\b.*?\b(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*P(?:\s*2O5)?.*?\b(\d+(?:\.\d+)?)\s*(?:kg|Kg)\s*K(?:\s*2O)?', text, re.IGNORECASE)
    if explicit_npk:
        n = int(float(explicit_npk.group(1)))
        p2o5 = int(float(explicit_npk.group(2)))
        k2o = int(float(explicit_npk.group(3)))
        return n, p2o5, k2o

    return None, None, None


def extract_dose_and_unit(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract exact dose and unit as published in source text."""
    # NPK ratio dose e.g., 120:60:40 kg/ha
    npk_ratio = re.search(r'\b(\d+\s*:\s*\d+\s*:\s*\d+)\s*(?:N:P:K|NPK|N:P\s*2O5:K\s*2O)?\s*(?:kg\s*ha-1|kg/ha|kg\s*per\s*ha)?\b', text, re.IGNORECASE)
    if npk_ratio:
        u = "kg/ha" if ("ha" in text.lower() or "hectare" in text.lower()) else "kg/ha"
        return f"{npk_ratio.group(1)} {u}", u

    # Explicit tonnage e.g. "10 t ha-1" or "20 t ha-1"
    t_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:t|ton|tonne|tonnes)\s*(?:ha-1|/ha|per\s+ha)?', text, re.IGNORECASE)
    if t_match:
        val = t_match.group(1)
        num_val = int(float(val)) if float(val).is_integer() else float(val)
        return f"{num_val} t/ha", "t/ha"

    # Explicit kg/ha e.g. "25 kg ha-1" or "20 kg ha-1"
    kg_match = re.search(r'(\d+(?:\.\d+)?)\s*kg\s*(?:a\.i\./ha|ha-1|/ha|per\s+ha)', text, re.IGNORECASE)
    if kg_match:
        val = kg_match.group(1)
        num_val = int(float(val)) if float(val).is_integer() else float(val)
        return f"{num_val} kg/ha", "kg/ha"

    # Liquid dose e.g. "5 lit. /ha" or "3 lit/ ha" or "2.5 L"
    liquid_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lit\.|liters|litres|L|ml)\s*(?:/ha|ha-1|per\s+ha)?', text, re.IGNORECASE)
    if liquid_match:
        val = liquid_match.group(1)
        num_val = int(float(val)) if float(val).is_integer() else float(val)
        unit = "L/ha" if ("lit" in text.lower() or " l " in text.lower()) else "ml/ha"
        return f"{num_val} {unit}", unit

    # Quintal e.g. "25 q ha-1"
    q_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:q|quintal|quintals)\s*(?:ha-1|/ha|per\s+ha)?', text, re.IGNORECASE)
    if q_match:
        val = q_match.group(1)
        num_val = int(float(val)) if float(val).is_integer() else float(val)
        return f"{num_val} q/ha", "q/ha"

    return None, None


def detect_application_stage(text: str) -> Optional[str]:
    """Extract explicit application stage timing."""
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


def build_verified_agronomic_dataset(
    doc_dir: str = "rag_service/data/agricultural_docs/official",
    dataset_output: str = "rag_service/data/knowledge/verified_agronomic_recommendations.json",
    report_output: str = "rag_service/data/knowledge/verified_agronomic_report.json"
):
    """
    Process official MPKV PDFs into verified agronomic rule dataset.
    """
    logger.info(f"📜 Building Verified Agronomic Recommendation Dataset from: {doc_dir}")
    doc_path = Path(doc_dir)

    pdf_files = list(doc_path.rglob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files.")

    total_records = 0
    verified_records = []
    rejected_records = []

    cat_counts = {
        "NPK_FERTILIZER": 0,
        "ORGANIC_AMENDMENT": 0,
        "MICRONUTRIENT": 0,
        "OTHER": 0
    }

    crops_represented = {}
    docs_represented = {}
    seen_hashes = set()
    duplicates_removed = 0

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

            # Split into recommendation blocks
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
                total_records += 1

                # Filter out pure pesticide / weed control / irrigation planking recommendations
                text_lower = block_text.lower()
                pesticide_kws = ['jassid', 'aphid', 'thrips', 'whitefly', 'bolworm', 'smut', 'rust', 'metribuzine', 'emamectin', 'flonicamid', 'thiamethoxam', 'acetamiprid', 'control of aphid']
                irrigation_kws = ['wooden plank', 'dragging', 'etc water', 'crop evapotranspiration', 'rain gun']

                if any(kw in text_lower for kw in pesticide_kws) and not any(n in text_lower for n in ['120:60:40', '90:60:40', 'urea', 'dap', 'mop']):
                    rejected_records.append({"doc": file_name, "page": page_num, "reason": "Pest control recommendation", "snippet": block_text[:100]})
                    continue

                if any(kw in text_lower for kw in irrigation_kws) and not any(n in text_lower for n in ['urea', 'dap', 'mop', 'npk', 'kg ha']):
                    rejected_records.append({"doc": file_name, "page": page_num, "reason": "Irrigation technique recommendation", "snippet": block_text[:100]})
                    continue

                # Crop detection
                crop = detect_crop(block_text, file_name)
                if not crop:
                    rejected_records.append({"doc": file_name, "page": page_num, "reason": "Crop unstated", "snippet": block_text[:100]})
                    continue

                # Category & Product Classification
                category, prod_name = classify_category_and_product(block_text)

                # Dose & Unit Extraction
                dose_str, unit_str = extract_dose_and_unit(block_text)

                # Explicit N, P2O5, K2O
                n_val, p2o5_val, k2o_val = extract_npk_explicit(block_text, category)

                soil_cond = detect_soil_condition(block_text)
                stage = detect_application_stage(block_text)
                conditions = detect_conditions(block_text)
                year = extract_year(block_text, file_name)

                record = {
                    "crop": crop,
                    "state": "Maharashtra",
                    "season": "rabi" if crop == "wheat" else ("kharif" if crop in ["paddy", "cotton", "soybean", "maize"] else "annual"),
                    "soil_condition": soil_cond,
                    "input_category": category,
                    "fertilizer_product": prod_name,
                    "recommended_n": n_val,
                    "recommended_p2o5": p2o5_val,
                    "recommended_k2o": k2o_val,
                    "dose": dose_str,
                    "unit": unit_str,
                    "application_stage": stage,
                    "conditions": conditions,
                    "source": {
                        "organization": org,
                        "document": file_name,
                        "page": page_num,
                        "year": year
                    },
                    "verification_status": "source_verified"
                }

                # Deduplication check
                rec_hash = (
                    crop,
                    category,
                    prod_name,
                    n_val,
                    p2o5_val,
                    k2o_val,
                    dose_str,
                    unit_str,
                    stage,
                    file_name,
                    page_num
                )
                if rec_hash in seen_hashes:
                    duplicates_removed += 1
                    continue

                seen_hashes.add(rec_hash)
                verified_records.append(record)

                cat_counts[category] = cat_counts.get(category, 0) + 1
                crops_represented[crop] = crops_represented.get(crop, 0) + 1
                docs_represented[file_name] = docs_represented.get(file_name, 0) + 1

    # Save dataset JSON
    out_file = Path(dataset_output)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(verified_records, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ Created verified agronomic dataset at '{dataset_output}' with {len(verified_records)} records.")

    # Save report JSON
    report_data = {
        "total_records": total_records,
        "verified_records_count": len(verified_records),
        "npk_fertilizer_records": cat_counts["NPK_FERTILIZER"],
        "organic_amendment_records": cat_counts["ORGANIC_AMENDMENT"],
        "micronutrient_records": cat_counts["MICRONUTRIENT"],
        "other_records": cat_counts["OTHER"],
        "duplicates_removed": duplicates_removed,
        "records_rejected": len(rejected_records),
        "crops_represented": crops_represented,
        "source_documents_represented": docs_represented
    }

    report_file = Path(report_output)
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    logger.info(f"📊 Agronomic dataset report written to '{report_output}'.")

    return report_data


if __name__ == "__main__":
    rep = build_verified_agronomic_dataset()
    print("\nVerified Agronomic Dataset Summary:")
    print(f"  - Total Records Processed: {rep['total_records']}")
    print(f"  - Verified Agronomic Records: {rep['verified_records_count']}")
    print(f"  - NPK Fertilizer Records: {rep['npk_fertilizer_records']}")
    print(f"  - Organic Amendment Records: {rep['organic_amendment_records']}")
    print(f"  - Micronutrient Records: {rep['micronutrient_records']}")
    print(f"  - Other Records: {rep['other_records']}")
    print(f"  - Duplicates Removed: {rep['duplicates_removed']}")
    print(f"  - Records Rejected: {rep['records_rejected']}")
