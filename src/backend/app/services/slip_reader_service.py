"""
Slip Reader Service — orchestrates the full extraction pipeline.

Pipeline: image → preprocess → Ollama → JSON extract → validate → normalize
"""

from datetime import datetime
from typing import Optional

from ..schemas.slip import SlipExtractionResult
from ..prompts.slip_extraction import SLIP_EXTRACTION_PROMPT
from .image_processor import preprocess_image
from .ollama_service import ollama
from .json_extractor import extract_json_safe


class SlipReaderService:
    """Orchestrates slip image → structured data extraction."""

    def read(self, file_path: str) -> SlipExtractionResult:
        """
        Full extraction pipeline.

        Args:
            file_path: Path to slip image file (jpg/png)

        Returns:
            SlipExtractionResult with extracted fields
        """
        # Step 1: Preprocess image → base64
        image_b64 = preprocess_image(file_path)

        # Step 2: Send to Qwen3-VL via Ollama
        raw_output = ollama.generate_with_retry(
            prompt=SLIP_EXTRACTION_PROMPT,
            image_b64=image_b64,
        )

        # Step 3: Extract JSON from raw text
        data = extract_json_safe(raw_output)
        if data is None:
            return SlipExtractionResult(
                confidence=0.0,
                warnings=["json_parse_failed"],
            )

        # Step 4: Validate and normalize
        return self._parse_result(data)

    def _parse_result(self, data: dict) -> SlipExtractionResult:
        """Validate raw dict and return SlipExtractionResult."""
        warnings = list(data.get("warnings", []))

        # Normalize amount
        amount = data.get("amount")
        if amount is not None:
            try:
                amount = float(amount)
            except (ValueError, TypeError):
                warnings.append("amount_parse_error")
                amount = None

        # Normalize datetime
        dt = data.get("transaction_datetime")
        transaction_datetime = None
        if dt:
            try:
                # Handle various date formats
                if isinstance(dt, str):
                    dt = dt.strip()
                    # Try ISO format
                    for fmt in (
                        "%Y-%m-%dT%H:%M:%S",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%dT%H:%M",
                        "%Y-%m-%d %H:%M",
                        "%Y-%m-%d",
                        "%d/%m/%Y %H:%M:%S",
                        "%d/%m/%Y %H:%M",
                        "%d/%m/%Y",
                        "%m/%d/%Y",
                    ):
                        try:
                            transaction_datetime = datetime.strptime(dt, fmt)
                            break
                        except ValueError:
                            continue
                elif isinstance(dt, datetime):
                    transaction_datetime = dt
            except Exception:
                warnings.append("date_parse_error")

        # Normalize confidence
        confidence = data.get("confidence", 0.5)
        try:
            confidence = float(confidence)
        except (ValueError, TypeError):
            confidence = 0.5
        confidence = max(0.0, min(1.0, confidence))

        # Clean string fields
        def clean_str(val) -> Optional[str]:
            if val is None:
                return None
            if isinstance(val, str):
                val = val.strip()
                return val if val else None
            return str(val) if val else None

        result = SlipExtractionResult(
            amount=amount,
            currency="THB",
            transaction_datetime=transaction_datetime,
            sender_name=clean_str(data.get("sender_name")),
            receiver_name=clean_str(data.get("receiver_name")),
            bank_or_wallet=clean_str(data.get("bank_or_wallet")),
            reference_no=clean_str(data.get("reference_no")),
            note=clean_str(data.get("note")),
            confidence=confidence,
            warnings=warnings,
        )

        return result


# Singleton
slip_reader = SlipReaderService()
