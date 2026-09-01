import re
from typing import Dict, Any, Tuple
from normalization import normalize_description
from extraction import extract_attributes
from embeddings import generate_embedding, calculate_cosine_similarity

def parse_float(val_str: Any) -> float:
    """Helper to convert string dimension values to float for numeric matching."""
    if val_str is None:
        return None
    if isinstance(val_str, (int, float)):
        return float(val_str)
    
    val_str = str(val_str).lower().strip()
    # Handle fraction like 1/2 or 1 1/2
    if '/' in val_str:
        try:
            if ' ' in val_str:
                parts = val_str.split(' ')
                whole = float(parts[0])
                frac_parts = parts[1].split('/')
                frac = float(frac_parts[0]) / float(frac_parts[1])
                return whole + frac
            else:
                parts = val_str.split('/')
                return float(parts[0]) / float(parts[1])
        except Exception:
            pass
            
    # Try parsing first numeric match
    match = re.search(r'([0-9]+(?:\.[0-9]+)?)', val_str)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return None

def check_dimension_equivalence(val1: Any, unit1: Any, val2: Any, unit2: Any) -> Tuple[bool, str]:
    """
    Checks if dimensions are physically equivalent, converting units (e.g., inches to mm).
    Returns (is_equivalent, status_message).
    """
    f1 = parse_float(val1)
    f2 = parse_float(val2)
    
    if f1 is None or f2 is None:
        return True, "MISSING_DATA" # Cannot verify, so treat as potentially matching (do not reject)

    u1 = str(unit1).lower().strip() if unit1 else ""
    u2 = str(unit2).lower().strip() if unit2 else ""

    # Normalize unit strings
    for inch_val in ['inch', 'inches', '"', 'in']:
        if inch_val in u1: u1 = 'inch'
        if inch_val in u2: u2 = 'inch'
        
    # Standardize mm
    if 'mm' in u1 or 'millimeter' in u1: u1 = 'mm'
    if 'mm' in u2 or 'millimeter' in u2: u2 = 'mm'
    
    # Standardize m
    if 'meter' in u1 or u1 == 'm': u1 = 'm'
    if 'meter' in u2 or u2 == 'm': u2 = 'm'

    # If units are identical, do direct float comparison
    if u1 == u2 or not u1 or not u2:
        return abs(f1 - f2) < 0.01, "MATCH" if abs(f1 - f2) < 0.01 else "MISMATCH"

    # Conversion logic
    # Inch to mm
    if u1 == 'inch' and u2 == 'mm':
        converted = f1 * 25.4
        return abs(converted - f2) < 1.0, "MATCH" if abs(converted - f2) < 1.0 else "MISMATCH"
    if u1 == 'mm' and u2 == 'inch':
        converted = f2 * 25.4
        return abs(f1 - converted) < 1.0, "MATCH" if abs(f1 - converted) < 1.0 else "MISMATCH"

    # Meter to mm
    if u1 == 'm' and u2 == 'mm':
        converted = f1 * 1000.0
        return abs(converted - f2) < 1.0, "MATCH" if abs(converted - f2) < 1.0 else "MISMATCH"
    if u1 == 'mm' and u2 == 'm':
        converted = f2 * 1000.0
        return abs(f1 - converted) < 1.0, "MATCH" if abs(f1 - converted) < 1.0 else "MISMATCH"

    return abs(f1 - f2) < 0.01, "MATCH" if abs(f1 - f2) < 0.01 else "MISMATCH"

def match_materials(mat_a: Dict[str, Any], mat_b: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the Dual-Check Matching Pipeline between Material A and Material B.
    1. Compares text embedding similarity.
    2. Runs technical parameter extraction (if not cached).
    3. Runs strict mismatch validation on product type, material, grade, dimensions.
    4. Computes a weighted overall score.
    5. Returns explainable evaluation summary.
    """
    # Normalize descriptions if needed
    desc_a = mat_a.get("normalized_description") or normalize_description(mat_a.get("description", ""))
    desc_b = mat_b.get("normalized_description") or normalize_description(mat_b.get("description", ""))
    
    # 1. Semantic Similarity
    emb_a = mat_a.get("embedding")
    emb_b = mat_b.get("embedding")
    if not emb_a:
        emb_a = generate_embedding(desc_a)
    if not emb_b:
        emb_b = generate_embedding(desc_b)
        
    sem_sim = calculate_cosine_similarity(emb_a, emb_b)
    
    # 2. Extract structured attributes (fall back to online extractor if db missing details)
    attrs_a = {
        "product_type": mat_a.get("material_type"),
        "material": mat_a.get("material_grade") if mat_a.get("material_grade") in ['SS', 'CS'] else None, # fallback check
        "material_grade": mat_a.get("material_grade"),
        "dimension": mat_a.get("dimension"),
        "dimension_unit": mat_a.get("dimension_unit"),
        "length": mat_a.get("length"),
        "length_unit": mat_a.get("length_unit"),
        "pressure": mat_a.get("pressure"),
        "pressure_unit": mat_a.get("pressure_unit"),
        "standard_reference": mat_a.get("standard_reference")
    }
    
    # If standard fields are empty, execute NLP extraction on raw/normalized desc
    extracted_a = extract_attributes(mat_a.get("description", ""), desc_a)
    extracted_b = extract_attributes(mat_b.get("description", ""), desc_b)
    
    for k in attrs_a.keys():
        if attrs_a[k] is None:
            attrs_a[k] = extracted_a[k]
            
    attrs_b = {
        "product_type": mat_b.get("material_type"),
        "material": mat_b.get("material_grade") if mat_b.get("material_grade") in ['SS', 'CS'] else None,
        "material_grade": mat_b.get("material_grade"),
        "dimension": mat_b.get("dimension"),
        "dimension_unit": mat_b.get("dimension_unit"),
        "length": mat_b.get("length"),
        "length_unit": mat_b.get("length_unit"),
        "pressure": mat_b.get("pressure"),
        "pressure_unit": mat_b.get("pressure_unit"),
        "standard_reference": mat_b.get("standard_reference")
    }
    for k in attrs_b.keys():
        if attrs_b[k] is None:
            attrs_b[k] = extracted_b[k]
            
    # Resolve materials names (some abbreviations get normalized, let's keep them in line)
    # E.g. description "SS Pipe" yields material="stainless steel" from extractor
    if not attrs_a["material"] and attrs_a["material_grade"] in ['SS', 'SS304', 'SS316']:
        attrs_a["material"] = 'stainless steel'
    if not attrs_b["material"] and attrs_b["material_grade"] in ['SS', 'SS304', 'SS316']:
        attrs_b["material"] = 'stainless steel'
    if not attrs_a["material"] and attrs_a["material_grade"] in ['CS', 'CARBON STEEL']:
        attrs_a["material"] = 'carbon steel'
    if not attrs_b["material"] and attrs_b["material_grade"] in ['CS', 'CARBON STEEL']:
        attrs_b["material"] = 'carbon steel'
        
    # Check if there is insufficient information to evaluate
    critical_attributes_present_a = any([attrs_a["product_type"], attrs_a["material"], attrs_a["dimension"]])
    critical_attributes_present_b = any([attrs_b["product_type"], attrs_b["material"], attrs_b["dimension"]])
    
    # If the description itself is extremely short, e.g. "Industrial Pipe" (missing key attributes)
    is_insufficient = False
    if (not critical_attributes_present_a or not critical_attributes_present_b) or (
        not attrs_a["dimension"] and not attrs_a["material_grade"] and not attrs_a["standard_reference"]
    ) or (
        not attrs_b["dimension"] and not attrs_b["material_grade"] and not attrs_b["standard_reference"]
    ):
        # Allow matching if they are literally identical strings, otherwise insufficient
        if desc_a != desc_b:
            is_insufficient = True

    # 3. Component Comparisons & Scoring weights
    comp = {}
    mismatch_detected = False
    mismatch_reasons = []
    
    # Feature 1: Product Type (Weight: 15%)
    prod_score = 0.0
    if attrs_a["product_type"] and attrs_b["product_type"]:
        if attrs_a["product_type"] == attrs_b["product_type"]:
            comp["product_type"] = "MATCH"
            prod_score = 1.0
        else:
            comp["product_type"] = "MISMATCH"
            mismatch_detected = True
            mismatch_reasons.append(f"Product type mismatch: '{attrs_a['product_type']}' vs '{attrs_b['product_type']}'")
    else:
        comp["product_type"] = "MISSING"
        prod_score = 0.5
        
    # Feature 2: Material (Weight: 10%)
    mat_score = 0.0
    if attrs_a["material"] and attrs_b["material"]:
        # standardizing "stainless steel" vs "ss" or "carbon steel" vs "cs"
        if attrs_a["material"] == attrs_b["material"]:
            comp["material"] = "MATCH"
            mat_score = 1.0
        else:
            comp["material"] = "MISMATCH"
            mismatch_detected = True
            mismatch_reasons.append(f"Material mismatch: '{attrs_a['material']}' vs '{attrs_b['material']}'")
    else:
        comp["material"] = "MISSING"
        mat_score = 0.5
        
    # Feature 3: Grade (Weight: 10%)
    grade_score = 0.0
    # Strip common SS prefixes to compare raw grade (e.g. SS304 vs 304)
    g_a = re.sub(r'^(ss|cs)\s*', '', str(attrs_a["material_grade"] or "").lower()).strip()
    g_b = re.sub(r'^(ss|cs)\s*', '', str(attrs_b["material_grade"] or "").lower()).strip()
    
    if attrs_a["material_grade"] and attrs_b["material_grade"]:
        if g_a == g_b or (g_a in g_b) or (g_b in g_a):
            comp["grade"] = "MATCH"
            grade_score = 1.0
        else:
            comp["grade"] = "MISMATCH"
            mismatch_detected = True
            mismatch_reasons.append(f"Material grade mismatch: '{attrs_a['material_grade']}' vs '{attrs_b['material_grade']}'")
    else:
        comp["grade"] = "MISSING"
        grade_score = 0.5
        
    # Feature 4: Dimension (Weight: 15%)
    dim_score = 0.0
    dim_unit_score = 0.0
    if attrs_a["dimension"] and attrs_b["dimension"]:
        equiv, status = check_dimension_equivalence(
            attrs_a["dimension"], attrs_a["dimension_unit"],
            attrs_b["dimension"], attrs_b["dimension_unit"]
        )
        if equiv:
            comp["dimension"] = "MATCH"
            dim_score = 1.0
            # If values match after conversion, let's also check if units were explicitly equal
            u_a = str(attrs_a["dimension_unit"] or "").lower()
            u_b = str(attrs_b["dimension_unit"] or "").lower()
            if u_a == u_b:
                comp["dimension_unit"] = "MATCH"
                dim_unit_score = 1.0
            else:
                comp["dimension_unit"] = "MATCH_CONVERTED"
                dim_unit_score = 0.75
        else:
            comp["dimension"] = "MISMATCH"
            comp["dimension_unit"] = "MISMATCH"
            mismatch_detected = True
            mismatch_reasons.append(f"Dimension mismatch: '{attrs_a['dimension']}{attrs_a['dimension_unit'] or ''}' vs '{attrs_b['dimension']}{attrs_b['dimension_unit'] or ''}'")
    else:
        comp["dimension"] = "MISSING"
        comp["dimension_unit"] = "MISSING"
        dim_score = 0.5
        dim_unit_score = 0.5
        
    # Feature 5: Length (Weight: 10%)
    len_score = 0.0
    if attrs_a["length"] and attrs_b["length"]:
        equiv, status = check_dimension_equivalence(
            attrs_a["length"], attrs_a["length_unit"],
            attrs_b["length"], attrs_b["length_unit"]
        )
        if equiv:
            comp["length"] = "MATCH"
            len_score = 1.0
        else:
            comp["length"] = "MISMATCH"
            mismatch_detected = True
            mismatch_reasons.append(f"Length mismatch: '{attrs_a['length']}{attrs_a['length_unit'] or ''}' vs '{attrs_b['length']}{attrs_b['length_unit'] or ''}'")
    else:
        comp["length"] = "MISSING"
        len_score = 0.5
        
    # Feature 6: Standard / Spec reference (Weight: 10%)
    std_score = 0.0
    if attrs_a["standard_reference"] and attrs_b["standard_reference"]:
        s_a = attrs_a["standard_reference"].replace(" ", "")
        s_b = attrs_b["standard_reference"].replace(" ", "")
        if s_a == s_b:
            comp["standard"] = "MATCH"
            std_score = 1.0
        else:
            comp["standard"] = "MISMATCH"
            # Standard mismatches are not always absolute rejection rules unless they conflict.
            # We record mismatch reason but don't force immediate rejection.
            std_score = 0.2
    else:
        comp["standard"] = "MISSING"
        std_score = 0.5
        
    # Feature 7: Pressure Rating (Weight: 10%)
    pres_score = 0.0
    if attrs_a["pressure"] and attrs_b["pressure"]:
        if attrs_a["pressure"] == attrs_b["pressure"]:
            comp["pressure"] = "MATCH"
            pres_score = 1.0
        else:
            comp["pressure"] = "MISMATCH"
            mismatch_detected = True
            mismatch_reasons.append(f"Pressure rating mismatch: '{attrs_a['pressure']}{attrs_a['pressure_unit'] or ''}' vs '{attrs_b['pressure']}{attrs_b['pressure_unit'] or ''}'")
    else:
        comp["pressure"] = "MISSING"
        pres_score = 0.5

    # 4. Score Aggregation
    # Semantic: 40%
    # Product Type: 15%
    # Material: 10%
    # Grade: 10%
    # Dimension value: 10%
    # Dimension unit: 5%
    # Length: 5%
    # Standard: 5%
    # Pressure: 10%
    
    technical_score = (
        (prod_score * 0.15) +
        (mat_score * 0.10) +
        (grade_score * 0.10) +
        (dim_score * 0.10) +
        (dim_unit_score * 0.05) +
        (len_score * 0.05) +
        (std_score * 0.05) +
        (pres_score * 0.10)
    ) / 0.70 # scale back technical components to 1.0 range
    
    # Calculate final weighted score
    final_score = (sem_sim * 0.40) + (technical_score * 0.60)
    
    # 5. Resolve Match Outcome
    if is_insufficient:
        result = "INSUFFICIENT INFORMATION"
        reason = "Insufficient critical technical attributes extracted (e.g. diameter, material grade, or standard) to safely assess equivalence."
        confidence = 0.5
    elif mismatch_detected:
        # A hard validation rule: if critical parameters mismatch, set result as DIFFERENT
        result = "DIFFERENT"
        reason = "Critical parameter mismatch: " + "; ".join(mismatch_reasons)
        # Drop confidence because of rule-based validation rejection
        confidence = min(0.3, final_score)
    else:
        # Check matching outcome categories based on threshold
        if final_score >= 0.96 and sem_sim >= 0.90:
            result = "EXACT DUPLICATE"
            reason = "Descriptions are semantically identical and all technical dimensions are aligned."
            confidence = final_score
        elif final_score >= 0.85:
            result = "EQUIVALENT"
            reason = "Descriptions represent the same physical material. Key features (type, grade, size) match successfully."
            confidence = final_score
        elif final_score >= 0.75:
            result = "NEAR DUPLICATE"
            reason = "Highly comparable item features, with slight variations in naming format or auxiliary parameters."
            confidence = final_score
        elif final_score >= 0.65:
            result = "POSSIBLE MATCH"
            reason = "Potential equivalence, but contains minor parameter gaps. Human review recommended."
            confidence = final_score
        else:
            result = "DIFFERENT"
            reason = "Semantic similarity and technical parameters are below standard threshold requirements."
            confidence = final_score
            
    return {
        "result": result,
        "confidence": round(confidence, 4),
        "semantic_similarity": round(sem_sim, 4),
        "technical_score": round(technical_score, 4),
        "reason": reason,
        "comparison": comp
    }
