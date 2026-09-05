from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Service
    APP_NAME: str = "National Unified Material Master ML Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Qwen Embedding Service (llama.cpp)
    LLAMA_SERVER_URL: str = "http://127.0.0.1:8080"
    LLAMA_EMBEDDING_ENDPOINT: str = "/v1/embeddings"
    LLAMA_MODEL_NAME: str = "Qwen3-Embedding-4B"
    LLAMA_TIMEOUT_SECONDS: int = 120
    LLAMA_MAX_BATCH_SIZE: int = 32

    # Embedding Fallback (feature-hash)
    FALLBACK_EMBEDDING_DIM: int = 384

    # Matching Thresholds
    CANDIDATE_SIMILARITY_THRESHOLD: float = 0.70
    EXACT_DUPLICATE_THRESHOLD: float = 0.96
    EXACT_DUPLICATE_SEMANTIC_MIN: float = 0.90
    EQUIVALENT_THRESHOLD: float = 0.85
    NEAR_DUPLICATE_THRESHOLD: float = 0.75
    POSSIBLE_MATCH_THRESHOLD: float = 0.65

    # Scoring Weights (must sum to 1.0 for technical components)
    WEIGHT_SEMANTIC: float = 0.40
    WEIGHT_TECHNICAL: float = 0.60
    WEIGHT_PRODUCT_TYPE: float = 0.15
    WEIGHT_MATERIAL: float = 0.10
    WEIGHT_GRADE: float = 0.10
    WEIGHT_DIMENSION: float = 0.10
    WEIGHT_DIMENSION_UNIT: float = 0.05
    WEIGHT_LENGTH: float = 0.05
    WEIGHT_STANDARD: float = 0.05
    WEIGHT_PRESSURE: float = 0.10

    # Pipeline
    PIPELINE_BATCH_SIZE: int = 100
    MAX_PAIRWISE_COMPARISONS: int = 10000

    # Clustering
    CLUSTER_MIN_SIZE: int = 1

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()


def get_llama_embedding_url() -> str:
    return f"{settings.LLAMA_SERVER_URL}{settings.LLAMA_EMBEDDING_ENDPOINT}"