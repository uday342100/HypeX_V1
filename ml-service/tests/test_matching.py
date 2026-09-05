import pytest
import numpy as np
from app.services.matching_service import match_materials
from app.services.normalization_service import normalize_description
from app.services.extraction_service import extract_attributes
from app.services.embedding_service import embedding_service


def make_material(desc: str, **overrides):
    base = {
        "id": 1,
        "cpse_name": "CPSE A",
        "original_code": "A101",
        "description": desc,
        "normalized_description": normalize_description(desc),
        "embedding": None,
    }
    base.update(overrides)
    return base


def make_material_with_embedding(desc: str, embedding: list, **overrides):
    base = make_material(desc, **overrides)
    base["embedding"] = embedding
    return base


@pytest.fixture
def similar_embeddings():
    """Generate deterministic similar embeddings for testing."""
    base = np.ones(384) / np.sqrt(384)
    emb1 = base.copy()
    emb2 = base * 0.98 + np.random.RandomState(42).normal(0, 0.01, 384)
    emb2 = emb2 / np.linalg.norm(emb2)
    return emb1.tolist(), emb2.tolist()


@pytest.fixture
def dissimilar_embeddings():
    """Generate deterministic dissimilar embeddings for testing."""
    rng = np.random.RandomState(123)
    emb1 = rng.normal(0, 1, 384)
    emb1 = emb1 / np.linalg.norm(emb1)
    emb2 = rng.normal(0, 1, 384)
    emb2 = emb2 / np.linalg.norm(emb2)
    return emb1.tolist(), emb2.tolist()


@pytest.mark.asyncio
async def test_same_material_high_confidence(similar_embeddings):
    emb1, emb2 = similar_embeddings
    mat_a = make_material_with_embedding("SS Pipe 25mm", emb1)
    mat_b = make_material_with_embedding("Stainless Steel Pipe 25 MM diameter", emb2)

    result = await match_materials(mat_a, mat_b)

    assert result["result"] in ["EXACT DUPLICATE", "EQUIVALENT", "NEAR DUPLICATE"]
    assert result["confidence"] > 0.85
    assert result["comparison"]["product_type"] == "MATCH"
    assert result["comparison"]["material"] == "MATCH"
    assert result["comparison"]["dimension"] == "MATCH"


@pytest.mark.asyncio
async def test_same_material_mild_steel_bolt(similar_embeddings):
    emb1, emb2 = similar_embeddings
    # Use descriptions with proper dimension extraction - both should extract 16mm as dimension
    mat_a = make_material_with_embedding("MS Bolt 16mm x 50mm", emb1)
    mat_b = make_material_with_embedding("Mild Steel Hex Bolt 16mm x 50mm", emb2)

    result = await match_materials(mat_a, mat_b)

    assert result["result"] in ["EXACT DUPLICATE", "EQUIVALENT", "NEAR DUPLICATE"]
    assert result["confidence"] > 0.85


@pytest.mark.asyncio
async def test_different_pressure_class_should_not_match(similar_embeddings):
    emb1, emb2 = similar_embeddings
    mat_a = make_material_with_embedding("SS Valve 50mm Class 150", emb1)
    mat_b = make_material_with_embedding("SS Valve 50mm Class 300", emb2)

    result = await match_materials(mat_a, mat_b)

    assert result["result"] == "DIFFERENT"
    assert result["comparison"]["pressure"] == "MISMATCH"


@pytest.mark.asyncio
async def test_identical_descriptions_match_even_without_details():
    """Two identical descriptions should match even without technical attributes."""
    # Use pre-computed identical embeddings to ensure perfect similarity
    emb = [0.1] * 384
    norm = np.linalg.norm(emb)
    emb = (np.array(emb) / norm).tolist()
    
    mat_a = make_material_with_embedding("Industrial Pipe", emb)
    mat_b = make_material_with_embedding("Industrial Pipe", emb)

    result = await match_materials(mat_a, mat_b)

    assert result["result"] in ["EXACT DUPLICATE", "EQUIVALENT", "NEAR DUPLICATE", "POSSIBLE MATCH"]
    # Without technical details, confidence is limited by technical score (0.5)
    # final = 1.0 * 0.4 + 0.5 * 0.6 = 0.7
    assert result["confidence"] > 0.65


@pytest.mark.asyncio
async def test_different_descriptions_missing_details_insufficient():
    """Different descriptions with no technical details should be INSUFFICIENT."""
    mat_a = make_material("Industrial Pipe")
    mat_b = make_material("Generic Pipe")

    result = await match_materials(mat_a, mat_b)

    assert result["result"] == "INSUFFICIENT INFORMATION"
    assert result["confidence"] == 0.5


@pytest.mark.asyncio
async def test_abbreviation_variations_normalized(similar_embeddings):
    emb1, emb2 = similar_embeddings
    mat_a = make_material_with_embedding("SS Pipe 25mm", emb1)
    mat_b = make_material_with_embedding("S.S. Pipe 25 MM", emb2)

    result = await match_materials(mat_a, mat_b)

    assert result["result"] in ["EXACT DUPLICATE", "EQUIVALENT", "NEAR DUPLICATE"]


@pytest.mark.asyncio
async def test_unit_variations_mm(similar_embeddings):
    emb1, emb2 = similar_embeddings
    mat_a = make_material_with_embedding("Pipe 25MM", emb1)
    mat_b = make_material_with_embedding("Pipe 25 MM", emb2)
    mat_c = make_material_with_embedding("Pipe 25 millimeter", emb2)

    result_ab = await match_materials(mat_a, mat_b)
    result_ac = await match_materials(mat_a, mat_c)

    assert result_ab["result"] in ["EXACT DUPLICATE", "EQUIVALENT", "NEAR DUPLICATE"]
    assert result_ac["result"] in ["EXACT DUPLICATE", "EQUIVALENT", "NEAR DUPLICATE"]


@pytest.mark.asyncio
async def test_reordered_descriptions(similar_embeddings):
    emb1, emb2 = similar_embeddings
    mat_a = make_material_with_embedding("25mm SS Pipe", emb1)
    mat_b = make_material_with_embedding("SS Pipe 25mm", emb2)

    result = await match_materials(mat_a, mat_b)

    assert result["result"] in ["EXACT DUPLICATE", "EQUIVALENT", "NEAR DUPLICATE"]


@pytest.mark.asyncio
async def test_unrelated_materials_different(dissimilar_embeddings):
    emb1, emb2 = dissimilar_embeddings
    # Both have dimensions so we can properly detect mismatch
    mat_a = make_material_with_embedding("SS Pipe 25mm", emb1)
    mat_b = make_material_with_embedding("Mild Steel Bolt 16mm", emb2)

    result = await match_materials(mat_a, mat_b)

    assert result["result"] == "DIFFERENT"
    assert result["confidence"] < 0.65


@pytest.mark.asyncio
async def test_different_grade_should_not_match(similar_embeddings):
    emb1, emb2 = similar_embeddings
    mat_a = make_material_with_embedding("SS304 Pipe 25mm", emb1)
    mat_b = make_material_with_embedding("SS316 Pipe 25mm", emb2)

    result = await match_materials(mat_a, mat_b)

    assert result["result"] == "DIFFERENT"
    assert result["comparison"]["grade"] == "MISMATCH"


@pytest.mark.asyncio
async def test_batch_consistency(similar_embeddings):
    emb1, emb2 = similar_embeddings
    mat_a = make_material_with_embedding("SS Pipe 25mm", emb1)
    mat_b = make_material_with_embedding("Stainless Steel Pipe 25 MM", emb2)

    results = []
    for _ in range(3):
        result = await match_materials(mat_a, mat_b)
        results.append(result["result"])

    assert len(set(results)) == 1