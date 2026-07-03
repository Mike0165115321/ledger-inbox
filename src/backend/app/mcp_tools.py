"""
Custom MCP Compound Tools for Ledger Inbox
Combine multiple data sources into rich AI-friendly responses.

These are OPTIONAL — fastapi-mcp auto-exposes all REST endpoints as tools.
These compound tools provide richer multi-step queries.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from .db.models import Transaction
from .services.tax_service import calculate_tax, quick_tax_estimate


def get_yearly_summary(db: Session, year: int | None = None) -> dict:
    """Rich yearly financial summary combining multiple queries."""
    if not year:
        year = datetime.utcnow().year

    txs = (
        db.query(Transaction)
        .filter(Transaction.transaction_datetime.like(f"{year}%"))
        .all()
    )

    income_txs = [t for t in txs if t.type == "income"]
    expense_txs = [t for t in txs if t.type == "expense"]

    total_income = sum(t.amount for t in income_txs)
    total_expense = sum(t.amount for t in expense_txs)

    # Category breakdown
    categories: dict[str, float] = {}
    for t in expense_txs:
        cat = t.category or "ไม่ระบุ"
        categories[cat] = categories.get(cat, 0) + t.amount

    top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]

    # Monthly trend
    monthly: dict[str, dict] = {}
    for t in txs:
        if t.transaction_datetime:
            key = t.transaction_datetime.strftime("%Y-%m")
            if key not in monthly:
                monthly[key] = {"month": key, "income": 0.0, "expense": 0.0}
            if t.type == "income":
                monthly[key]["income"] += t.amount
            elif t.type == "expense":
                monthly[key]["expense"] += t.amount

    # Tax estimate
    tax = quick_tax_estimate(total_income)

    return {
        "year": year,
        "income": total_income,
        "expense": total_expense,
        "profit": total_income - total_expense,
        "transaction_count": len(txs),
        "income_count": len(income_txs),
        "expense_count": len(expense_txs),
        "top_expense_categories": [
            {"name": name, "amount": amt} for name, amt in top_categories
        ],
        "monthly_breakdown": sorted(monthly.values(), key=lambda m: m["month"]),
        "tax_estimate": tax,
        "pending_review_count": len([t for t in txs if t.review_status == "pending"]),
    }


def get_project_report(db: Session, project_id: str) -> dict:
    """Full project financial report."""
    from .db.models import Project

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {"error": "Project not found"}

    txs = (
        db.query(Transaction)
        .filter(Transaction.project_id == project_id)
        .all()
    )

    income = sum(t.amount for t in txs if t.type == "income")
    expense = sum(t.amount for t in txs if t.type == "expense")

    # Sort by date
    txs_sorted = sorted(
        txs, key=lambda t: t.transaction_datetime or "", reverse=True
    )

    return {
        "project_id": project.id,
        "name": project.name,
        "client": project.client_name,
        "status": project.status,
        "income": income,
        "expense": expense,
        "profit": income - expense,
        "transaction_count": len(txs),
        "recent_transactions": [
            {
                "id": t.id,
                "type": t.type,
                "amount": t.amount,
                "note": t.note,
                "date": str(t.transaction_datetime)[:10] if t.transaction_datetime else None,
            }
            for t in txs_sorted[:10]
        ],
    }
