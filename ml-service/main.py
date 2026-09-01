from fastapi import FastAPI, HTTPException
from schemas import (
    NormalizeRequest, NormalizeResponse,
    ExtractRequest, ExtractResponse,
    EmbedRequest, EmbedResponse,
    SimilarityRequest, SimilarityResponse,
    MatchRequest, MatchResponse
)
from normalization import normalize_description
from extraction import extract_attributes
from embeddings import generate_embedding, calculate_cosine_similarity
from matching import match_materials
from clustering import build_material_clusters
from typing import List, Dict, Any

app = FastAPI(
    title="National Unified Material Master ML Service",
    description="Python FastAPI NLP & Semantic Matching Pipeline for Material Master Standardization."
)

@app.post("/normalize", response_model=NormalizeResponse)
def normalize_endpoint(req: NormalizeRequest):
    return NormalizeResponse(
        normalized_description=normalize_description(req.description)
    )

@app.post("/extract", response_model=ExtractResponse)
def extract_endpoint(req: ExtractRequest):
    attrs = extract_attributes(req.description)
    return ExtractResponse(**attrs)

@app.post("/embed", response_model=EmbedResponse)
def embed_endpoint(req: EmbedRequest):
    try:
        emb = generate_embedding(req.text)
        return EmbedResponse(embedding=emb)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similarity", response_model=SimilarityResponse)
def similarity_endpoint(req: SimilarityRequest):
    sim = calculate_cosine_similarity(req.embedding_a, req.embedding_b)
    return SimilarityResponse(similarity=sim)

@app.post("/match", response_model=MatchResponse)
def match_endpoint(req: MatchRequest):
    mat_a = req.material_a.model_dump()
    mat_b = req.material_b.model_dump()
    res = match_materials(mat_a, mat_b)
    return MatchResponse(**res)

@app.post("/pipeline/run")
def pipeline_run_endpoint(materials: List[Dict[str, Any]]):
    """
    Batch processing coordinator:
    1. Standardizes descriptions and technical features across a list of raw records.
    2. Runs feature-embedding extraction.
    3. Finds candidate matches (semantic threshold: 0.70).
    4. Executes the rule-based verification check.
    5. Returns candidate lists for backend persistence.
    """
    processed_materials = []
    
    # 1. Pipeline prep - Normalize & Extract missing parameters
    for mat in materials:
        desc = mat.get("description", "")
        norm_desc = mat.get("normalized_description") or normalize_description(desc)
        
        extracted = extract_attributes(desc, norm_desc)
        mat_copy = mat.copy()
        mat_copy["normalized_description"] = norm_desc
        
        # Populate extracted values if raw fields are missing
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
            
        # Build embedding representations
        if not mat_copy.get("embedding"):
            mat_copy["embedding"] = generate_embedding(norm_desc)
            
        processed_materials.append(mat_copy)

    # 2. Pairwise Evaluation
    matches_detected = []
    n = len(processed_materials)
    
    for i in range(n):
        for j in range(i + 1, n):
            mat_a = processed_materials[i]
            mat_b = processed_materials[j]
            
            # Compute cosine similarity between vectors
            sim = calculate_cosine_similarity(mat_a["embedding"], mat_b["embedding"])
            
            # Candidate threshold check
            if sim >= 0.70:
                match_res = match_materials(mat_a, mat_b)
                matches_detected.append({
                    "material_a_id": mat_a.get("id"),
                    "material_b_id": mat_b.get("id"),
                    "semantic_score": match_res["semantic_similarity"],
                    "technical_score": match_res["technical_score"],
                    "final_score": match_res["confidence"],
                    "result": match_res["result"],
                    "reason": match_res["reason"],
                    "comparison": match_res["comparison"]
                })
                
    return {
        "processed_materials": processed_materials,
        "matches": matches_detected
    }

@app.post("/pipeline/cluster")
def pipeline_cluster_endpoint(req: Dict[str, Any]):
    """
    Cluster active materials using Approved mapping edges.
    """
    materials_list = req.get("materials", [])
    approved_matches = [tuple(m) for m in req.get("approved_matches", [])]
    clusters = build_material_clusters(materials_list, approved_matches)
    return {"clusters": clusters}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
