from fastapi import APIRouter, Depends
from app.services.embedding_service import EmbeddingService
from app.api.dependencies import get_embedding_service

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(embedding_service: EmbeddingService = Depends(get_embedding_service)):
    emb_health = await embedding_service.health_check()
    return {
        "status": "healthy",
        "embedding_service": emb_health,
    }