import re
from typing import Dict, Any, Optional
from app.config import settings
from app.services.normalization_service import normalize_description
from app.services.extraction_service import extract_attributes
from app.services.embedding_service import embedding_service
from app.utils.units import check_dimension_equivalence


def resolve_material_from_grade(attrs: Dict[str, Any]) -> Dict[str, Any]:
    if not attrs["material"] and attrs["material_grade"]:
        grade_lower = str(attrs["material_grade"]).lower()
        if grade_lower in ['ss', 'ss304', 'ss316']:
            attrs["material"] = 'stainless steel'
        elif grade_lower in ['cs', 'carbon steel']:
            attrs["material"] = 'carbon steel'
    return attrs


def has_critical_attributes(attrs: Dict[str, Any]) -> bool:
    return any([attrs["product_type"], attrs["material"], attrs["dimension"]])


def compare_attributes(
    attrs_a: Dict[str, Any], attrs_b: Dict[str, Any]
) -> tuple[Dict[str, str], float, bool, list[str]]:
    comp = {}
    mismatch_detected = False
    mismatch_reasons = []

    weights = {
        "product_type": settings.WEIGHT_PRODUCT_TYPE,
        "material": settings.WEIGHT_MATERIAL,
        "grade": settings.WEIGHT_GRADE,
        "dimension": settings.WEIGHT_DIMENSION,
        "dimension_unit": settings.WEIGHT_DIMENSION_UNIT,
        "length": settings.WEIGHT_LENGTH,
        "standard": settings.WEIGHT_STANDARD,
        "pressure": settings.WEIGHT_PRESSURE,
    }

    scores = {}

    if attrs_a["product_type"] and attrs_b["product_type"]:
        if attrs_a["product_type"] == attrs_b["product_type"]:
            comp["product_type"] = "MATCH"
            scores["product_type"] = 1.0
        else:
            comp["product_type"] = "MISMATCH"
            scores["product_type"] = 0.0
            mismatch_detected = True
            mismatch_reasons.append(f"Product type mismatch: '{attrs_a['product_type']}' vs '{attrs_b['product_type']}'")
    else:
        comp["product_type"] = "MISSING"
        scores["product_type"] = 0.5

    if attrs_a["material"] and attrs_b["material"]:
        if attrs_a["material"] == attrs_b["material"]:
            comp["material"] = "MATCH"
            scores["material"] = 1.0
        else:
            comp["material"] = "MISMATCH"
            scores["material"] = 0.0
            mismatch_detected = True
            mismatch_reasons.append(f"Material mismatch: '{attrs_a['material']}' vs '{attrs_b['material']}'")
    else:
        comp["material"] = "MISSING"
        scores["material"] = 0.5

    g_a = re.sub(r'^(ss|cs)\s*', '', str(attrs_a["material_grade"] or "").lower()).strip()
    g_b = re.sub(r'^(ss|cs)\s*', '', str(attrs_b["material_grade"] or "").lower()).strip()
    if attrs_a["material_grade"] and attrs_b["material_grade"]:
        if g_a == g_b or (g_a in g_b) or (g_b in g_a):
            comp["grade"] = "MATCH"
            scores["grade"] = 1.0
        else:
            comp["grade"] = "MISMATCH"
            scores["grade"] = 0.0
            mismatch_detected = True
            mismatch_reasons.append(f"Material grade mismatch: '{attrs_a['material_grade']}' vs '{attrs_b['material_grade']}'")
    else:
        comp["grade"] = "MISSING"
        scores["grade"] = 0.5

    if attrs_a["dimension"] and attrs_b["dimension"]:
        equiv, status = check_dimension_equivalence(
            attrs_a["dimension"], attrs_a["dimension_unit"],
            attrs_b["dimension"], attrs_b["dimension_unit"]
        )
        if equiv:
            comp["dimension"] = "MATCH"
            scores["dimension"] = 1.0
            u_a = str(attrs_a["dimension_unit"] or "").lower()
            u_b = str(attrs_b["dimension_unit"] or "").lower()
            if u_a == u_b:
                comp["dimension_unit"] = "MATCH"
                scores["dimension_unit"] = 1.0
            else:
                comp["dimension_unit"] = "MATCH_CONVERTED"
                scores["dimension_unit"] = 0.75
        else:
            comp["dimension"] = "MISMATCH"
            comp["dimension_unit"] = "MISMATCH"
            scores["dimension"] = 0.0
            scores["dimension_unit"] = 0.0
            mismatch_detected = True
            mismatch_reasons.append(f"Dimension mismatch: '{attrs_a['dimension']}{attrs_a['dimension_unit'] or ''}' vs '{attrs_b['dimension']}{attrs_b['dimension_unit'] or ''}'")
    else:
        comp["dimension"] = "MISSING"
        comp["dimension_unit"] = "MISSING"
        scores["dimension"] = 0.5
        scores["dimension_unit"] = 0.5

    if attrs_a["length"] and attrs_b["length"]:
        equiv, status = check_dimension_equivalence(
            attrs_a["length"], attrs_a["length_unit"],
            attrs_b["length"], attrs_b["length_unit"]
        )
        if equiv:
            comp["length"] = "MATCH"
            scores["length"] = 1.0
        else:
            comp["length"] = "MISMATCH"
            scores["length"] = 0.0
            mismatch_detected = True
            mismatch_reasons.append(f"Length mismatch: '{attrs_a['length']}{attrs_a['length_unit'] or ''}' vs '{attrs_b['length']}{attrs_b['length_unit'] or ''}'")
    else:
        comp["length"] = "MISSING"
        scores["length"] = 0.5

    if attrs_a["standard_reference"] and attrs_b["standard_reference"]:
        s_a = attrs_a["standard_reference"].replace(" ", "")
        s_b = attrs_b["standard_reference"].replace(" ", "")
        if s_a == s_b:
            comp["standard"] = "MATCH"
            scores["standard"] = 1.0
        else:
            comp["standard"] = "MISMATCH"
            scores["standard"] = 0.2
    else:
        comp["standard"] = "MISSING"
        scores["standard"] = 0.5

    if attrs_a["pressure"] and attrs_b["pressure"]:
        if attrs_a["pressure"] == attrs_b["pressure"]:
            comp["pressure"] = "MATCH"
            scores["pressure"] = 1.0
        else:
            comp["pressure"] = "MISMATCH"
            scores["pressure"] = 0.0
            mismatch_detected = True
            mismatch_reasons.append(f"Pressure rating mismatch: '{attrs_a['pressure']}{attrs_a['pressure_unit'] or ''}' vs '{attrs_b['pressure']}{attrs_b['pressure_unit'] or ''}'")
    else:
        comp["pressure"] = "MISSING"
        scores["pressure"] = 0.5

    total_weight = sum(weights.values())
    technical_score = sum(scores.get(k, 0) * w for k, w in weights.items()) / total_weight

    return comp, technical_score, mismatch_detected, mismatch_reasons


async def match_materials(
    mat_a: Dict[str, Any],
    mat_b: Dict[str, Any]
) -> Dict[str, Any]:
    desc_a = mat_a.get("normalized_description") or normalize_description(mat_a.get("description", ""))
    desc_b = mat_b.get("normalized_description") or normalize_description(mat_b.get("description", ""))

    emb_a = mat_a.get("embedding")
    emb_b = mat_b.get("embedding")
    if not emb_a:
        emb_a = await embedding_service.generate_embedding(desc_a)
    if not emb_b:
        emb_b = await embedding_service.generate_embedding(desc_b)

    sem_sim = embedding_service.calculate_cosine_similarity(emb_a, emb_b)

    attrs_a = {
        "product_type": mat_a.get("material_type"),
        "material": mat_a.get("material"),
        "material_grade": mat_a.get("material_grade"),
        "dimension": mat_a.get("dimension"),
        "dimension_unit": mat_a.get("dimension_unit"),
        "length": mat_a.get("length"),
        "length_unit": mat_a.get("length_unit"),
        "pressure": mat_a.get("pressure"),
        "pressure_unit": mat_a.get("pressure_unit"),
        "standard_reference": mat_a.get("standard_reference"),
    }
    attrs_b = {
        "product_type": mat_b.get("material_type"),
        "material": mat_b.get("material"),
        "material_grade": mat_b.get("material_grade"),
        "dimension": mat_b.get("dimension"),
        "dimension_unit": mat_b.get("dimension_unit"),
        "length": mat_b.get("length"),
        "length_unit": mat_b.get("length_unit"),
        "pressure": mat_b.get("pressure"),
        "pressure_unit": mat_b.get("pressure_unit"),
        "standard_reference": mat_b.get("standard_reference"),
    }

    extracted_a = extract_attributes(mat_a.get("description", ""), desc_a)
    extracted_b = extract_attributes(mat_b.get("description", ""), desc_b)

    for k in attrs_a.keys():
        if attrs_a[k] is None:
            attrs_a[k] = extracted_a[k]
    for k in attrs_b.keys():
        if attrs_b[k] is None:
            attrs_b[k] = extracted_b[k]

    attrs_a = resolve_material_from_grade(attrs_a)
    attrs_b = resolve_material_from_grade(attrs_b)

    critical_a = has_critical_attributes(attrs_a)
    critical_b = has_critical_attributes(attrs_b)

    is_insufficient = False
    if (not critical_a or not critical_b) or (
        not attrs_a["dimension"] and not attrs_a["material_grade"] and not attrs_a["standard_reference"]
    ) or (
        not attrs_b["dimension"] and not attrs_b["material_grade"] and not attrs_b["standard_reference"]
    ):
        if desc_a != desc_b:
            is_insufficient = True

    comp, technical_score, mismatch_detected, mismatch_reasons = compare_attributes(attrs_a, attrs_b)

    final_score = (sem_sim * settings.WEIGHT_SEMANTIC) + (technical_score * settings.WEIGHT_TECHNICAL)

    if is_insufficient:
        result = "INSUFFICIENT INFORMATION"
        reason = "Insufficient critical technical attributes extracted (e.g. diameter, material grade, or standard) to safely assess equivalence."
        confidence = 0.5
    elif mismatch_detected:
        result = "DIFFERENT"
        reason = "Critical parameter mismatch: " + "; ".join(mismatch_reasons)
        confidence = min(0.3, final_score)
    else:
        if final_score >= settings.EXACT_DUPLICATE_THRESHOLD and sem_sim >= settings.EXACT_DUPLICATE_SEMANTIC_MIN:
            result = "EXACT DUPLICATE"
            reason = "Descriptions are semantically identical and all technical dimensions are aligned."
            confidence = final_score
        elif final_score >= settings.EQUIVALENT_THRESHOLD:
            result = "EQUIVALENT"
            reason = "Descriptions represent the same physical material. Key features (type, grade, size) match successfully."
            confidence = final_score
        elif final_score >= settings.NEAR_DUPLICATE_THRESHOLD:
            result = "NEAR DUPLICATE"
            reason = "Highly comparable item features, with slight variations in naming format or auxiliary parameters."
            confidence = final_score
        elif final_score >= settings.POSSIBLE_MATCH_THRESHOLD:
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
        "comparison": comp,
    }