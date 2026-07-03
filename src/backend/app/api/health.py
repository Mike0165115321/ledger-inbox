"""
GET /api/health        — basic health check
GET /api/health/model  — Gemini API status
"""

from fastapi import APIRouter

from ..services.gemini_service import gemini

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/model")
async def model_health():
    """Check if Gemini API is configured."""
    return {
        "gemini_configured": gemini.is_configured(),
        "service": "Gemini 2.0 Flash (Google)",
        "note": "Set GEMINI_API_KEY environment variable to enable.",
    }
