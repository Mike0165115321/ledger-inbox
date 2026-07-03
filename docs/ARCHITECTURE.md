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
│  Transaction | Project | Export   │
│  SQLite                          │
├──────────────────────────────────┤
│      Slip Reader Layer           │
│  Qwen3-VL Local (primary)        │
│  EasySlip API (fallback)        │
└──────────────────────────────────┘
```

แต่ละ Layer แยกกันชัดเจน — เปลี่ยน Slip Reader โดยไม่กระทบ Ledger หรือ UI

---

### 1.1 Slip Reader Layer 🔍

**เป้าหมาย:** รับ slip image → output structured JSON

| Component | Description |
|:--|:--|
| **Qwen3-VL:8b (primary)** | Local vision model บน Ollama — 6.1GB, ใช้ 4060 8GB VRAM ได้ |
| **Qwen3-VL:4b (fallback)** | เล็กกว่า (3.3GB) — ถ้า VRAM ไม่พอ |
| **EasySlip API (option)** | ใช้ตอนพัฒนา หรือกรณีที่ local อ่านไม่ได้ 99 THB/เดือน 400 slip |

**Output schema:**
```json
{
  "date": "2026-07-03",
  "amount": 3000,
  "direction": "expense",
  "from": "Mike",
  "to": "OpenRouter",
  "category": "AI/API",
  "confidence": 0.86,
  "source_file": "slip_001.jpg"
}
```

---

### 1.2 Ledger Layer 📒

**เป้าหมาย:** เก็บ + คำนวณ transaction อย่างถูกต้อง

- SQLite Offline
- Transaction CRUD
- Project binding
- Dedup logic
- Month/Year aggregation
- กันรายการซ้ำ

---

### 1.3 Business Agent Layer 🤖

**เป้าหมาย:** ประสาน Slip Reader + Ledger — จัดหมวด, กันซ้ำ, ส่ง Review

- รับ structured data จาก Slip Reader
- จัดหมวด Income/Expense
- ผูกโปรเจกต์
- Confidence scoring
- Review Queue management
- **ไม่ได้ทำ OCR เอง** — Slip Reader Layer แยกออกมาเป็นโมดูลเฉพาะ

---

### 1.4 UI Layer 🖥️

**เป้าหมาย:** หน้าจอให้คนใช้

- Next.js + Tailwind
- 5 หน้าจอ: Inbox, Transactions, Projects, Dashboard, Review Queue

---

## 2. Data Flow

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

## 3. Agent Architecture (V1)

### Business Agent (ตัวเดียวใน V1)

ทำหน้าที่ประสานทุก Layer — รับ structured data จาก Slip Reader → classify → บันทึก Ledger → สรุป Dashboard

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

## 4. Data Model (MVP)

```sql
projects        — id, name, client_name, status, started_at, ended_at
documents       — id, file_name, file_type, file_path, uploaded_at, extracted_text, extraction_status
transactions    — id, project_id, document_id, type, category, amount, date, payer, payee, reference_no, confidence, review_status
categories      — id, name, type
tax_years       — year, total_income, total_expense, estimated_profit
```

เริ่มจาก schema แค่นี้ก่อน อย่าใหญ่

---

## 5. Stack

### MVP (Local Web)

| Layer | Tech |
|:--|:--|
| UI | Next.js + Tailwind |
| Business Agent | Python / FastAPI (Business logic + classify) |
| Ledger | SQLite + Python / SQLAlchemy |
| Slip Reader | **Qwen3-VL:8b** (Ollama local, primary) → EasySlip API (fallback) |
| Export | CSV / Excel |

### Desktop App (ช่วงต่อไป)

- Tauri หรือ Electron ห่อทีหลัง

---

## 6. Screens (MVP)

1. **Inbox** — Upload → Processing → Needs Review → Completed
2. **Transactions** — ตาราง Date | Type | Amount | Category | Project | Confidence | Status
3. **Projects** — รายรับ/รายจ่ายแยกตามโปรเจกต์ + Profit + Missing Docs
4. **Dashboard** — Total Income / Expense / Estimated Profit / Tax Year Summary
5. **Review Queue** — รายการที่ AI ไม่มั่นใจ + [Confirm] [Edit]

---

## 7. Project Structure

```
E:\GitHup\ledger-inbox\
├── AGENTS.md
├── README.md
├── docs/
│   ├── REQUIREMENTS.md        ← สิ่งที่ต้องการ
│   └── ARCHITECTURE.md        ← วิธีการสร้าง (ไฟล์นี้)
├── src/
│   ├── frontend/              ← Next.js (UI Layer)
│   ├── backend/               ← FastAPI (Ledger + Agent)
│   │   └── slip_reader/       ← Qwen3-VL pipeline
│   └── shared/                ← types / schemas
├── tests/
└── assets/
```
