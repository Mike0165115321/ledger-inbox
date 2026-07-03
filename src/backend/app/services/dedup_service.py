"""
Dedup Service — 3 levels of duplicate detection.

Level 1: Strong Duplicate — reference_no same + amount same
Level 2: Suspected Duplicate — amount same + same day + similar names
Level 3: Exact File Duplicate — file_sha256 same

Key rule: NEVER auto-delete — always flag for user review.
"""

from datetime import datetime, timedelta
from difflib import SequenceMatcher
from typing import Optional
from sqlalchemy.orm import Session

from ..db.models import Transaction, Document


def similarity(a: Optional[str], b: Optional[str]) -> float:
    """Calculate string similarity (0.0 - 1.0)."""
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def check_sha256_duplicate(file_sha256: str, db: Session) -> Optional[Transaction]:
    """Level 3: Check if same file (SHA-256) was already uploaded."""
    existing_doc = (
        db.query(Document)
        .filter(Document.file_sha256 == file_sha256, Document.id != None)
        .first()
    )
    if existing_doc:
        existing_tx = (
            db.query(Transaction)
            .filter(Transaction.document_id == existing_doc.id)
            .first()
        )
        if existing_tx:
            return existing_tx
    return None


def check_strong_duplicate(
    reference_no: Optional[str],
    amount: float,
    db: Session,
    exclude_id: Optional[str] = None,
) -> Optional[Transaction]:
    """Level 1: reference_no same + amount same → strong duplicate."""
    if not reference_no:
        return None

    query = db.query(Transaction).filter(
        Transaction.reference_no == reference_no,
        Transaction.amount == amount,
    )
    if exclude_id:
        query = query.filter(Transaction.id != exclude_id)

    return query.first()


def check_suspected_duplicate(
    amount: float,
    transaction_datetime: Optional[datetime],
    sender_name: Optional[str],
    receiver_name: Optional[str],
    db: Session,
    exclude_id: Optional[str] = None,
) -> Optional[Transaction]:
    """
    Level 2: amount same + same day + similar names → suspected duplicate.
    Used when reference_no is missing or unclear.
    """
    if not transaction_datetime:
        return None

    day_start = transaction_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    candidates = (
        db.query(Transaction)
        .filter(
            Transaction.amount == amount,
            Transaction.transaction_datetime >= day_start,
            Transaction.transaction_datetime < day_end,
        )
        .all()
    )

    for tx in candidates:
        if exclude_id and tx.id == exclude_id:
            continue

        # Check name similarity
        sender_sim = similarity(sender_name, tx.sender_name)
        receiver_sim = similarity(receiver_name, tx.receiver_name)

        if sender_sim > 0.7 or receiver_sim > 0.7:
            return tx

        # If both names are None, still flag as suspected (same amount + same day is suspicious)
        if not sender_name and not receiver_name and not tx.sender_name and not tx.receiver_name:
            return tx

    return None


def check_all(
    amount: float,
    transaction_datetime: Optional[datetime],
    sender_name: Optional[str],
    receiver_name: Optional[str],
    reference_no: Optional[str],
    file_sha256: Optional[str],
    db: Session,
    exclude_id: Optional[str] = None,
) -> tuple[str, Optional[str]]:
    """
    Run all 3 dedup levels.
    Returns: (duplicate_status, matched_transaction_id)
    """
    # Level 3: SHA-256 (file duplicate)
    if file_sha256:
        dup = check_sha256_duplicate(file_sha256, db)
        if dup:
            return ("duplicate", dup.id)

    # Level 1: Strong duplicate
    if reference_no:
        dup = check_strong_duplicate(reference_no, amount, db, exclude_id)
        if dup:
            return ("duplicate", dup.id)

    # Level 2: Suspected duplicate
    dup = check_suspected_duplicate(
        amount, transaction_datetime, sender_name, receiver_name, db, exclude_id
    )
    if dup:
        return ("suspected_duplicate", dup.id)

    return ("unique", None)
