import os
from pathlib import Path

# Load .env file from backend root
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(env_path, override=True)
except ImportError:
    pass

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ledger.db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Rate limits — อัปเดตใน .env ถ้า Google เปลี่ยน limit
# ค่า default = gemini-3.1-flash-lite free tier (Jul 2026)
GEMINI_RPM_LIMIT = int(os.getenv("GEMINI_RPM_LIMIT", "15"))
GEMINI_TPM_LIMIT = int(os.getenv("GEMINI_TPM_LIMIT", "250000"))
GEMINI_RPD_LIMIT = int(os.getenv("GEMINI_RPD_LIMIT", "500"))

