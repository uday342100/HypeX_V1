from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.embedding_service import EmbeddingService
from app.api.dependencies import get_embedding_service

router = APIRouter(prefix="/embeddings", tags=["embeddings"])


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: List[float]


class BatchEmbedRequest(BaseModel):
    texts: List[str]


class BatchEmbedResponse(BaseModel):
    embeddings: List[List[float]]


class SimilarityRequest(BaseModel):
    embedding_a: List[float]
    embedding_b: List[float]


class SimilarityResponse(BaseModel):
    similarity: float


@router.post("", response_model=EmbedResponse)
async def create_embedding(
    req: EmbedRequest,
    embedding_service: EmbeddingService = Depends(get_embedding_service),
):
    try:
        emb = await embedding_service.generate_embedding(req.text)
        return EmbedResponse(embedding=emb)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=BatchEmbedResponse)
async def create_embeddings_batch(
    req: BatchEmbedRequest,
    embedding_service: EmbeddingService = Depends(get_embedding_service),
):
    try:
        embs = await embedding_service.generate_embeddings(req.texts)
        return BatchEmbedResponse(embeddings=embs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similarity", response_model=SimilarityResponse)
async def calculate_similarity(
    req: SimilarityRequest,
    embedding_service: EmbeddingService = Depends(get_embedding_service),
):
    try:
        sim = embedding_service.calculate_cosine_similarity(req.embedding_a, req.embedding_b)
        return SimilarityResponse(similarity=sim)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))