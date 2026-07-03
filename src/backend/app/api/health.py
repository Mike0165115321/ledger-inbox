"""
GET /api/health/model — check Ollama + model status
"""

from fastapi import APIRouter

from ..services.ollama_service import ollama, DEFAULT_MODEL, FALLBACK_MODEL

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/model")
async def model_health():
    """Check if Ollama is running and models are available."""
    ollama_running = ollama.is_running()
    primary_available = ollama.is_model_available(DEFAULT_MODEL) if ollama_running else False
    fallback_available = ollama.is_model_available(FALLBACK_MODEL) if ollama_running else False

    return {
        "ollama_running": ollama_running,
        "primary_model": DEFAULT_MODEL,
        "primary_available": primary_available,
        "fallback_model": FALLBACK_MODEL,
        "fallback_available": fallback_available,
        "ready": primary_available or fallback_available,
    }
