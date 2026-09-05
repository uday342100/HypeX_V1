from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.core.logging import setup_logging, get_logger
from app.services.embedding_service import embedding_service
from app.api.routes import health, embeddings, matching, pipeline

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    await embedding_service.close()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    description="Python FastAPI NLP & Semantic Matching Pipeline for Material Master Standardization.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(embeddings.router)
app.include_router(matching.router)
app.include_router(pipeline.router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)