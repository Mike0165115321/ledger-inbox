"""
Upload Queue — ส่งสลิปให้ Gemini ทีละ 1 รูป พร้อม delay และ backoff

กฎ:
  - ส่ง 1 request → รอ 5 วินาที → ส่งถัดไป
  - ถ้า 429 → รอ 15 วินาที → retry (สูงสุด 3 ครั้ง)
  - นับ requests_today (reset ทุกเที่ยงคืน)
  - rpm_window: นับ request ใน 60 วินาทีที่ผ่านมา
"""

import asyncio
import json
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, date
from pathlib import Path
from typing import Optional

from ..services.gemini_service import gemini
from ..agents.business_agent import run_pipeline
from ..core.config import GEMINI_RPM_LIMIT, GEMINI_TPM_LIMIT, GEMINI_RPD_LIMIT

# ไฟล์เก็บ state ข้ามรอบ restart
_STATE_FILE = Path(__file__).parent.parent.parent / "queue_state.json"


# ── Types ────────────────────────────────────────────────────────────────────

@dataclass
class QueueJob:
    doc_id: str
    file_path: str
    db_session_factory: object   # callable → Session


@dataclass
class QueueStatus:
    queue_size: int = 0
    is_processing: bool = False
    rate_limited: bool = False
    rate_limit_reset_at: Optional[datetime] = None
    # RPM
    requests_today: int = 0
    rpm_used: int = 0
    rpm_limit: int = 15
    # TPM (โทเคนต่อนาที — จาก usageMetadata จริง)
    tpm_used: int = 0
    tpm_limit: int = 250000
    # RPD
    rpd_limit: int = 500
    # misc
    last_processed_at: Optional[datetime] = None
    last_error: Optional[str] = None


# ── Queue Singleton ───────────────────────────────────────────────────────────

class UploadQueue:
    """
    Singleton queue worker.
    เพิ่มงานด้วย enqueue() — worker loop จัดการเอง
    """

    DELAY_BETWEEN = 5.0      # วินาทีระหว่าง request ปกติ
    RATE_LIMIT_WAIT = 15.0   # วินาทีที่รอเมื่อโดน 429
    MAX_RETRIES = 3

    def __init__(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._status = QueueStatus(
            rpm_limit=GEMINI_RPM_LIMIT,
            tpm_limit=GEMINI_TPM_LIMIT,
            rpd_limit=GEMINI_RPD_LIMIT,
        )
        self._running = False
        self._task: Optional[asyncio.Task] = None

        # RPM tracking — timestamp ของแต่ละ request ใน 60วิในล่าสุด
        self._rpm_timestamps: deque = deque()

        # TPM tracking — (timestamp, token_count) ใน 60 วินาทีล่าสุด
        self._tpm_window: deque = deque()  # deque of (monotonic_time, token_count)

        # RPD tracking — โหลดจาก disk ก่อนเสมอ
        self._today: date = date.today()
        self._load_state()

    # ── Public API ────────────────────────────────────────────────────────────

    async def start(self):
        """เริ่ม worker loop — เรียกตอน FastAPI startup"""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._worker())
        print("[Queue] Worker started")

    async def stop(self):
        """หยุด worker — เรียกตอน FastAPI shutdown"""
        self._running = False
        if self._task:
            self._task.cancel()
        print("[Queue] Worker stopped")

    def enqueue(self, doc_id: str, file_path: str, db_session_factory) -> int:
        """
        เพิ่มงานเข้าคิว — return queue position (1-indexed)
        """
        job = QueueJob(doc_id=doc_id, file_path=file_path,
                       db_session_factory=db_session_factory)
        self._queue.put_nowait(job)
        position = self._queue.qsize()
        self._status.queue_size = position
        print(f"[Queue] Enqueued {doc_id} (position {position})")
        return position

    def get_status(self) -> QueueStatus:
        """คืน status snapshot ปัจจุบัน"""
        self._status.queue_size = self._queue.qsize() + (
            1 if self._status.is_processing else 0
        )
        self._update_rpm()
        self._update_tpm()
        return self._status

    # ── Worker ───────────────────────────────────────────────────────────────

    async def _worker(self):
        """Main loop — ทำงานใน background ตลอดเวลา"""
        while self._running:
            try:
                job: QueueJob = await asyncio.wait_for(
                    self._queue.get(), timeout=1.0
                )
            except asyncio.TimeoutError:
                continue  # ไม่มีงาน → loop ต่อ

            await self._process(job)

            # delay ก่อนงานถัดไป
            if not self._queue.empty():
                await asyncio.sleep(self.DELAY_BETWEEN)

    async def _process(self, job: QueueJob):
        """ประมวลผล 1 งาน พร้อม retry"""
        self._status.is_processing = True
        self._reset_today_if_needed()

        for attempt in range(self.MAX_RETRIES):
            try:
                # เรียก Gemini ใน thread pool (blocking I/O)
                result = await asyncio.get_event_loop().run_in_executor(
                    None, gemini.read, job.file_path
                )

                # บันทึกผลลัพธ์ — อ่าน token count จาก gemini.last_token_count (ของจริง)
                self._record_request(token_count=gemini.last_token_count)
                self._status.rate_limited = False
                self._status.rate_limit_reset_at = None
                self._status.last_processed_at = datetime.utcnow()
                self._status.last_error = None

                # Run Business Agent + save
                db = job.db_session_factory()
                try:
                    from ..db.models import Document
                    doc = db.query(Document).filter(
                        Document.id == job.doc_id
                    ).first()
                    if doc:
                        import json
                        doc.extracted_text = json.dumps(result.model_dump(), default=str)
                        doc.processing_status = "completed"
                        db.commit()
                        db.refresh(doc)
                        run_pipeline(result, doc, db)
                finally:
                    db.close()

                print(f"[Queue] Done: {job.doc_id} (confidence={result.confidence:.2f})")
                break

            except RuntimeError as e:
                err_str = str(e)

                # Rate limit
                if "rate limit" in err_str.lower() or "429" in err_str:
                    wait = self.RATE_LIMIT_WAIT * (attempt + 1)
                    reset_at = datetime.utcnow()
                    self._status.rate_limited = True
                    self._status.rate_limit_reset_at = reset_at
                    print(
                        f"[Queue] 429 rate limit (attempt {attempt+1}), "
                        f"waiting {wait}s..."
                    )
                    await asyncio.sleep(wait)
                    continue

                # อื่น ๆ → fail
                self._mark_failed(job.doc_id, job.db_session_factory, err_str)
                self._status.last_error = err_str
                break

            except Exception as e:
                self._mark_failed(job.doc_id, job.db_session_factory, str(e))
                self._status.last_error = str(e)
                break

        self._status.is_processing = False
        self._queue.task_done()

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _record_request(self, token_count: int = 0):
        now = time.monotonic()
        self._rpm_timestamps.append(now)
        self._tpm_window.append((now, token_count))
        self._status.requests_today += 1
        self._save_state()  # persist ทันที

    def _update_rpm(self):
        """ลบ timestamp เก่ากว่า 60 วินาที"""
        now = time.monotonic()
        while self._rpm_timestamps and self._rpm_timestamps[0] < now - 60:
            self._rpm_timestamps.popleft()
        self._status.rpm_used = len(self._rpm_timestamps)

    def _update_tpm(self):
        """นับ token ใน 60 วินาทีล่าสุด — จาก usageMetadata จริง"""
        now = time.monotonic()
        while self._tpm_window and self._tpm_window[0][0] < now - 60:
            self._tpm_window.popleft()
        self._status.tpm_used = sum(t for _, t in self._tpm_window)

    def _reset_today_if_needed(self):
        today = date.today()
        if today != self._today:
            self._today = today
            self._status.requests_today = 0
            self._save_state()
            print("[Queue] Daily counter reset")

    def _load_state(self):
        """โหลด requests_today จากไฟล์ — ข้ามรอบ server restart"""
        try:
            if _STATE_FILE.exists():
                data = json.loads(_STATE_FILE.read_text())
                saved_date = date.fromisoformat(data.get("date", "2000-01-01"))
                if saved_date == date.today():
                    self._status.requests_today = int(data.get("requests_today", 0))
                    print(f"[Queue] Loaded state: {self._status.requests_today} requests today")
                else:
                    print("[Queue] New day — counter reset")
        except Exception as e:
            print(f"[Queue] Could not load state: {e}")

    def _save_state(self):
        """บันทึก requests_today ลงไฟล์"""
        try:
            data = {
                "date": date.today().isoformat(),
                "requests_today": self._status.requests_today,
            }
            _STATE_FILE.write_text(json.dumps(data))
        except Exception as e:
            print(f"[Queue] Could not save state: {e}")

    def _mark_failed(self, doc_id: str, db_factory, error: str):
        db = db_factory()
        try:
            from ..db.models import Document
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                doc.processing_status = "failed"
                doc.error_message = error
                db.commit()
        finally:
            db.close()
        print(f"[Queue] Failed: {doc_id} — {error}")


# ── Singleton instance ────────────────────────────────────────────────────────

upload_queue = UploadQueue()
