"""
Prompt template for Qwen3-VL slip extraction.

Thai-optimized prompt — banks in Thailand use Thai text on slips.
"""

SLIP_EXTRACTION_PROMPT = """Extract payment slip information from the image.
The slip may be in Thai or English language.

Return ONLY valid JSON in this exact format:
{
  "amount": number | null,
  "currency": "THB",
  "transaction_datetime": "YYYY-MM-DDTHH:MM:SS" | null,
  "sender_name": string | null,
  "receiver_name": string | null,
  "bank_or_wallet": string | null,
  "reference_no": string | null,
  "note": string | null,
  "confidence": number (0.0 to 1.0),
  "warnings": string[]
}

Rules:
- Do NOT invent or guess missing data — use null.
- amount: extract the transaction amount as a number (no commas, no currency symbol).
  If you see "50,000.00" → 50000.00
- transaction_datetime: convert to ISO format YYYY-MM-DDTHH:MM:SS. Use UTC.
- sender_name: who sent the money (name, company, or account name).
- receiver_name: who received the money.
- bank_or_wallet: bank name (e.g., KBANK, SCB, BBL, KTB) or wallet (e.g., TrueMoney, PayPal).
- reference_no: transaction reference number, slip ID, or QR payment reference.
- note: any additional info (e.g., "ค่าอาหาร", "ค่าเช่า", purpose of payment).
- confidence: your confidence in the extraction (0.0 = pure guess, 1.0 = 100% certain).
  Use lower confidence if the image is blurry, rotated, or partially cropped.
- warnings: list any issues (e.g., "image blurry", "text partially cut off", "low resolution").

Return JSON ONLY — no markdown, no explanation.
"""

# Shorter prompt for speed (use when model is slow)
SLIP_EXTRACTION_PROMPT_FAST = """Extract payment slip data as JSON:
{
  "amount": number|null,
  "currency": "THB",
  "transaction_datetime": "YYYY-MM-DDTHH:MM:SS"|null,
  "sender_name": string|null,
  "receiver_name": string|null,
  "bank_or_wallet": string|null,
  "reference_no": string|null,
  "note": string|null,
  "confidence": number(0-1),
  "warnings": string[]
}
Rules: no guessing, use null for unclear fields, JSON only.
"""
