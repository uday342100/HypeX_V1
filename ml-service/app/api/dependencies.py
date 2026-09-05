from fastapi import Depends
from app.services.embedding_service import EmbeddingService, embedding_service
from app.services.pipeline_service import run_pipeline, run_clustering


async def get_embedding_service() -> EmbeddingService:
    return embedding_service