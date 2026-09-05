import pytest
from app.services.pipeline_service import run_pipeline, run_clustering


@pytest.mark.asyncio
async def test_pipeline_processes_materials():
    materials = [
        {"id": 1, "description": "SS Pipe 25mm"},
        {"id": 2, "description": "Stainless Steel Pipe 25 MM diameter"},
    ]

    result = await run_pipeline(materials)

    assert "processed_materials" in result
    assert len(result["processed_materials"]) == 2
    assert all("embedding" in m for m in result["processed_materials"])
    assert all("normalized_description" in m for m in result["processed_materials"])


@pytest.mark.asyncio
async def test_pipeline_finds_matches():
    materials = [
        {"id": 1, "description": "SS Pipe 25mm"},
        {"id": 2, "description": "Stainless Steel Pipe 25 MM diameter"},
    ]

    result = await run_pipeline(materials)

    assert "matches" in result
    assert len(result["matches"]) >= 1
    match = result["matches"][0]
    assert "material_a_id" in match
    assert "material_b_id" in match
    assert "semantic_score" in match
    assert "final_score" in match
    assert "result" in match


@pytest.mark.asyncio
async def test_pipeline_extracts_attributes():
    materials = [
        {"id": 1, "description": "SS304 Pipe 25mm 6m"},
    ]

    result = await run_pipeline(materials)

    processed = result["processed_materials"][0]
    assert processed["material_type"] == "pipe"
    assert processed["material_grade"] == "SS304"
    assert processed["dimension"] == "25"
    assert processed["length"] == "6"


def test_clustering_union_find():
    materials = [1, 2, 3, 4, 5]
    approved = [(1, 2), (2, 3), (4, 5)]

    clusters = run_clustering(materials, approved)

    assert len(clusters) == 2
    cluster_sizes = sorted([len(c) for c in clusters])
    assert cluster_sizes == [2, 3]


def test_clustering_singletons():
    materials = [1, 2, 3]
    approved = []

    clusters = run_clustering(materials, approved)

    assert len(clusters) == 3
    assert all(len(c) == 1 for c in clusters)


def test_clustering_transitive():
    materials = [1, 2, 3]
    approved = [(1, 2), (2, 3)]

    clusters = run_clustering(materials, approved)

    assert len(clusters) == 1
    assert set(clusters[0]) == {1, 2, 3}


@pytest.mark.asyncio
async def test_pipeline_respects_candidate_threshold():
    materials = [
        {"id": 1, "description": "SS Pipe 25mm"},
        {"id": 2, "description": "Mild Steel Bolt M16 x 50"},
    ]

    result = await run_pipeline(materials)

    assert len(result["matches"]) == 0