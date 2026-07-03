"""
GET /api/dashboard/summary        — สรุปรายรับ/รายจ่าย/กำไร
GET /api/dashboard/tax-summary    — Tax year summary
GET /api/export/transactions      — Export CSV / Excel
GET /api/export/tax-summary       — Export tax summary Excel
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Transaction
from ..services.export_service import export_csv, export_excel, export_tax_summary_excel

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(
    year: Optional[int] = Query(None, description="ปี ค.ศ. เช่น 2026"),
    db: Session = Depends(get_db),
):
    """
    Dashboard summary:
    - total_income / total_expense / profit
    - monthly breakdown
    - top projects
    """
    query = db.query(Transaction)

    # Filter by year if provided
    if year:
        query = query.filter(
            Transaction.transaction_datetime.like(f"{year}%")
        )

    transactions = query.all()

    income_txs = [tx for tx in transactions if tx.type == "income"]
    expense_txs = [tx for tx in transactions if tx.type == "expense"]

    total_income = sum(tx.amount for tx in income_txs)
    total_expense = sum(tx.amount for tx in expense_txs)
    profit = total_income - total_expense

    # Monthly breakdown
    monthly = {}
    for tx in transactions:
        if tx.transaction_datetime:
            month_key = tx.transaction_datetime.strftime("%Y-%m")
            if month_key not in monthly:
                monthly[month_key] = {"month": month_key, "income": 0, "expense": 0}
            if tx.type == "income":
                monthly[month_key]["income"] += tx.amount
            elif tx.type == "expense":
                monthly[month_key]["expense"] += tx.amount

    # Top projects by revenue
    project_stats = {}
    for tx in transactions:
        if tx.project_id:
            p_id = tx.project_id
            if p_id not in project_stats:
                project_stats[p_id] = {"project_id": p_id, "income": 0, "expense": 0}
            if tx.type == "income":
                project_stats[p_id]["income"] += tx.amount
            elif tx.type == "expense":
                project_stats[p_id]["expense"] += tx.amount

    top_projects = sorted(
        project_stats.values(),
        key=lambda p: p["income"],
        reverse=True,
    )[:5]

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "profit": profit,
        "transaction_count": len(transactions),
        "monthly_breakdown": sorted(monthly.values(), key=lambda m: m["month"]),
        "top_projects": top_projects,
    }


@router.get("/tax-summary")
async def tax_summary(
    year: Optional[int] = Query(None, description="ปี ค.ศ. เช่น 2026"),
    db: Session = Depends(get_db),
):
    """Tax year summary — รายได้รวม, รายจ่ายรวม, กำไร, แยกตามหมวด"""
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

    # Category breakdown for expenses
    cat_map: dict[str, float] = {}
    for t in expense_txs:
        cat = t.category or "ไม่ระบุ"
        cat_map[cat] = cat_map.get(cat, 0) + t.amount

    categories = [
        {"name": k, "amount": v}
        for k, v in sorted(cat_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # Monthly breakdown
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

    return {
        "year": year,
        "total_income": total_income,
        "total_expense": total_expense,
        "estimated_profit": total_income - total_expense,
        "transaction_count": len(txs),
        "income_count": len(income_txs),
        "expense_count": len(expense_txs),
        "expense_categories": categories,
        "monthly_breakdown": sorted(monthly.values(), key=lambda m: m["month"]),
        "tax_bracket_note": "ประมาณการ — ปรึกษาผู้ตรวจสอบบัญชีก่อนยื่นภาษี",
    }


# ── Export endpoints ──

export_router = APIRouter(prefix="/api/export", tags=["export"])


@export_router.get("/transactions")
async def export_transactions(
    format: str = Query("csv", description="csv | xlsx"),
    project_id: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Export transactions as CSV or Excel file."""
    if format == "xlsx":
        data = export_excel(db, project_id=project_id, year=year)
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=transactions.xlsx"},
        )
    else:
        data = export_csv(db, project_id=project_id, year=year)
        return Response(
            content=data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=transactions.csv"},
        )


@export_router.get("/tax-summary")
async def export_tax_summary(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Export tax summary as Excel."""
    if not year:
        year = datetime.utcnow().year

    data = export_tax_summary_excel(db, year)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=tax-summary-{year}.xlsx"},
    )
