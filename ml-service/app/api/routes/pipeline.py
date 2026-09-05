from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.pipeline_service import run_pipeline, run_clustering

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/run")
async def pipeline_run_endpoint(materials: List[Dict[str, Any]]):
    try:
        result = await run_pipeline(materials)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cluster")
async def pipeline_cluster_endpoint(req: Dict[str, Any]):
    try:
        materials_list = req.get("materials", [])
        approved_matches = [tuple(m) for m in req.get("approved_matches", [])]
        clusters = run_clustering(materials_list, approved_matches)
        return {"clusters": clusters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))