from typing import List, Dict, Any, Tuple
from app.config import settings
from app.services.normalization_service import normalize_description
from app.services.extraction_service import extract_attributes
from app.services.embedding_service import embedding_service
from app.services.matching_service import match_materials
from app.services.clustering_service import build_material_clusters


async def run_pipeline(materials: List[Dict[str, Any]]) -> Dict[str, Any]:
    processed_materials = []

    for mat in materials:
        desc = mat.get("description", "")
        norm_desc = mat.get("normalized_description") or normalize_description(desc)

        extracted = extract_attributes(desc, norm_desc)
        mat_copy = mat.copy()
        mat_copy["normalized_description"] = norm_desc

        if not mat_copy.get("material_type"):
            mat_copy["material_type"] = extracted["product_type"]
        if not mat_copy.get("material_grade"):
            mat_copy["material_grade"] = extracted["material_grade"]
        if not mat_copy.get("dimension"):
            mat_copy["dimension"] = extracted["dimension"]
        if not mat_copy.get("dimension_unit"):
            mat_copy["dimension_unit"] = extracted["dimension_unit"]
        if not mat_copy.get("length"):
            mat_copy["length"] = extracted["length"]
        if not mat_copy.get("length_unit"):
            mat_copy["length_unit"] = extracted["length_unit"]
        if not mat_copy.get("pressure"):
            mat_copy["pressure"] = extracted["pressure"]
        if not mat_copy.get("pressure_unit"):
            mat_copy["pressure_unit"] = extracted["pressure_unit"]
        if not mat_copy.get("standard_reference"):
            mat_copy["standard_reference"] = extracted["standard_reference"]

        if not mat_copy.get("embedding"):
            mat_copy["embedding"] = await embedding_service.generate_embedding(norm_desc)

        processed_materials.append(mat_copy)

    matches_detected = []
    n = len(processed_materials)
    max_comparisons = settings.MAX_PAIRWISE_COMPARISONS
    comparison_count = 0

    for i in range(n):
        for j in range(i + 1, n):
            if comparison_count >= max_comparisons:
                break

            mat_a = processed_materials[i]
            mat_b = processed_materials[j]

            sim = embedding_service.calculate_cosine_similarity(mat_a["embedding"], mat_b["embedding"])

            if sim >= settings.CANDIDATE_SIMILARITY_THRESHOLD:
                match_res = await match_materials(mat_a, mat_b)
                matches_detected.append({
                    "material_a_id": mat_a.get("id"),
                    "material_b_id": mat_b.get("id"),
                    "semantic_score": match_res["semantic_similarity"],
                    "technical_score": match_res["technical_score"],
                    "final_score": match_res["confidence"],
                    "result": match_res["result"],
                    "reason": match_res["reason"],
                    "comparison": match_res["comparison"],
                })
            comparison_count += 1

    return {
        "processed_materials": processed_materials,
        "matches": matches_detected,
    }


def run_clustering(materials: List[int], approved_matches: List[Tuple[int, int]]) -> List[List[int]]:
    return build_material_clusters(materials, approved_matches)