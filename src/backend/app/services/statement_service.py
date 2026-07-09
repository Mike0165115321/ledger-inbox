"""
Statement Import Service — Phase 1 เบื้องต้น (CSV only)

Flow:
1. อ่าน CSV (ลอง utf-8-sig ก่อน แล้วค่อย cp874) + ข้าม preamble หา header จริง
2. Map คอลัมน์แบบ heuristic — รองรับหัวตารางไทย/อังกฤษจาก KBANK, SCB, TrueMoney, generic export
3. แต่ละแถว → ทิศเงินจากคอลัมน์ ฝาก/ถอน (หรือ amount ติดลบ) → income/expense จากมุมมองบัญชีเรา
4. Dedup: ref+amount ซ้ำ = duplicate (ข้าม), amount+วันเดียวกันกับรายการเดิมนอก statement นี้ = suspected
   (สร้างไว้ให้คนตัดสินใน Review Queue — ห้าม auto-delete ตามกฎ dedup เดิม)
5. สร้าง Transaction(source="statement", review_status="pending") ผูกกับ Document ของ statement
"""

import csv
import io
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from ..db.models import Transaction
from .classification_service import suggest_category

# ── Column header aliases (lowercase, matched by substring) ──────────

DATE_HEADERS = ["วันที่ทำรายการ", "วันที่", "transaction date", "posted date", "date"]
TIME_HEADERS = ["เวลา", "time"]
DESC_HEADERS = [
    "รายละเอียด", "คำอธิบายรายการ", "รายการ", "transaction description",
    "description", "detail", "memo", "หมายเหตุ", "note",
]
WITHDRAWAL_HEADERS = ["ถอนเงิน", "ถอน", "เงินออก", "withdrawal", "withdraw", "debit"]
DEPOSIT_HEADERS = ["ฝากเงิน", "ฝาก", "เงินเข้า", "deposit", "credit"]
AMOUNT_HEADERS = ["จำนวนเงิน", "amount"]
REF_HEADERS = ["เลขที่อ้างอิง", "อ้างอิง", "reference", "ref no", "ref"]
CHANNEL_HEADERS = ["ช่องทาง", "channel"]


@dataclass
class ParsedRow:
    row_number: int
    transaction_datetime: datetime
    amount: float          # always positive
    direction: str         # "in" | "out"
    description: Optional[str] = None
    reference_no: Optional[str] = None
    channel: Optional[str] = None


@dataclass
class ParseResult:
    rows: list[ParsedRow] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


@dataclass
class ImportSummary:
    total_rows: int = 0
    created: int = 0
    skipped_duplicates: int = 0
    suspected_duplicates: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)


# ── Parsing helpers ──────────────────────────────────────────────────

def _decode(content: bytes) -> str:
    for encoding in ("utf-8-sig", "cp874"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="replace")


def _match_header(header: str, aliases: list[str]) -> bool:
    h = header.strip().lower()
    return any(a in h for a in aliases)


def _find_header_row(lines: list[str]) -> Optional[int]:
    """Bank exports often have preamble (ชื่อบัญชี ช่วงเวลา ฯลฯ) before the real header."""
    for i, line in enumerate(lines[:30]):
        cells = next(csv.reader([line]), [])
        has_date = any(_match_header(c, DATE_HEADERS) for c in cells)
        has_money = any(
            _match_header(c, WITHDRAWAL_HEADERS + DEPOSIT_HEADERS + AMOUNT_HEADERS)
            for c in cells
        )
        if has_date and has_money:
            return i
    return None


def _parse_amount(raw: Optional[str]) -> Optional[float]:
    if raw is None:
        return None
    text = raw.strip().replace(",", "").replace("฿", "").replace("THB", "").strip()
    if not text or text in ("-", "–"):
        return None
    negative = text.startswith("(") and text.endswith(")")
    if negative:
        text = text[1:-1]
    try:
        value = float(text)
    except ValueError:
        return None
    return -value if negative else value


DATE_FORMATS = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%y", "%d %b %Y", "%d %b %y"]


def _parse_datetime(date_raw: str, time_raw: Optional[str]) -> Optional[datetime]:
    date_text = (date_raw or "").strip()
    if not date_text:
        return None

    dt = None
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(date_text, fmt)
            break
        except ValueError:
            continue
    if dt is None:
        return None

    # ปี พ.ศ. → ค.ศ. (bank exports ไทยหลายเจ้าใช้ พ.ศ.)
    if dt.year > 2400:
        dt = dt.replace(year=dt.year - 543)

    time_text = (time_raw or "").strip()
    if time_text:
        m = re.match(r"(\d{1,2}):(\d{2})(?::(\d{2}))?", time_text)
        if m:
            dt = dt.replace(
                hour=int(m.group(1)),
                minute=int(m.group(2)),
                second=int(m.group(3) or 0),
            )
    return dt


def parse_statement_csv(content: bytes) -> ParseResult:
    """Parse bank statement CSV → normalized rows. Never raises on bad rows — collects errors."""
    result = ParseResult()
    text = _decode(content)
    lines = [ln for ln in text.splitlines() if ln.strip()]

    header_idx = _find_header_row(lines)
    if header_idx is None:
        result.errors.append(
            "หา header ไม่เจอ — CSV ต้องมีคอลัมน์วันที่ และคอลัมน์เงิน (ฝาก/ถอน หรือ amount)"
        )
        return result

    reader = csv.DictReader(io.StringIO("\n".join(lines[header_idx:])))
    headers = reader.fieldnames or []

    claimed: set[str] = set()

    def find_col(aliases: list[str]) -> Optional[str]:
        # จองคอลัมน์ที่ match แล้ว กันชนกันเอง เช่น "วันที่ทำรายการ" ต้องไม่ถูกนับเป็น
        # description ทั้งที่มี "รายการ" เป็น substring — จึงหา date ก่อน desc เสมอ
        for h in headers:
            if h and h not in claimed and _match_header(h, aliases):
                claimed.add(h)
                return h
        return None

    col_date = find_col(DATE_HEADERS)
    col_time = find_col(TIME_HEADERS)
    col_withdraw = find_col(WITHDRAWAL_HEADERS)
    col_deposit = find_col(DEPOSIT_HEADERS)
    col_amount = find_col(AMOUNT_HEADERS)
    col_ref = find_col(REF_HEADERS)
    col_channel = find_col(CHANNEL_HEADERS)
    col_desc = find_col(DESC_HEADERS)

    if not col_date or not (col_withdraw or col_deposit or col_amount):
        result.errors.append("คอลัมน์ไม่ครบ — ต้องมีวันที่ + (ฝาก/ถอน หรือ amount)")
        return result

    for i, row in enumerate(reader, start=header_idx + 2):  # 1-based + header line
        dt = _parse_datetime(row.get(col_date, ""), row.get(col_time) if col_time else None)
        if dt is None:
            result.errors.append(f"แถว {i}: อ่านวันที่ไม่ได้ ({row.get(col_date)!r})")
            continue

        amount = None
        direction = None
        withdraw = _parse_amount(row.get(col_withdraw)) if col_withdraw else None
        deposit = _parse_amount(row.get(col_deposit)) if col_deposit else None
        if withdraw:
            amount, direction = abs(withdraw), "out"
        elif deposit:
            amount, direction = abs(deposit), "in"
        elif col_amount:
            signed = _parse_amount(row.get(col_amount))
            if signed:
                amount = abs(signed)
                direction = "in" if signed > 0 else "out"

        if not amount or not direction:
            # แถว balance/สรุป หรือแถวว่าง — ข้ามเงียบ ๆ ถ้าไม่มีตัวเลขเลย
            continue

        description = (row.get(col_desc) or "").strip() if col_desc else None
        channel = (row.get(col_channel) or "").strip() if col_channel else None
        ref = (row.get(col_ref) or "").strip() if col_ref else None

        result.rows.append(
            ParsedRow(
                row_number=i,
                transaction_datetime=dt,
                amount=amount,
                direction=direction,
                description=description or None,
                reference_no=ref or None,
                channel=channel or None,
            )
        )

    return result


# ── Dedup (statement-aware) ──────────────────────────────────────────

def _check_duplicate(
    db: Session,
    row: ParsedRow,
    statement_document_id: str,
) -> tuple[str, Optional[str]]:
    """
    Returns (duplicate_status, matched_transaction_id).

    ต่างจาก dedup_service.check_all ตรงที่ไม่เทียบกับแถวที่มาจาก statement ไฟล์เดียวกัน —
    แถวคนละแถวใน statement เดียวกันไม่ใช่รายการซ้ำ แม้ยอด/วันจะตรงกัน
    """
    base = db.query(Transaction).filter(
        (Transaction.document_id != statement_document_id)
        | (Transaction.document_id.is_(None))
    )

    # Level 1: ref + amount ตรงกัน = ซ้ำแน่นอน (เช่น import ไฟล์เดือนที่ทับช่วงกัน)
    if row.reference_no:
        dup = base.filter(
            Transaction.reference_no == row.reference_no,
            Transaction.amount == row.amount,
        ).first()
        if dup:
            return ("duplicate", dup.id)

    # Level 2: ยอดเท่ากัน + วันเดียวกัน = อาจซ้ำกับสลิปที่เคยลงไว้ (คือ reconciliation นั่นเอง)
    day_start = row.transaction_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    dup = base.filter(
        Transaction.amount == row.amount,
        Transaction.transaction_datetime >= day_start,
        Transaction.transaction_datetime < day_end,
    ).first()
    if dup:
        return ("suspected_duplicate", dup.id)

    return ("unique", None)


# ── Import ───────────────────────────────────────────────────────────

def import_rows(
    db: Session,
    rows: list[ParsedRow],
    account_id: str,
    account_bank_name: Optional[str],
    statement_document_id: str,
) -> ImportSummary:
    """สร้าง pending transactions จากแถว statement — ซ้ำแน่นอนข้าม, สงสัยซ้ำสร้างพร้อม flag"""
    summary = ImportSummary(total_rows=len(rows))

    for row in rows:
        dup_status, matched_id = _check_duplicate(db, row, statement_document_id)
        if dup_status == "duplicate":
            summary.skipped_duplicates += 1
            continue

        tx_type = "income" if row.direction == "in" else "expense"
        note = " | ".join(filter(None, [row.description, row.channel]))
        if dup_status == "suspected_duplicate" and matched_id:
            note = f"{note} | อาจซ้ำกับรายการ {matched_id}".strip(" |")

        tx = Transaction(
            document_id=statement_document_id,
            account_id=account_id,
            type=tx_type,
            category=suggest_category(tx_type, row.description),
            amount=row.amount,
            transaction_datetime=row.transaction_datetime,
            bank_or_wallet=account_bank_name,
            reference_no=row.reference_no,
            note=note or None,
            confidence=0.9,  # parsed from bank data — น่าเชื่อถือแต่ยังไม่ได้จัดหมวด/ผูกโปรเจกต์
            review_status="pending",
            duplicate_status=dup_status,
            source="statement",
        )
        db.add(tx)
        summary.created += 1
        if dup_status == "suspected_duplicate":
            summary.suspected_duplicates += 1

    db.commit()
    return summary
