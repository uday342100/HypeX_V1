from pydantic import BaseModel
from typing import Optional, Dict, List

class NormalizeRequest(BaseModel):
    description: str

class NormalizeResponse(BaseModel):
    normalized_description: str

class ExtractRequest(BaseModel):
    description: str

class ExtractResponse(BaseModel):
    product_type: Optional[str] = None
    material: Optional[str] = None
    material_grade: Optional[str] = None
    dimension: Optional[str] = None
    dimension_unit: Optional[str] = None
    length: Optional[str] = None
    length_unit: Optional[str] = None
    pressure: Optional[str] = None
    pressure_unit: Optional[str] = None
    standard_reference: Optional[str] = None

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]

class SimilarityRequest(BaseModel):
    embedding_a: List[float]
    embedding_b: List[float]

class SimilarityResponse(BaseModel):
    similarity: float

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

class MatchRequest(BaseModel):
    material_a: MaterialModel
    material_b: MaterialModel

class MatchResponse(BaseModel):
    result: str # EXACT DUPLICATE, EQUIVALENT, NEAR DUPLICATE, POSSIBLE MATCH, DIFFERENT, INSUFFICIENT INFORMATION
    confidence: float
    semantic_similarity: float
    technical_score: float
    reason: str
    comparison: Dict[str, str]
