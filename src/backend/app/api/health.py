"""
GET /api/health        — basic health check
GET /api/health/model  — EasySlip API status
"""

from fastapi import APIRouter

from ..services.easy_slip_service import easy_slip

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/model")
async def model_health():
    """Check if EasySlip API is configured."""
    return {
        "easyslip_configured": easy_slip.is_configured(),
        "service": "EasySlip API (Thai slip OCR)",
        "note": "Set EASYSLIP_API_KEY environment variable to enable.",
    }
