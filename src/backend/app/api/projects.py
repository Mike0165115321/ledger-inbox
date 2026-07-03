"""
CRUD for /api/projects
GET returns ProjectWithStats (includes income/expense/profit per project)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import Project, Transaction
from ..schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectWithStats,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _compute_stats(project: Project, db: Session) -> ProjectWithStats:
    """Attach financial stats to a project."""
    stats = ProjectWithStats(
        id=project.id,
        name=project.name,
        client_name=project.client_name,
        status=project.status,
        started_at=project.started_at,
        ended_at=project.ended_at,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )

    transactions = (
        db.query(Transaction)
        .filter(Transaction.project_id == project.id)
        .all()
    )

    for tx in transactions:
        if tx.type == "income":
            stats.total_income += tx.amount
        elif tx.type == "expense":
            stats.total_expense += tx.amount

    stats.profit = stats.total_income - stats.total_expense
    stats.transaction_count = len(transactions)
    return stats


@router.get("", response_model=list[ProjectWithStats])
async def list_projects(db: Session = Depends(get_db)):
    """List all projects with financial stats."""
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return [_compute_stats(p, db) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project."""
    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{id}", response_model=ProjectWithStats)
async def get_project(id: str, db: Session = Depends(get_db)):
    """Get a single project with stats."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโปรเจกต์")
    return _compute_stats(project, db)


@router.put("/{id}", response_model=ProjectResponse)
async def update_project(
    id: str, data: ProjectUpdate, db: Session = Depends(get_db)
):
    """Update a project."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโปรเจกต์")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{id}")
async def delete_project(id: str, db: Session = Depends(get_db)):
    """Delete a project. Transactions are NOT cascade-deleted — they become unassigned."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="ไม่พบโปรเจกต์")

    # Unlink transactions before deleting project
    db.query(Transaction).filter(Transaction.project_id == id).update(
        {Transaction.project_id: None}
    )

    db.delete(project)
    db.commit()
    return {"message": "ลบโปรเจกต์แล้ว"}
