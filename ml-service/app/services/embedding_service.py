import hashlib
import numpy as np
from typing import List, Optional
import httpx

from app.config import settings
from app.core.exceptions import EmbeddingServiceError
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._fallback_dim = settings.FALLBACK_EMBEDDING_DIM

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=settings.LLAMA_TIMEOUT_SECONDS)
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def _get_fallback_embedding(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self._fallback_dim

        vector = np.zeros(self._fallback_dim, dtype=float)
        words = text.lower().split()

        for word in words:
            h1 = int(hashlib.md5(word.encode()).hexdigest(), 16) % self._fallback_dim
            h2 = int(hashlib.md5((word + "_salt").encode()).hexdigest(), 16) % self._fallback_dim
            vector[h1] += 1.0
            vector[h2] += 0.5

        chars = text.lower()
        for i in range(len(chars) - 1):
            bigram = chars[i:i+2]
            h = int(hashlib.md5(bigram.encode()).hexdigest(), 16) % self._fallback_dim
            vector[h] += 0.2

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector.tolist()

    async def _try_qwen_embedding(self, text: str) -> Optional[List[float]]:
        client = await self._get_client()
        url = f"{settings.LLAMA_SERVER_URL}{settings.LLAMA_EMBEDDING_ENDPOINT}"
        try:
            resp = await client.post(
                url,
                json={"model": settings.LLAMA_MODEL_NAME, "input": [text]},
            )
            resp.raise_for_status()
            data = resp.json()
            if "data" in data and len(data["data"]) > 0:
                emb = data["data"][0].get("embedding")
                if emb:
                    return [float(x) for x in emb]
        except httpx.HTTPError as e:
            logger.warning(f"Qwen embedding request failed: {e}")
        except Exception as e:
            logger.warning(f"Qwen embedding unexpected error: {e}")
        return None

    async def generate_embedding(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self._fallback_dim

        emb = await self._try_qwen_embedding(text)
        if emb is not None:
            return emb

        logger.debug("Falling back to feature-hash embedding")
        return self._get_fallback_embedding(text)

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        non_empty = [(i, t) for i, t in enumerate(texts) if t and t.strip()]
        if not non_empty:
            return [[0.0] * self._fallback_dim] * len(texts)

        client = await self._get_client()
        url = f"{settings.LLAMA_SERVER_URL}{settings.LLAMA_EMBEDDING_ENDPOINT}"
        batch_size = settings.LLAMA_MAX_BATCH_SIZE
        results: List[Optional[List[float]]] = [None] * len(texts)

        for i in range(0, len(non_empty), batch_size):
            batch = non_empty[i:i + batch_size]
            indices = [idx for idx, _ in batch]
            batch_texts = [t for _, t in batch]
            try:
                resp = await client.post(
                    url,
                    json={"model": settings.LLAMA_MODEL_NAME, "input": batch_texts},
                )
                resp.raise_for_status()
                data = resp.json()
                if "data" in data:
                    data["data"].sort(key=lambda x: x["index"])
                    for j, item in enumerate(data["data"]):
                        emb = item.get("embedding")
                        if emb:
                            results[indices[j]] = [float(x) for x in emb]
            except Exception as e:
                logger.warning(f"Qwen batch embedding failed: {e}")

        for i, emb in enumerate(results):
            if emb is None:
                original_text = texts[i]
                results[i] = self._get_fallback_embedding(original_text)

        return results

    def calculate_cosine_similarity(self, emb_a: List[float], emb_b: List[float]) -> float:
        vec_a = np.array(emb_a, dtype=float)
        vec_b = np.array(emb_b, dtype=float)

        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        similarity = float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
        return max(0.0, min(1.0, similarity))

    async def health_check(self) -> dict:
        qwen_healthy = False
        try:
            client = await self._get_client()
            url = f"{settings.LLAMA_SERVER_URL}/health"
            resp = await client.get(url, timeout=5.0)
            qwen_healthy = resp.status_code == 200
        except Exception:
            qwen_healthy = False

        return {
            "qwen_available": qwen_healthy,
            "fallback_available": True,
            "embedding_dimension": self._fallback_dim,
        }


embedding_service = EmbeddingService()