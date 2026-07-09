"""
GET /api/dashboard/summary        — สรุปรายรับ/รายจ่าย/กำไร
GET /api/dashboard/tax-summary    — Tax year summary
GET /api/dashboard/tax-calculation — Full tax breakdown with brackets
GET /api/dashboard/timeline       — Timeline data (day/week/month/year)
GET /api/export/transactions      — Export CSV / Excel
GET /api/export/tax-summary       — Export tax summary Excel
"""

from datetime import datetime, timedelta
from typing import Optional, Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Transaction
from ..mcp_tools import get_yearly_summary
from ..services.export_service import export_csv, export_excel, export_tax_summary_excel
from ..services.tax_service import calculate_tax, format_money

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/yearly-summary", operation_id="get_yearly_summary")
async def yearly_summary(
    year: Optional[int] = Query(None, description="ปี ค.ศ. เช่น 2026"),
    db: Session = Depends(get_db),
):
    """สรุปทั้งปีแบบเข้ม — รายรับ/รายจ่าย/กำไร, top categories, รายเดือน, ประมาณการภาษี, รายการรอตรวจ"""
    return get_yearly_summary(db, year)


@router.get("/summary", operation_id="dashboard_summary")
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


@router.get("/tax-summary", operation_id="tax_summary")
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


@router.get("/tax-calculation", operation_id="tax_calculation")
async def tax_calculation(
    year: Optional[int] = Query(None, description="ปี ค.ศ. เช่น 2026"),
    db: Session = Depends(get_db),
):
    """
    Full tax calculation with progressive brackets.
    Computes tax based on actual income/expense data.
    """
    if not year:
        year = datetime.utcnow().year

    txs = (
        db.query(Transaction)
        .filter(Transaction.transaction_datetime.like(f"{year}%"))
        .all()
    )

    income_txs = [t for t in txs if t.type == "income"]
    expense_txs = [t for t in txs if t.type == "expense"]

    gross_income = sum(t.amount for t in income_txs)
    total_expense = sum(t.amount for t in expense_txs)

    # Calculate tax with default freelancer deductions
    result = calculate_tax(gross_income=gross_income)

    # Serialize brackets
    brackets_out = []
    for b in result.brackets:
        brackets_out.append({
            "label": b.label,
            "rate": b.rate,
            "rate_pct": b.rate_pct,
            "taxable": round(b.taxable_in_bracket, 2),
            "tax": round(b.tax_in_bracket, 2),
        })

    # Serialize allowances
    allowances_out = [
        {"label": k, "amount": v} for k, v in result.allowances.items()
    ]

    return {
        "year": year,
        "gross_income": round(result.gross_income, 2),
        "total_expenses": round(total_expense, 2),
        "expense_deduction": round(result.expense_deduction, 2),
        "income_after_expenses": round(result.income_after_expenses, 2),
        "allowances": allowances_out,
        "total_allowances": round(result.total_allowances, 2),
        "net_taxable_income": round(result.net_taxable_income, 2),
        "brackets": brackets_out,
        "total_tax": round(result.total_tax, 2),
        "effective_rate": result.effective_rate,
        "note": "ประมาณการ — ปรึกษาผู้ตรวจสอบบัญชีก่อนยื่นภาษี",
    }


@router.get("/timeline", operation_id="dashboard_timeline")
async def dashboard_timeline(
    granularity: Literal["day", "week", "month", "year"] = Query("month"),
    year: Optional[int] = Query(None, description="ปี ค.ศ. เช่น 2026"),
    db: Session = Depends(get_db),
):
    """
    Timeline data สำหรับกราฟ Dashboard
    - granularity: day | week | month | year
    - คืนค่า array ของ { period, income, expense, count }
    """
    query = db.query(Transaction)

    if not year:
        year = datetime.utcnow().year

    query = query.filter(Transaction.transaction_datetime.like(f"{year}%"))

    txs = query.all()

    buckets: dict[str, dict] = {}

    for tx in txs:
        if not tx.transaction_datetime:
            continue

        dt = tx.transaction_datetime

        if granularity == "day":
            key = dt.strftime("%Y-%m-%d")
        elif granularity == "week":
            # ISO week: year-W## (e.g., 2026-W01)
            iso = dt.isocalendar()
            key = f"{iso[0]}-W{iso[1]:02d}"
        elif granularity == "month":
            key = dt.strftime("%Y-%m")
        else:  # year
            key = dt.strftime("%Y")

        if key not in buckets:
            buckets[key] = {"period": key, "income": 0.0, "expense": 0.0, "count": 0}

        if tx.type == "income":
            buckets[key]["income"] += tx.amount
        elif tx.type == "expense":
            buckets[key]["expense"] += tx.amount

        buckets[key]["count"] += 1

    # Sort by period
    result = sorted(buckets.values(), key=lambda b: b["period"])

    return {
        "granularity": granularity,
        "year": year,
        "data": result,
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
