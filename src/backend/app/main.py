from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import CORS_ORIGINS
from .db.database import engine, Base
from .db.models import seed_default_categories
from .api import documents, transactions, projects, dashboard, categories

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ledger Inbox API",
    description="Evidence-first Accounting — ทุกตัวเลขต้องผูกกับหลักฐาน",
    version="0.1.0",
)

# CORS — allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(documents.router)
app.include_router(transactions.router)
app.include_router(projects.router)
app.include_router(dashboard.router)
app.include_router(categories.router)


@app.on_event("startup")
async def startup():
    """Seed default categories on first run."""
    seed_default_categories()


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
