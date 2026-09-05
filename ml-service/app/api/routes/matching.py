from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from app.services.matching_service import match_materials

router = APIRouter(prefix="/materials", tags=["matching"])


class MaterialModel(BaseModel):
    id: Optional[int] = None
    cpse_name: str
    original_code: str
    description: str
    specifications: Optional[str] = None
    technical_parameters: Optional[str] = None
    material_type: Optional[str] = None
    material_grade: Optional[str] = None
    dimension: Optional[str] = None
    dimension_unit: Optional[str] = None
    length: Optional[str] = None
    length_unit: Optional[str] = None
    pressure: Optional[str] = None
    pressure_unit: Optional[str] = None
    standard_reference: Optional[str] = None
    unit_of_measurement: Optional[str] = None
    classification: Optional[str] = None
    normalized_description: Optional[str] = None
    embedding: Optional[List[float]] = None


class MatchRequest(BaseModel):
    material_a: MaterialModel
    material_b: MaterialModel


class ComparisonItem(BaseModel):
    product_type: str
    material: str
    grade: str
    dimension: str
    dimension_unit: str
    length: str
    standard: str
    pressure: str


class MatchResponse(BaseModel):
    result: str
    confidence: float
    semantic_similarity: float
    technical_score: float
    reason: str
    comparison: Dict[str, str]


@router.post("/match", response_model=MatchResponse)
async def match_endpoint(req: MatchRequest):
    try:
        mat_a = req.material_a.model_dump()
        mat_b = req.material_b.model_dump()
        res = await match_materials(mat_a, mat_b)
        return MatchResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))