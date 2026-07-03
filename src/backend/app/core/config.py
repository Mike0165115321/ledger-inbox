import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ledger.db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
