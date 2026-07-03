"""
Gemini Flash service — primary slip OCR using Google Gemini 2.0 Flash.

Free tier: 1,500 requests/day
Supports: multiple images in one request, structured JSON output
"""

import os
import base64
from datetime import datetime
from typing import Optional

import requests
import time

from ..schemas.slip import SlipExtractionResult
from ..core.config import GEMINI_API_KEY, GEMINI_MODEL

GEMINI_API_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)


SLIP_PROMPT = """Extract payment slip information from these images (1-3 images of the same slip).

Return ONLY valid JSON, no markdown, no explanation:
{
  "amount": number or null,
  "currency": "THB",
  "transaction_datetime": "YYYY-MM-DDTHH:MM:SS" or null,
  "sender_name": string or null,
  "receiver_name": string or null,
  "bank_or_wallet": string or null,
  "reference_no": string or null,
  "note": string or null,
  "confidence": number 0.0-1.0,
  "warnings": string[]
}

Rules:
- If multiple images, combine information from all of them.
- Do not invent missing data — use null.
- amount: number only, no commas or currency symbols.
- bank_or_wallet: bank short code (KBANK, SCB, BBL, KTB, etc).
- confidence: how confident you are (1.0 = perfect, 0.0 = pure guess).
- warnings: note any issues like "blurry", "partial image", "text unclear".
"""


class GeminiService:
    """Slip extraction using Gemini Flash API."""

    def __init__(self):
        self.last_token_count: int = 0  # โทเคนจาก request ล่าสุด (จาก usageMetadata)

    def is_configured(self) -> bool:
        return bool(GEMINI_API_KEY)

    def read(self, file_paths: str | list[str]) -> SlipExtractionResult:
        """
        Send slip image(s) to Gemini Flash for extraction.

        Args:
            file_paths: Single file path or list of 1-3 file paths

        Returns:
            SlipExtractionResult
        """
        if not self.is_configured():
            raise RuntimeError(
                "Gemini API key not configured. Set GEMINI_API_KEY in .env"
            )

        if isinstance(file_paths, str):
            file_paths = [file_paths]

        # Build parts: instruction + images
        parts = [{"text": SLIP_PROMPT}]

        for fp in file_paths[:3]:  # Max 3 images
            mime = "image/png" if fp.lower().endswith(".png") else "image/jpeg"
            with open(fp, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
            parts.append({
                "inline_data": {"mime_type": mime, "data": b64},
            })

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 1024,
                "response_mime_type": "application/json",
            },
        }

        resp = self._call_with_retry(payload)
        data = resp.json()

        # อ่าน token usage จาก Gemini response (ข้อมูลจริง)
        usage = data.get("usageMetadata", {})
        self.last_token_count = usage.get("totalTokenCount", 0)
        print(f"[Gemini] tokens used: {self.last_token_count} "
              f"(prompt={usage.get('promptTokenCount',0)}, "
              f"output={usage.get('candidatesTokenCount',0)})")

        # Extract text from response
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            raise RuntimeError(f"Unexpected Gemini response: {data}")

        print(f"[Gemini] response: {len(text)} chars")

        # Parse JSON from response
        import json
        try:
            obj = json.loads(text)
        except json.JSONDecodeError:
            # Maybe wrapped in markdown
            import re
            m = re.search(r"\{.*\}", text, re.DOTALL)
            if m:
                obj = json.loads(m.group())
            else:
                return SlipExtractionResult(
                    confidence=0.0,
                    warnings=["json_parse_failed"],
                )

        return self._normalize(obj)

    def _call_with_retry(self, payload: dict, max_retries: int = 3) -> requests.Response:
        """Call Gemini API with retry on rate limit (429)."""
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        last_error = None

        for attempt in range(max_retries):
            resp = requests.post(url, json=payload, timeout=30)

            if resp.status_code == 429:
                wait = (attempt + 1) * 5  # 5s, 10s, 15s
                print(f"[Gemini] 429 rate limit, retrying in {wait}s...")
                time.sleep(wait)
                last_error = resp
                continue

            resp.raise_for_status()
            return resp

        raise RuntimeError(
            f"Gemini rate limited after {max_retries} retries. "
            "Wait a moment and try again."
        )

    def _normalize(self, data: dict) -> SlipExtractionResult:
        """Clean and normalize extracted fields."""
        warnings = list(data.get("warnings", []))

        # Amount
        amount = data.get("amount")
        if amount is not None:
            try:
                amount = float(amount)
            except (ValueError, TypeError):
                warnings.append("amount_parse_error")
                amount = None

        # Date
        dt = data.get("transaction_datetime")
        transaction_datetime = None
        if dt and isinstance(dt, str):
            try:
                transaction_datetime = datetime.fromisoformat(
                    dt.strip().replace("Z", "+00:00")
                )
            except (ValueError, Exception):
                warnings.append("date_parse_error")

        # Confidence
        confidence = data.get("confidence", 0.5)
        try:
            confidence = float(confidence)
        except (ValueError, TypeError):
            confidence = 0.5
        confidence = max(0.0, min(1.0, confidence))

        def clean(v) -> Optional[str]:
            if not v:
                return None
            s = str(v).strip()
            return s if s else None

        return SlipExtractionResult(
            amount=amount,
            currency="THB",
            transaction_datetime=transaction_datetime,
            sender_name=clean(data.get("sender_name")),
            receiver_name=clean(data.get("receiver_name")),
            bank_or_wallet=clean(data.get("bank_or_wallet")),
            reference_no=clean(data.get("reference_no")),
            note=clean(data.get("note")),
            confidence=confidence,
            warnings=warnings,
        )


# Singleton
gemini = GeminiService()
