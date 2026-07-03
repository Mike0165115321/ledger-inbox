"""
Business Agent — orchestrates the full pipeline:

SlipExtractionResult → classify → dedup → review decision → save transaction

This is the ONLY agent in V1. Future: split into SlipReaderAgent, LedgerAgent, etc.
"""

from datetime import datetime
from sqlalchemy.orm import Session

from ..schemas.slip import SlipExtractionResult
from ..db.models import Transaction, Document
from ..services.dedup_service import check_all
from ..services.classification_service import classify_transaction, suggest_category


def decide_review_status(
    result: SlipExtractionResult,
    duplicate_status: str,
) -> str:
    """
    Review decision logic.

    Returns: "confirmed" | "pending"

    Rules (from ARCHITECTURE.md):
    - confidence ≥ 0.85 → auto confirmed (if no override)
    - 0.60 ≤ confidence < 0.85 → Review Queue
    - confidence < 0.60 → type = unknown → Review Queue

    Override Rules (always pending):
    - has_critical_missing_fields()
    - duplicate_status != "unique"
    """
    # Override: critical missing fields
    if result.has_critical_missing_fields():
        return "pending"

    # Override: duplicate detected
    if duplicate_status != "unique":
        return "pending"

    # Confidence-based decision
    if result.confidence >= 0.85:
        return "confirmed"

    if result.confidence < 0.60:
        return "pending"  # will also set type = unknown

    return "pending"


def run_pipeline(
    result: SlipExtractionResult,
    document: Document,
    db: Session,
) -> Transaction:
    """
    Full Business Agent pipeline:
    1. Classify transaction type
    2. Run 3-level dedup
    3. Decide review status
    4. Create transaction record

    Returns: Transaction (saved to DB)
    """
    # Step 1: Classify
    tx_type = classify_transaction(
        sender_name=result.sender_name,
        receiver_name=result.receiver_name,
        note=result.note,
        bank_or_wallet=result.bank_or_wallet,
    )

    # Low confidence → force unknown
    if result.confidence < 0.60:
        tx_type = "unknown"

    # Step 2: Dedup
    dup_status, dup_tx_id = check_all(
        amount=result.amount or 0,
        transaction_datetime=result.transaction_datetime,
        sender_name=result.sender_name,
        receiver_name=result.receiver_name,
        reference_no=result.reference_no,
        file_sha256=document.file_sha256,
        db=db,
    )

    # Step 3: Review decision
    review_status = decide_review_status(result, dup_status)

    # Step 4: Suggest category
    category = suggest_category(tx_type, result.note)

    # Step 5: Create transaction
    tx = Transaction(
        document_id=document.id,
        type=tx_type,
        category=category,
        amount=result.amount or 0,
        currency=result.currency or "THB",
        transaction_datetime=result.transaction_datetime,
        sender_name=result.sender_name,
        receiver_name=result.receiver_name,
        bank_or_wallet=result.bank_or_wallet,
        reference_no=result.reference_no,
        note=result.note,
        confidence=result.confidence,
        review_status=review_status,
        duplicate_status=dup_status,
    )

    db.add(tx)
    db.commit()
    db.refresh(tx)

    return tx


def get_review_reasons(result: SlipExtractionResult, duplicate_status: str) -> list[str]:
    """Generate human-readable reasons why a transaction ended up in Review Queue."""
    reasons = []

    if result.confidence < 0.60:
        reasons.append(f"🔴 AI confidence ต่ำ ({result.confidence:.0%})")
    elif result.confidence < 0.85:
        reasons.append(f"🟡 AI confidence ปานกลาง ({result.confidence:.0%})")

    if result.amount is None:
        reasons.append("⚠️ ไม่พบจำนวนเงิน")
    if result.transaction_datetime is None:
        reasons.append("⚠️ ไม่พบวันที่")
    if result.sender_name is None and result.receiver_name is None:
        reasons.append("⚠️ ไม่พบชื่อผู้ส่ง/ผู้รับ")

    if duplicate_status == "duplicate":
        reasons.append("🔄 พบรายการซ้ำ (strong match)")
    elif duplicate_status == "suspected_duplicate":
        reasons.append("🔄 อาจเป็นรายการซ้ำ (suspected)")

    if result.warnings:
        for w in result.warnings:
            reasons.append(f"⚠️ {w}")

    if not reasons:
        reasons.append("📝 รอตรวจสอบ")

    return reasons
