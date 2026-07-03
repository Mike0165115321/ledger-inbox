"""
GET /api/dashboard/summary
สรุปรายรับ/รายจ่าย/กำไร — overall + แยกตามเดือน + แยกตามโปรเจกต์
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..db.database import get_db
from ..db.models import Transaction

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
