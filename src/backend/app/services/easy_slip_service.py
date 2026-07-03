"""
EasySlip API client — primary slip OCR service.
Uses EasySlip v2 API for Thai bank slip extraction.

API Docs: https://document.easyslip.com/en/
"""

import os
from datetime import datetime
from typing import Optional

import requests

from ..schemas.slip import SlipExtractionResult

EASYSLIP_API_URL = os.getenv(
    "EASYSLIP_API_URL",
    "https://api.easyslip.com/v1/verify",
)
EASYSLIP_API_KEY = os.getenv("EASYSLIP_API_KEY", "")


class EasySlipService:
    """Primary slip extraction using EasySlip v2 API."""

    def is_configured(self) -> bool:
        """Check if API key is set."""
        return bool(EASYSLIP_API_KEY)

    def read(self, file_path: str) -> SlipExtractionResult:
        """
        Send slip image to EasySlip v2 for OCR extraction.

        Args:
            file_path: Path to slip image file (jpg/png)

        Returns:
            SlipExtractionResult with extracted fields
        """
        if not self.is_configured():
            raise RuntimeError(
                "EasySlip API key not configured. Set EASYSLIP_API_KEY in .env"
            )

        headers = {"Authorization": f"Bearer {EASYSLIP_API_KEY}"}

        with open(file_path, "rb") as f:
            files = {"image": (os.path.basename(file_path), f, "image/png")}
            resp = requests.post(
                EASYSLIP_API_URL,
                headers=headers,
                files=files,
                data={"checkDuplicate": "false"},
                timeout=30,
            )

        resp.raise_for_status()
        data = resp.json()

        # Log response for debugging
        print(f"[EasySlip] v1 response: {resp.status_code}")

        return self._parse_response(data)

    def _parse_response(self, data: dict) -> SlipExtractionResult:
        """Parse EasySlip API response into SlipExtractionResult."""
        # v2 format: {"success": true, "data": {"rawSlip": {...}}}
        # v1 format: {"data": {...}} (simpler)

        # Check v2 format first
        raw = data.get("data", {}).get("rawSlip")
        if raw:
            return self._parse_v2(raw)

        # Try v1 format (simpler flat structure)
        slip_data = data.get("data", data)
        if isinstance(slip_data, dict) and slip_data.get("amount") is not None:
            return self._parse_v1(slip_data)

        # Empty / unrecognized
        return SlipExtractionResult(
            confidence=0.0,
            warnings=["empty_response"],
        )

    def _parse_v2(self, raw: dict) -> SlipExtractionResult:
        """Parse v2 response format."""
        amount_data = raw.get("amount", {})
        amount = amount_data.get("amount") or (
            amount_data.get("local", {}).get("amount")
        )
        if amount is not None:
            try:
                amount = float(amount)
            except (ValueError, TypeError):
                amount = None

        # Date
        dt_str = raw.get("date")
        transaction_datetime = None
        if dt_str:
            try:
                transaction_datetime = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            except (ValueError, Exception):
                pass

        # Sender
        sender_data = raw.get("sender", {})
        sender_account = sender_data.get("account", {}).get("name", {})
        sender_name = (
            sender_account.get("th")
            or sender_account.get("en")
        )
        sender_bank = sender_data.get("bank", {}).get("short")

        # Receiver
        receiver_data = raw.get("receiver", {})
        receiver_account = receiver_data.get("account", {}).get("name", {})
        receiver_name = (
            receiver_account.get("th")
            or receiver_account.get("en")
        )
        receiver_bank = receiver_data.get("bank", {}).get("short")

        # Bank: use sender bank if sender is the one transferring TO us
        bank = receiver_bank or sender_bank

        # Reference
        ref = raw.get("transRef")

        # Confidence: EasySlip v2 is usually very accurate
        confidence = 0.92
        warnings = []

        if amount is None:
            warnings.append("amount_not_found")
            confidence = 0.5

        return SlipExtractionResult(
            amount=amount,
            currency="THB",
            transaction_datetime=transaction_datetime,
            sender_name=sender_name,
            receiver_name=receiver_name,
            bank_or_wallet=bank,
            reference_no=ref,
            note=None,
            confidence=confidence,
            warnings=warnings,
        )

    def _parse_v1(self, d: dict) -> SlipExtractionResult:
        """Parse v1 (simpler) response format."""
        amount = d.get("amount")
        if amount is not None:
            try:
                amount = float(str(amount).replace(",", ""))
            except (ValueError, TypeError):
                amount = None

        dt_str = d.get("date") or d.get("transactionDate")
        transaction_datetime = None
        if dt_str:
            try:
                transaction_datetime = datetime.fromisoformat(
                    str(dt_str).replace("Z", "+00:00")
                )
            except (ValueError, Exception):
                pass

        sender = d.get("sender") or d.get("senderName") or d.get("from")
        receiver = d.get("receiver") or d.get("receiverName") or d.get("to")
        bank = d.get("bank") or d.get("bankName")
        ref = d.get("ref") or d.get("reference") or d.get("transRef")
        note = d.get("note") or d.get("memo")

        confidence = 0.90
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
