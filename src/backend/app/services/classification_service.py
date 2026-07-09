"""
Classification Service — determine transaction type from extracted data.

Uses sender/receiver names, amounts, and notes to classify:
- income: money coming in (freelance, client, customer)
- expense: money going out (vendor, service, shop)
- transfer: between own accounts
- personal: personal expenses
- unknown: can't determine
"""

from typing import Optional, Sequence


# Keywords that suggest income (someone paying you)
INCOME_KEYWORDS = [
    "ค่าจ้าง", "เงินเดือน", "ค่าพัฒนา", "ออกแบบ", "consult",
    "freelance", "project", "invoice", "payment", "salary",
    "รายได้", "โอนเข้า", "รับโอน", "ลูกค้า", "client",
    "commission", "commission", "bonus", "refund",
]

# Keywords that suggest expense (you paying someone)
EXPENSE_KEYWORDS = [
    "ค่าอาหาร", "ค่าเดินทาง", "ค่าน้ำมัน", "ค่าไฟ", "ค่าน้ำ",
    "ค่าโทรศัพท์", "internet", "domain", "server", "hosting",
    "api", "openai", "chatgpt", "software", "subscription",
    "ค่าธรรมเนียม", "fee", "shopee", "lazada", "grab",
    "lineman", "foodpanda", "7-11", "lotus", "bigc",
    "starbucks", "amazon", "coffee", "netflix", "spotify",
    "ค่าเช่า", "rent", "insurance", "ประกัน",
]

# Keywords for transfers between own accounts
TRANSFER_KEYWORDS = [
    "โอนระหว่างบัญชี", "transfer to myself", "own account",
    "ย้ายเงิน", "ระหว่างบัญชี",
]


def classify_transaction(
    sender_name: Optional[str] = None,
    receiver_name: Optional[str] = None,
    note: Optional[str] = None,
    bank_or_wallet: Optional[str] = None,
    self_identifiers: Optional[Sequence[str]] = None,
) -> str:
    """
    Classify transaction type from extracted fields.

    If `self_identifiers` (names/labels from the user's own Accounts) is given
    and non-empty, direction is decided from account ownership first:
    - sender AND receiver match self  → transfer (between own accounts)
    - only receiver matches self      → income
    - only sender matches self        → expense
    Falls through to the legacy keyword heuristic below when self_identifiers
    is empty/None or neither side matches — this keeps behavior unchanged for
    anyone who hasn't configured any Accounts yet.

    Returns: "income" | "expense" | "transfer" | "personal" | "unknown"
    """

    if self_identifiers:
        ids = [i.strip().lower() for i in self_identifiers if i]
        s_lower = (sender_name or "").strip().lower()
        r_lower = (receiver_name or "").strip().lower()
        sender_is_self = bool(s_lower) and any(i in s_lower for i in ids)
        receiver_is_self = bool(r_lower) and any(i in r_lower for i in ids)

        if sender_is_self and receiver_is_self:
            return "transfer"
        if receiver_is_self and not sender_is_self:
            return "income"
        if sender_is_self and not receiver_is_self:
            return "expense"

    # Combine all text for keyword matching
    text = " ".join(
        filter(None, [sender_name, receiver_name, note, bank_or_wallet])
    ).lower()

    if not text:
        return "unknown"

    # Heuristic: if receiver name exists but sender is different, it's income (money coming to user)
    if receiver_name and sender_name:
        r_clean = receiver_name.strip().lower()
        s_clean = sender_name.strip().lower()
        # If same person → transfer
        if r_clean == s_clean or s_clean in r_clean or r_clean in s_clean:
            return "transfer"
        # Different people + receiver exists → income
        return "income"

    # If only receiver → income
    if receiver_name and not sender_name:
        return "income"

    # If only sender → expense (user sending money)
    if sender_name and not receiver_name:
        return "expense"

    # Check transfer first
    if any(kw in text for kw in TRANSFER_KEYWORDS):
        return "transfer"

    # Count keyword matches
    income_score = sum(1 for kw in INCOME_KEYWORDS if kw in text)
    expense_score = sum(1 for kw in EXPENSE_KEYWORDS if kw in text)

    if income_score > expense_score and income_score > 0:
        return "income"
    if expense_score > income_score and expense_score > 0:
        return "expense"
    if income_score > 0:  # tie breaker
        return "income"
    if expense_score > 0:
        return "expense"

    return "unknown"


def match_account(bank_or_wallet: Optional[str], accounts: Sequence) -> Optional[object]:
    """
    Match extracted `bank_or_wallet` text against the user's own Accounts
    (by name or bank_name, case-insensitive substring). Returns the matched
    Account, or None if nothing matches (or bank_or_wallet is empty).
    """
    if not bank_or_wallet:
        return None
    text = bank_or_wallet.strip().lower()
    for account in accounts:
        if account.name and account.name.lower() in text:
            return account
        if account.bank_name and account.bank_name.lower() in text:
            return account
    return None


def suggest_category(tx_type: str, note: Optional[str] = None) -> Optional[str]:
    """Suggest a category based on transaction type and note."""
    if not note:
        return None

    note_lower = note.lower()

    # Expense categories
    if tx_type == "expense":
        if any(w in note_lower for w in ["อาหาร", "food", "กิน", "coffee", "starbucks", "amazon"]):
            return "ค่าอาหาร"
        if any(w in note_lower for w in ["เดินทาง", "น้ำมัน", "grab", "taxi", "bts", "mrt"]):
            return "ค่าเดินทาง"
        if any(w in note_lower for w in ["api", "openai", "chatgpt", "software", "subscription"]):
            return "ค่า Software / AI / API"
        if any(w in note_lower for w in ["server", "hosting", "domain", "vercel", "netlify"]):
            return "ค่า Server / Domain"
        if any(w in note_lower for w in ["อุปกรณ์", "keyboard", "mouse", "monitor", "device"]):
            return "ค่าอุปกรณ์"
        if any(w in note_lower for w in ["เรียน", "course", "udemy", "coursera", "book"]):
            return "ค่าการศึกษา"
        if any(w in note_lower for w in ["ไฟ", "น้ำ", "โทรศัพท์", "internet"]):
            return "ค่าสาธารณูปโภค"

    # Income categories
    if tx_type == "income":
        if any(w in note_lower for w in ["freelance", "ฟรีแลนซ์", "พัฒนา", "dev", "code"]):
            return "รายได้ฟรีแลนซ์"
        if any(w in note_lower for w in ["consult", "ที่ปรึกษา", "consultant"]):
            return "รายได้ Consult"

    return None
