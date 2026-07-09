"""
SQLAlchemy models for Ledger Inbox.

Tables: documents, transactions, projects, categories
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    Date,
    DateTime,
    Text,
    ForeignKey,
    event,
)
from sqlalchemy.orm import relationship, Session

from .database import Base, SessionLocal


def gen_uuid() -> str:
    return str(uuid.uuid4())


# ──────────────────────────────────────────
# Documents — หลักฐาน (สลิป, ไฟล์)
# ──────────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=gen_uuid)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # jpg, png, pdf
    file_path = Column(String, nullable=False)
    file_sha256 = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processing_status = Column(
        String, default="uploaded"
    )  # uploaded | processing | extracted | waiting_model | failed | completed
    extracted_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    document_type = Column(
        String, default="slip"
    )  # slip | receipt | invoice | contract | withholding_certificate | statement | other
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="document")


# ──────────────────────────────────────────
# Projects — โปรเจกต์
# ──────────────────────────────────────────

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    client_name = Column(String, nullable=True)
    status = Column(String, default="active")  # active | completed | archived
    started_at = Column(Date, nullable=True)
    ended_at = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="project")


# ──────────────────────────────────────────
# Accounts — บัญชีธนาคาร/wallet ที่เป็นของเรา
# ──────────────────────────────────────────

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)  # e.g. "KBANK - Mike"
    type = Column(String, default="bank")  # bank | wallet | cash | promptpay
    bank_name = Column(String, nullable=True)  # KBANK, SCB, TrueMoney
    owner_name = Column(String, nullable=True)  # ใช้จับคู่ sender/receiver ว่าเป็นเราไหม
    account_number_masked = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="account")


# ──────────────────────────────────────────
# Parties — คู่ค้า (ลูกค้า/vendor/ฯลฯ)
# ──────────────────────────────────────────

class Party(Base):
    __tablename__ = "parties"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    type = Column(
        String, default="client"
    )  # client | vendor | middleman | platform | personal | government
    tax_id = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    default_category = Column(String, nullable=True)
    default_project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    withholding_rate = Column(Float, nullable=True)  # e.g. 3.0 = 3%
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="party")


# ──────────────────────────────────────────
# Owner Profile — ข้อมูลเจ้าของบัญชี (singleton)
# ──────────────────────────────────────────

class OwnerProfile(Base):
    __tablename__ = "owner_profile"

    id = Column(String, primary_key=True, default=lambda: "owner")
    name = Column(String, nullable=True)
    tax_id = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ──────────────────────────────────────────
# Categories — หมวดหมู่รายรับ/รายจ่าย
# ──────────────────────────────────────────

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False, unique=True)
    type = Column(String, nullable=False)  # income | expense
    created_at = Column(DateTime, default=datetime.utcnow)


# ──────────────────────────────────────────
# Transactions — รายการบัญชี
# ──────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=True)
    party_id = Column(String, ForeignKey("parties.id"), nullable=True)
    type = Column(
        String, nullable=False
    )  # income | expense | transfer | personal | unknown
    category = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="THB")
    transaction_datetime = Column(DateTime, nullable=True)
    sender_name = Column(String, nullable=True)
    receiver_name = Column(String, nullable=True)
    bank_or_wallet = Column(String, nullable=True)
    reference_no = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)  # 1.0 = manually created
    review_status = Column(
        String, default="confirmed"
    )  # pending | confirmed | edited | rejected
    duplicate_status = Column(
        String, default="unique"
    )  # unique | suspected_duplicate | duplicate
    tax_relevant = Column(Boolean, default=False)
    withholding_tax_amount = Column(Float, nullable=True)
    vat_amount = Column(Float, nullable=True)
    source = Column(String, default="manual")  # manual | slip | statement | ai
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="transactions")
    project = relationship("Project", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    party = relationship("Party", back_populates="transactions")


# ──────────────────────────────────────────
# Seed Data
# ──────────────────────────────────────────

DEFAULT_CATEGORIES = [
    # Income
    {"name": "รายได้ฟรีแลนซ์", "type": "income"},
    {"name": "รายได้ Consult", "type": "income"},
    {"name": "รายได้อื่นๆ", "type": "income"},
    # Expense
    {"name": "ค่าอาหาร", "type": "expense"},
    {"name": "ค่าเดินทาง", "type": "expense"},
    {"name": "ค่า Software / AI / API", "type": "expense"},
    {"name": "ค่า Server / Domain", "type": "expense"},
    {"name": "ค่าอุปกรณ์", "type": "expense"},
    {"name": "ค่าการศึกษา", "type": "expense"},
    {"name": "ค่าสาธารณูปโภค", "type": "expense"},
    {"name": "ค่าจ้างคนอื่น", "type": "expense"},
    {"name": "ค่าธรรมเนียมธนาคาร", "type": "expense"},
    {"name": "ค่าประกัน", "type": "expense"},
    {"name": "อื่นๆ", "type": "expense"},
]


def seed_default_categories():
    """Insert default categories if table is empty."""
    db: Session = SessionLocal()
    try:
        existing = db.query(Category).count()
        if existing == 0:
            for cat in DEFAULT_CATEGORIES:
                db.add(Category(**cat))
            db.commit()
    finally:
        db.close()
