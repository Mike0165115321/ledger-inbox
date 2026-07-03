"""
JSON extraction from raw model output.

Local vision models often return messy output:
- markdown wrappers (```json ... ```)
- extra text before/after JSON
- malformed JSON (trailing commas, unquoted keys)

This module cleans that up.
"""

import json
import re


def extract_json(raw_text: str) -> dict:
    """
    Extract a JSON object from raw model output.

    Strategy:
    1. Try direct parse (clean JSON)
    2. Strip markdown code fences
    3. Find first { ... } block via regex
    4. Fix common JSON issues
    5. Raise ValueError if all fail
    """
    text = raw_text.strip()

    # 1. Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Strip markdown code fences
    fence_patterns = [
        r"```json\s*\n(.*?)\n```",
        r"```\s*\n(.*?)\n```",
        r"```json\s*(.*?)\s*```",
        r"```\s*(.*?)\s*```",
    ]
    for pattern in fence_patterns:
        m = re.search(pattern, text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1).strip())
            except json.JSONDecodeError:
                continue

    # 3. Find first JSON object block
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        json_str = m.group(0)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            # 4. Fix common issues and retry
            json_str = _fix_common_issues(json_str)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass

    raise ValueError(f"Failed to extract JSON from model output: {text[:200]}...")


def _fix_common_issues(json_str: str) -> str:
    """Fix common JSON issues from LLM output."""
    # Remove trailing commas before } or ]
    json_str = re.sub(r",\s*(\}|\])", r"\1", json_str)
    # Fix single quotes → double quotes (naive)
    # (Skip complex cases — just do basic cleanup)
    # Remove comments (// ... \n)
    json_str = re.sub(r"//.*?\n", "\n", json_str)
    # Remove BOM
    json_str = json_str.lstrip("\ufeff")
    return json_str


def extract_json_safe(raw_text: str) -> dict | None:
    """Safe wrapper — returns None if extraction fails."""
    try:
        return extract_json(raw_text)
    except (ValueError, json.JSONDecodeError):
        return None
