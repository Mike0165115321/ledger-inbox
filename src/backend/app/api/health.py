"""
GET /api/health        — basic health check
GET /api/health/model  — Gemini API status + limits (from .env)
GET /api/health/queue  — Upload queue status: RPM / TPM / RPD real-time
"""

from fastapi import APIRouter

from ..services.gemini_service import gemini
from ..services.upload_queue import upload_queue
from ..core.config import GEMINI_MODEL, GEMINI_RPM_LIMIT, GEMINI_TPM_LIMIT, GEMINI_RPD_LIMIT

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/model", operation_id="model_health")
async def model_health():
    """สถานะ Gemini API + limits จาก .env"""
    return {
        "gemini_configured": gemini.is_configured(),
        "service": "Google Gemini API",
        "model": GEMINI_MODEL,
        "limits": {
            "rpm": GEMINI_RPM_LIMIT,
            "tpm": GEMINI_TPM_LIMIT,
            "rpd": GEMINI_RPD_LIMIT,
        },
        "note": "อัปเดต GEMINI_RPM_LIMIT / GEMINI_TPM_LIMIT / GEMINI_RPD_LIMIT ใน .env ถ้า Google เปลี่ยน limit",
    }


@router.get("/queue", operation_id="queue_health")
async def queue_health():
    """
    สถานะ Upload Queue แบบ real-time
    - rpm_used: นับ request จริงใน 60 วินาทีที่ผ่านมา
    - tpm_used: นับ token จริงจาก usageMetadata ของ Gemini ใน 60 วินาที
    - requests_today: นับสะสมตั้งแต่ต้นวัน (persist ข้าม restart)
    - limits: อ่านจาก .env — อัปเดตได้ถ้า Google เปลี่ยน
    """
    s = upload_queue.get_status()
    return {
        # Queue state
        "queue_size": s.queue_size,
        "is_processing": s.is_processing,
        "rate_limited": s.rate_limited,
        "rate_limit_reset_at": s.rate_limit_reset_at.isoformat() if s.rate_limit_reset_at else None,
        # Usage (ของจริง)
        "rpm_used": s.rpm_used,
        "tpm_used": s.tpm_used,
        "requests_today": s.requests_today,
        # Limits (จาก .env)
        "rpm_limit": s.rpm_limit,
        "tpm_limit": s.tpm_limit,
        "rpd_limit": s.rpd_limit,
        # Misc
        "last_processed_at": s.last_processed_at.isoformat() if s.last_processed_at else None,
        "last_error": s.last_error,
    }
