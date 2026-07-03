from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import CORS_ORIGINS
from .db.database import engine, Base
from .db.models import seed_default_categories
from .api import documents, transactions, projects, dashboard, categories, health
from .services.upload_queue import upload_queue


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start/stop background services."""
    # Startup
    seed_default_categories()
    await upload_queue.start()
    yield
    # Shutdown
    await upload_queue.stop()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ledger Inbox API",
    description="Evidence-first Accounting — ทุกตัวเลขต้องผูกกับหลักฐาน",
    version="0.1.0",
    lifespan=lifespan,
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
app.include_router(health.router)
app.include_router(dashboard.export_router)



@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
