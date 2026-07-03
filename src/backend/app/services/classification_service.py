"""
Classification Service — determine transaction type from extracted data.

Uses sender/receiver names, amounts, and notes to classify:
- income: money coming in (freelance, client, customer)
- expense: money going out (vendor, service, shop)
- transfer: between own accounts
- personal: personal expenses
- unknown: can't determine
"""

from typing import Optional


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
) -> str:
    """
    Classify transaction type from extracted fields.

    Returns: "income" | "expense" | "transfer" | "personal" | "unknown"
    """

    # Combine all text for keyword matching
    text = " ".join(
        filter(None, [sender_name, receiver_name, note, bank_or_wallet])
    ).lower()

    if not text:
        return "unknown"

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
