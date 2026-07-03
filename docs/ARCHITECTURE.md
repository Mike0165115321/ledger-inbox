# Ledger Inbox — Architecture

> **โครงสร้างสถาปัตยกรรมที่ใช้สร้าง**
> สำหรับ Requirements / Scope → ดู `REQUIREMENTS.md`

---

## 1. Module Architecture (4 Layers)

```
┌──────────────────────────────────┐
│         UI Layer                 │
│    Next.js (Frontend)            │
│  Inbox | Dashboard | Review      │
├──────────────────────────────────┤
│      Business Agent Layer        │
│  Classify | Dedup | Review Queue │
├──────────────────────────────────┤
│       Ledger Layer               │
│  Transaction | Project | Export  │
│  SQLite                          │
├──────────────────────────────────┤
│      Slip Reader Layer           │
│  Gemini gemini-3.1-flash-lite    │
│  (Vision API — Cloud)            │
└──────────────────────────────────┘
```

แต่ละ Layer แยกกันชัดเจน — เปลี่ยน Slip Reader โดยไม่กระทบ Ledger หรือ UI

---

## 2. Layer Communication Protocol

**กฎสำคัญ:** Slip Reader กับ Business Agent **ไม่สื่อสารกันผ่าน HTTP ภายใน V1**

### Data Flow

```
Next.js
  │
  │ POST /documents/upload  (HTTP multipart)
  ▼
FastAPI route  (api/documents.py)
  │
  ▼
Business Agent (agents/business_agent.py)
  │
  ├── SlipReaderService.read(file_path)
  │       │
  │       ▼
  │   returns Pydantic SlipExtractionResult  ← Python object, ไม่ใช่ HTTP
  │
  ├── classify → assign category + project
  ├── dedup check
  ├── decide_review_status()
  │
  ▼
TransactionService.save()
  │
  ▼
SQLite
```

**เหตุผลที่ไม่ใช้ internal HTTP:**
- ไม่ต้องสร้าง service layer ซ้อน service
- ไม่ต้อง auth ภายใน
- debug ง่าย
- เหมาะกับ local-first
- อนาคตจะแยก Slip Reader เป็น API ก็ยังทำได้ (เปลี่ยน import เป็น HTTP call โดย Business Agent ไม่ต้องรู้)

---

### 2.1 Slip Reader Layer 🔍

**เป้าหมาย:** รับ slip image → output validated Pydantic model

| Component | Description |
|:--|:--|
| **Gemini gemini-3.1-flash-lite** | Vision API — อ่านสลิปผ่าน Google Gemini API (Cloud) |

**Output schema (SlipExtractionResult):**
```python
class SlipExtractionResult(BaseModel):
    amount: float | None
    currency: str = "THB"
    transaction_datetime: datetime | None
    sender_name: str | None
    receiver_name: str | None
    bank_or_wallet: str | None
    reference_no: str | None
    note: str | None
    confidence: float  # 0.0 - 1.0
    warnings: list[str]
```

#### Slip Extraction Pipeline (ละเอียด)

```
Upload
  │
  ▼
Save file to disk
  │
  ▼
Calculate file SHA-256 hash
  │
  ▼
Preprocess image
  ├── Fix EXIF orientation
  ├── Resize long edge → 1600–2000 px
  └── Compress if file too large
  │
  ▼
Send to Gemini gemini-3.1-flash-lite (Vision API)
  │
  ▼
Raw model output
  │
  ▼
JSON extractor
  ├── Strip markdown wrappers
  ├── Extract JSON block
  └── Handle malformed JSON
  │
  ▼
Pydantic validation  (SlipExtractionResult)
  │
  ▼
Field normalization
  ├── Amount → float
  ├── Date → datetime
  └── Names → strip whitespace
  │
  ▼
→ Business Agent (classify + dedup + review decision)
```

**ไม่ทำใน V1:**
- auto crop รูป
- QR code crop
- bank-specific crop (crop พลาด = ตัวเลขหาย = บัญชีพัง)

#### Prompt Template

แยกไฟล์เฉพาะ — `backend/app/services/prompts/slip_extraction.py`

```python
SLIP_EXTRACTION_PROMPT = """
Extract payment slip information from the image.

Return ONLY valid JSON:
{
  "amount": number | null,
  "currency": "THB",
  "transaction_datetime": string | null,
  "sender_name": string | null,
  "receiver_name": string | null,
  "bank_or_wallet": string | null,
  "reference_no": string | null,
  "note": string | null,
  "confidence": number,
  "warnings": string[]
}

Rules:
- Do not invent missing data.
- Use null for unreadable fields.
- confidence must be 0 to 1.
- Return JSON only.
"""
```

#### Raw Text → Structured Output

V1 ใช้ raw text output จาก Gemini แล้วมี parser แยกอีกชั้น

```
Raw model output
  ↓
extract JSON block (regex)
  ↓
validate against Pydantic schema
  ↓
normalize fields
```

Gemini อาจตอบ JSON ไม่สะอาด — มี markdown wrapper, extra text — parser จัดการให้

---

### 2.2 Ledger Layer 📒

**เป้าหมาย:** เก็บ + คำนวณ transaction อย่างถูกต้อง

- SQLite Offline
- Transaction CRUD
- Project binding
- Month/Year aggregation
- กันรายการซ้ำ (3 ระดับ)

---

### 2.3 Business Agent Layer 🤖

**เป้าหมาย:** ประสาน Slip Reader + Ledger — จัดหมวด, กันซ้ำ, ส่ง Review

- รับ SlipExtractionResult จาก SlipReaderService
- จัดหมวด Income/Expense
- ผูกโปรเจกต์
- Dedup check (3 ระดับ)
- Confidence scoring + Review decision
- **ไม่ได้ทำ OCR เอง** — Slip Reader Layer แยกออกมาเป็นโมดูลเฉพาะ

---

### 2.4 UI Layer 🖥️

**เป้าหมาย:** หน้าจอให้คนใช้

- Next.js + Tailwind
- 5 หน้าจอ: Inbox, Transactions, Projects, Dashboard, Review Queue

---

## 3. Data Flow

```
หลักฐาน         →   รายการบัญชี      →   สรุปธุรกิจ
(Slip/PDF/IMG)     (Transaction)       (Project Profit)
    │                    │                    │
    ▼                    ▼                    ▼
Slip Reader         Ledger Layer         UI Layer
(Qwen3/EasySlip)   (SQLite + Logic)     (Dashboard)
```

ทุกตัวเลขต้องมีหลักฐาน — ไม่ให้ AI เดาแล้วบันทึก

### Workflow Detail

```
1. โยนสลิปเข้า Inbox
2. Slip Reader Layer อ่านข้อมูล (Qwen3-VL local)
3. Business Agent จัดหมวดเบื้องต้น
4. รายการที่มั่นใจสูง → บันทึก Ledger อัตโนมัติ
5. รายการที่มั่นใจต่ำ → ส่ง Review Queue
6. ผู้ใช้กดยืนยัน/แก้ไข
7. ระบบอัปเดต Dashboard
8. สิ้นเดือน Export รายงาน
9. สิ้นปี Export Tax Summary
```

---

## 4. Data Model (MVP)

### documents

```sql
documents
  id                  UUID PRIMARY KEY
  file_name           TEXT
  file_type           TEXT           -- jpg / png / pdf
  file_path           TEXT
  file_sha256         TEXT           -- สำหรับ exact file duplicate check
  file_size           INTEGER
  uploaded_at         TIMESTAMP
  processing_status   TEXT           -- uploaded / processing / extracted / waiting_model / failed / completed
  extracted_text      TEXT           -- raw output จาก model
  error_message       TEXT
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
```

### transactions

```sql
transactions
  id                  UUID PRIMARY KEY
  document_id         UUID REFERENCES documents(id)
  project_id          UUID REFERENCES projects(id)     -- NULL = unassigned
  type                TEXT           -- income / expense / transfer / personal / unknown
  category            TEXT
  amount              DECIMAL(12,2)
  currency            TEXT DEFAULT 'THB'
  transaction_datetime TIMESTAMP
  sender_name         TEXT
  receiver_name       TEXT
  bank_or_wallet      TEXT
  reference_no        TEXT
  note                TEXT
  confidence          REAL           -- 0.0 - 1.0
  review_status       TEXT           -- pending / confirmed / edited / rejected
  duplicate_status    TEXT           -- unique / suspected_duplicate / duplicate
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
```

### projects

```sql
projects
  id                  UUID PRIMARY KEY
  name                TEXT
  client_name         TEXT
  status              TEXT           -- active / completed / archived
  started_at          DATE
  ended_at            DATE           -- NULL = ongoing
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
```

### categories

```sql
categories
  id                  UUID PRIMARY KEY
  name                TEXT
  type                TEXT           -- income / expense
  created_at          TIMESTAMP
```

### tax_years

```sql
tax_years
  year                INTEGER PRIMARY KEY
  total_income        DECIMAL(12,2)
  total_expense       DECIMAL(12,2)
  estimated_profit    DECIMAL(12,2)
  updated_at          TIMESTAMP
```

### Status แยกหน้าที่ชัดเจน

| Field | ใช้บอกอะไร |
|:--|:--|
| `documents.processing_status` | สถานะการอ่านไฟล์ (uploaded → processing → extracted → failed) |
| `transactions.review_status` | สถานะการตรวจรายการบัญชี (pending / confirmed / edited / rejected) |
| `transactions.duplicate_status` | สถานะความซ้ำ (unique / suspected_duplicate / duplicate) |

---

## 5. Dedup Logic (3 ระดับ)

### ระดับ 1: Strong Duplicate

**เงื่อนไข:** `reference_no` เหมือนกัน + `amount` เท่ากัน

```
duplicate_status = "duplicate"
review_status    = "pending"    ← ไม่ลบ ให้ user ยืนยัน
```

### ระดับ 2: Suspected Duplicate

**เงื่อนไข:** amount เท่ากัน + วันเดียวกัน + sender/receiver คล้าย + เวลาใกล้กัน
(ใช้เมื่อไม่มี reference_no หรืออ่านไม่ชัด)

```
duplicate_status = "suspected_duplicate"
review_status    = "pending"
```

### ระดับ 3: Exact File Duplicate

**เงื่อนไข:** `file_sha256` ซ้ำ — อัปโหลดไฟล์เดิมซ้ำ

```
duplicate_status = "duplicate"
review_status    = "pending"
```

### ห้ามลบอัตโนมัติใน V1 เด็ดขาด

ข้อมูลเงิน — ห้ามให้ AI เล่นบทพระเจ้า ทุกระดับต้องให้ user ยืนยันก่อน

---

## 6. Review Decision Logic

### Confidence Thresholds

| ช่วง | การดำเนินการ |
|:--|:--|
| confidence ≥ 0.85 | → auto confirmed (ถ้าไม่มี override) |
| 0.60 ≤ confidence < 0.85 | → Review Queue |
| confidence < 0.60 | → type = unknown → Review Queue + แจ้งเตือน |

### Override Rules (ถึง confidence สูงก็ต้องเข้า Review Queue)

- amount = null
- date = null
- sender_name = null AND receiver_name = null
- duplicate_status != unique
- reference_no null แต่ยอดซ้ำกับรายการอื่น
- model มี warning สำคัญ
- has_critical_missing_fields() = True

### Decision Function

```python
def decide_review_status(result: SlipExtractionResult) -> str:
    """Return: confirmed | pending"""

    # Critical missing fields
    if result.has_critical_missing_fields():
        return "pending"

    # Duplicate detected
    if result.duplicate_status in ("duplicate", "suspected_duplicate"):
        return "pending"

    # Confidence-based
    if result.confidence >= 0.85:
        return "confirmed"

    return "pending"
```

```python
def has_critical_missing_fields(result: SlipExtractionResult) -> bool:
    missing = []
    if result.amount is None:
        missing.append("amount")
    if result.transaction_datetime is None:
        missing.append("date")
    if result.sender_name is None and result.receiver_name is None:
        missing.append("sender/receiver")
    if result.warnings:
        missing.extend(result.warnings)
    return len(missing) > 0
```

---

## 7. Agent Architecture (V1)

### Business Agent (ตัวเดียวใน V1)

ทำหน้าที่ประสานทุก Layer — รับ structured data จาก Slip Reader → classify → dedup → review decision → บันทึก Ledger

เมื่อระบบใหญ่ค่อยแตกเป็น:
- Slip Reader Agent (Qwen3-VL pipeline)
- Ledger Agent
- Finance Agent
- Tax Agent
- Review Agent

### ZCode Agents ที่ใช้

| Agent | ใช้ทำอะไรในโปรเจคนี้ |
|:--|:--|
| `frontend.md` 🔵 | UI + Next.js API routes |
| `backend-py.md` 🟣 | FastAPI backend, Slip Reader pipeline, Ledger logic |

---

## 8. Error Handling

### Gemini API Health Check

ก่อนเริ่ม process Slip Reader — Business Agent ตรวจว่า GEMINI_API_KEY ถูกต้องและเรียก API ได้

```python
def is_model_ready() -> bool:
    """Check if Gemini API key is configured"""
    return bool(settings.GEMINI_API_KEY)
```

### Flow เมื่อ Gemini API ล้มเหลว

```
FastAPI รับไฟล์
  │
  ▼
บันทึก document record
  │
  ▼
เริ่ม process
  │
  ▼
เรียก Gemini Vision API
  │
  ├── สำเร็จ → process ปกติ
  │
  └── ล้มเหลว (API Error / Timeout)
        │
        ▼
      document.processing_status = "failed"
      document.error_message = "Gemini API error: <detail>"
        │
        ▼
      UI แจ้ง user
        │
        └── ปุ่ม Retry (ลองอีกครั้ง)
```

### Key Principle

**Gemini เป็น Slip Reader เดียวใน V1** — ไม่มี local fallback, ไม่มี third-party fallback

---

## 9. Stack

### MVP (Local Web)

| Layer | Tech |
|:--|:--|
| UI | Next.js + Tailwind |
| Business Agent | Python / FastAPI (orchestration + classify) |
| Ledger | SQLite + SQLAlchemy |
| Slip Reader | Gemini gemini-3.1-flash-lite (Vision API) |
| Export | CSV / Excel (openpyxl) |

### Desktop App (ช่วงต่อไป)

- Tauri หรือ Electron ห่อทีหลัง

---

## 10. Screens (MVP)

1. **Inbox** — Upload → Processing → Needs Review → Completed
2. **Transactions** — ตาราง Date | Type | Amount | Category | Project | Confidence | Status
3. **Projects** — รายรับ/รายจ่ายแยกตามโปรเจกต์ + Profit + Missing Docs
4. **Dashboard** — Total Income / Expense / Estimated Profit / Tax Year Summary
5. **Review Queue** — รายการที่ AI ไม่มั่นใจ + [Confirm] [Edit]

---

## 11. Project Structure

```
E:\GitHup\ledger-inbox\
├── AGENTS.md
├── README.md
├── docs/
│   ├── REQUIREMENTS.md
│   └── ARCHITECTURE.md
├── src/
│   ├── frontend/              ← Next.js (UI Layer)
│   │   └── app/
│   │       ├── inbox/
│   │       ├── transactions/
│   │       ├── projects/
│   │       ├── dashboard/
│   │       └── review/
│   │
│   ├── backend/               ← FastAPI (Ledger + Agent)
│   │   └── app/
│   │       ├── api/
│   │       │   └── documents.py      ← upload endpoint
│   │       │   └── transactions.py   ← CRUD + review queue
│   │       │   └── projects.py
│   │       │   └── dashboard.py
│   │       │   └── health.py         ← Slip Reader health check
│   │       │
│   │       ├── agents/
│   │       │   └── business_agent.py ← orchestrator
│   │       │
│   │       ├── services/
│   │       │   ├── gemini_service.py       ← Gemini Vision API
│   │       │   ├── classification_service.py
│   │       │   ├── dedup_service.py
│   │       │   └── export_service.py
│   │       │
│   │       ├── schemas/
│   │       │   └── slip.py        ← SlipExtractionResult
│   │       │   └── transaction.py
│   │       │   └── document.py
│   │       │
│   │       ├── db/
│   │       │   └── models.py
│   │       │   └── database.py
│   │       │
│   │       ├── prompts/
│   │       │   └── slip_extraction.py  ← Prompt template
│   │       │
│   │       ├── core/
│   │       │   └── config.py
│   │       │
│   │       └── main.py
│   │
│   └── shared/                ← types / schemas
│
├── tests/
│   ├── test_slip_reader.py
│   ├── test_dedup.py
│   ├── test_review_decision.py
│   └── test_transactions.py
│
└── assets/
```

---

## 12. Principles

- **Slip Reader = Gemini Vision API call ผ่าน `gemini_service.py`**
- **Raw output → parser → validate — 3 ขั้นตอนแยกกัน**
- **Dedup 3 ระดับ — ห้ามลบอัตโนมัติ**
- **Review decision = function ที่มี override rules**
- **ไม่มี EasySlip — ไม่มี local model — Gemini เดียว**
- **ไม่มี internal auth — ทุกอย่างวิ่งในเครื่อง**
