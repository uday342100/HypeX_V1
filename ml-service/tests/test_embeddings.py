import pytest
import numpy as np
from app.services.embedding_service import EmbeddingService


class TestEmbeddingService:
    @pytest.fixture
    def service(self):
        return EmbeddingService()

    def test_fallback_embedding_dimension(self, service):
        emb = service._get_fallback_embedding("test text")
        assert len(emb) == 384
        assert all(isinstance(x, float) for x in emb)

    def test_fallback_embedding_normalized(self, service):
        emb = service._get_fallback_embedding("test text")
        norm = np.linalg.norm(emb)
        assert abs(norm - 1.0) < 1e-6

    def test_fallback_empty_string(self, service):
        emb = service._get_fallback_embedding("")
        assert all(x == 0.0 for x in emb)

    def test_cosine_similarity_identical(self, service):
        emb = [1.0, 0.0, 0.0] + [0.0] * 381
        sim = service.calculate_cosine_similarity(emb, emb)
        assert sim == 1.0

    def test_cosine_similarity_orthogonal(self, service):
        emb_a = [1.0, 0.0, 0.0] + [0.0] * 381
        emb_b = [0.0, 1.0, 0.0] + [0.0] * 381
        sim = service.calculate_cosine_similarity(emb_a, emb_b)
        assert sim == 0.0

    def test_cosine_similarity_zero_vector(self, service):
        emb_a = [0.0] * 384
        emb_b = [1.0, 0.0, 0.0] + [0.0] * 381
        sim = service.calculate_cosine_similarity(emb_a, emb_b)
        assert sim == 0.0

    def test_cosine_similarity_clipped(self, service):
        emb_a = [1.0, 0.0] + [0.0] * 382
        emb_b = [0.9, 0.1] + [0.0] * 382
        sim = service.calculate_cosine_similarity(emb_a, emb_b)
        assert 0.0 <= sim <= 1.0

    def test_fallback_deterministic(self, service):
        emb1 = service._get_fallback_embedding("same text")
        emb2 = service._get_fallback_embedding("same text")
        assert emb1 == emb2

    def test_fallback_different_texts_different_embeddings(self, service):
        emb1 = service._get_fallback_embedding("text one")
        emb2 = service._get_fallback_embedding("text two")
        assert emb1 != emb2