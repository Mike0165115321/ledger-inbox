"""
Image preprocessing for slip reader pipeline.

Steps:
1. Fix EXIF orientation
2. Resize long edge → 1600-2000px (balance quality vs speed)
3. Compress if file is too large (Ollama limits)
"""

import io
import base64
from pathlib import Path
from PIL import Image, ImageOps


MAX_LONG_EDGE = 1800  # pixels — good balance for Qwen3-VL
MAX_FILE_SIZE_MB = 10  # Ollama API limits


def preprocess_image(file_path: str) -> str:
    """
    Preprocess an image for Ollama vision model.
    Returns base64-encoded JPEG string ready for Ollama API.

    Steps:
    - Open with PIL (handles EXIF auto)
    - Convert to RGB (drop alpha channel)
    - Resize if too large
    - Compress if needed
    - Return base64
    """
    img = Image.open(file_path)

    # Fix EXIF orientation
    img = ImageOps.exif_transpose(img)

    # Convert to RGB (drop alpha / CMYK)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Resize long edge
    w, h = img.size
    long_edge = max(w, h)
    if long_edge > MAX_LONG_EDGE:
        ratio = MAX_LONG_EDGE / long_edge
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)

    # Compress to JPEG in memory
    quality = 85
    while True:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        size_mb = buf.tell() / (1024 * 1024)
        if size_mb <= MAX_FILE_SIZE_MB or quality <= 20:
            break
        quality -= 15

    # Encode to base64
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode("utf-8")
    return b64


def get_image_dimensions(file_path: str) -> tuple[int, int]:
    """Quick check of image dimensions."""
    with Image.open(file_path) as img:
        return img.size
