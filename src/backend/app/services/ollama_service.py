"""
Ollama API client — sends image + prompt to Qwen3-VL, returns raw text.
"""

import requests
import time
from typing import Optional

OLLAMA_BASE = "http://localhost:11434"
DEFAULT_MODEL = "qwen3-vl:8b"
FALLBACK_MODEL = "qwen3-vl:4b"
REQUEST_TIMEOUT = 120  # seconds — vision models can be slow
HEALTH_TIMEOUT = 3  # seconds for health check


class OllamaService:
    """Client for Ollama local API."""

    def __init__(self, base_url: str = OLLAMA_BASE, model: str = DEFAULT_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def is_running(self) -> bool:
        """Check if Ollama server is reachable."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=HEALTH_TIMEOUT)
            return resp.status_code == 200
        except requests.RequestException:
            return False

    def is_model_available(self, model: Optional[str] = None) -> bool:
        """Check if a specific model is downloaded and available."""
        model = model or self.model
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=HEALTH_TIMEOUT)
            if resp.status_code != 200:
                return False
            data = resp.json()
            models = [m.get("name", "") for m in data.get("models", [])]
            # model name might include :latest suffix
            return any(model in m or m.startswith(model.split(":")[0]) for m in models)
        except requests.RequestException:
            return False

    def generate(
        self,
        prompt: str,
        image_b64: str,
        model: Optional[str] = None,
        timeout: int = REQUEST_TIMEOUT,
    ) -> str:
        """
        Send image + prompt to vision model, return raw text output.

        Args:
            prompt: Text prompt
            image_b64: Base64-encoded image
            model: Override model name
            timeout: Request timeout in seconds

        Returns:
            Raw text output from model
        """
        model = model or self.model

        payload = {
            "model": model,
            "prompt": prompt,
            "images": [image_b64],
            "stream": False,
            "options": {
                "temperature": 0.1,  # Low temp for extraction — be precise
                "num_predict": 512,  # Max tokens — enough for JSON
            },
        }

        start = time.time()
        resp = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=timeout,
        )
        resp.raise_for_status()
        elapsed = time.time() - start

        data = resp.json()
        output = data.get("response", "")

        print(f"[Ollama] {model} responded in {elapsed:.1f}s, {len(output)} chars")
        return output

    def generate_with_retry(
        self,
        prompt: str,
        image_b64: str,
        max_retries: int = 2,
    ) -> str:
        """
        Generate with model fallback:
        1. Try primary model (8b)
        2. If fails, try fallback (4b)
        """
        last_error = None
        models_to_try = [self.model]
        if self.model != FALLBACK_MODEL and self.is_model_available(FALLBACK_MODEL):
            models_to_try.append(FALLBACK_MODEL)

        for model in models_to_try:
            try:
                return self.generate(prompt, image_b64, model=model)
            except Exception as e:
                last_error = e
                print(f"[Ollama] {model} failed: {e}")
                continue

        raise RuntimeError(f"All models failed. Last error: {last_error}")


# Singleton
ollama = OllamaService()
