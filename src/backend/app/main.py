from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import CORS_ORIGINS
from .db.database import engine, Base
from .db.models import seed_default_categories
from .db.migrations import run_light_migrations
from .api import (
    documents,
    transactions,
    projects,
    dashboard,
    categories,
    health,
    accounts,
    parties,
    owner_profile,
    statements,
)
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

# Create tables + apply additive column migrations
Base.metadata.create_all(bind=engine)
run_light_migrations(engine)

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
app.include_router(accounts.router)
app.include_router(parties.router)
app.include_router(owner_profile.router)
app.include_router(statements.router)

# ── MCP Integration ──────────────────────────────────────────────
# Phase 1 policy (docs/ACCOUNTING_WORKSPACE_VISION.md #7): MCP is read-only until
# Phase 2 (draft-only) / Phase 4 (write, with approval). Whitelist by operation_id
# rather than blacklist so new POST/PUT/DELETE routes are excluded by default.
MCP_READ_ONLY_OPERATIONS = [
    "list_accounts", "get_account",
    "list_categories",
    "dashboard_summary", "tax_summary", "tax_calculation", "dashboard_timeline",
    "get_yearly_summary", "get_project_report",
    "list_documents",
    "model_health", "queue_health",
    "get_owner_profile",
    "list_parties", "get_party",
    "list_projects", "get_project",
    "list_transactions", "get_transaction",
]

try:
    from fastapi_mcp import FastApiMCP

    mcp = FastApiMCP(
        app,
        name="Ledger Inbox MCP",
        description="Evidence-first Accounting — read-only query tools for transactions, projects, parties, accounts, and tax calculations. Thai personal finance for freelancers.",
        include_operations=MCP_READ_ONLY_OPERATIONS,
    )
    mcp.mount()  # → http://localhost:8000/mcp
except ImportError:
    print("[MCP] fastapi-mcp not installed — MCP server disabled. pip install fastapi-mcp")



@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
