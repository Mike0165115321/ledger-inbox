"""
EasySlip API client — manual fallback only (not auto!).

User must explicitly trigger this by pressing "Retry with EasySlip".
EasySlip is a Thai slip OCR API service.
"""

import os
import base64
import requests
from typing import Optional
from datetime import datetime

from ..schemas.slip import SlipExtractionResult

EASYSLIP_API_URL = os.getenv("EASYSLIP_API_URL", "https://api.easyslip.com/api/v1/verify")
EASYSLIP_API_KEY = os.getenv("EASYSLIP_API_KEY", "")


class EasySlipService:
    """Manual fallback for slip extraction using EasySlip API."""

    def is_configured(self) -> bool:
        """Check if EasySlip API key is set."""
        return bool(EASYSLIP_API_KEY)

    def read(self, file_path: str) -> SlipExtractionResult:
        """
        Send slip to EasySlip API for extraction.

        Returns SlipExtractionResult.
        Raises RuntimeError if API key is not configured.
        """
        if not self.is_configured():
            raise RuntimeError(
                "EasySlip API key not configured. Set EASYSLIP_API_KEY environment variable."
            )

        # Read image and encode as base64
        with open(file_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {EASYSLIP_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {"image": image_b64}

        resp = requests.post(EASYSLIP_API_URL, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        return self._parse_easyslip_response(data)

    def _parse_easyslip_response(self, data: dict) -> SlipExtractionResult:
        """Map EasySlip API response to SlipExtractionResult."""
        result_data = data.get("data", data)

        # Map common EasySlip fields
        amount = result_data.get("amount")
        if amount is not None:
            try:
                amount = float(str(amount).replace(",", ""))
            except (ValueError, TypeError):
                amount = None

        # Parse datetime
        dt_str = result_data.get("date", result_data.get("transDate"))
        transaction_datetime = None
        if dt_str:
            try:
                # EasySlip often returns "DD/MM/YYYY HH:MM" or "YYYY-MM-DD"
                for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
                    try:
                        transaction_datetime = datetime.strptime(dt_str, fmt)
                        break
                    except ValueError:
                        continue
            except Exception:
                pass

        sender = result_data.get("sender", result_data.get("senderName"))
        receiver = result_data.get("receiver", result_data.get("receiverName"))
        bank = result_data.get("bank", result_data.get("bankName"))
        ref = result_data.get("ref", result_data.get("reference", result_data.get("refNo")))
        note = result_data.get("note", result_data.get("memo"))

        confidence = 0.95  # EasySlip is usually quite accurate
        warnings = []

        if amount is None:
            warnings.append("amount_not_found")
            confidence = 0.5

        return SlipExtractionResult(
            amount=amount,
            currency="THB",
            transaction_datetime=transaction_datetime,
            sender_name=sender,
            receiver_name=receiver,
            bank_or_wallet=bank,
            reference_no=ref,
            note=note,
            confidence=confidence,
            warnings=warnings,
        )


# Singleton
easy_slip = EasySlipService()
