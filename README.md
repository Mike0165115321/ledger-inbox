# 📒 Ledger Inbox — กล่องบัญชีอัจฉริยะ

> **ระบบบัญชีส่วนตัวสำหรับนักพัฒนาฟรีแลนซ์**
> Evidence-first Accounting — ทุกตัวเลขต้องผูกกับหลักฐาน

---

## 🎯 V1 — Complete ✅

| Feature | Status |
|:--|:--:|
| ✅ เก็บรายรับ / รายจ่าย | Done |
| ✅ แนบสลิป + AI อ่านอัตโนมัติ (Qwen3-VL) | Done |
| ✅ จัดหมวดอัตโนมัติ + ผูกโปรเจกต์ | Done |
| ✅ กันรายการซ้ำ 3 ระดับ | Done |
| ✅ Review Queue — ยืนยัน/แก้ไข/ปฏิเสธ | Done |
| ✅ Dashboard + สรุปภาษีรายปี | Done |
| ✅ Export CSV / Excel / Tax Summary | Done |
| ❌ Login / Cloud / Multi-user | V1 ไม่ทำ |
| ❌ Banking API | V1 ไม่ทำ |

---

## 🧱 Stack (Actual)

| Layer | Tech |
|:--|:--|
| Frontend | Next.js 16 + Tailwind CSS v4 |
| Backend | Python FastAPI |
| Database | SQLite (Offline First) |
| AI Slip Reader | Qwen3-VL:8b via Ollama (local) |
| Export | CSV + Excel (openpyxl) |

---

## 🚀 Quick Start

```bash
# วิธีที่ 1 — ดับเบิลคลิก
run-all.bat

# วิธีที่ 2 — manual
# Terminal 1
cd src/backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2
cd src/frontend
npm run dev

# เปิด http://localhost:3000
```

> **ต้องการ AI อ่านสลิป:** ต้องรัน Ollama ก่อน และ `ollama pull qwen3-vl:8b`

---

## 📁 Project Structure

```
src/
├── backend/           # FastAPI (port 8000)
│   └── app/
│       ├── api/       # documents, transactions, projects, dashboard, health
│       ├── agents/    # Business Agent (classify + dedup + review)
│       ├── services/  # Slip Reader, EasySlip, Export, Dedup
│       ├── prompts/   # Qwen3-VL prompt templates
│       ├── schemas/   # Pydantic models
│       └── db/        # SQLAlchemy models + SQLite
│
└── frontend/          # Next.js 16 (port 3000)
    └── src/
        ├── app/       # 5 pages: Dashboard, Inbox, Transactions, Projects, Review
        ├── components/# Layout, Forms, FileUpload, StatCard
        └── lib/       # API client
```

---

## 🗺️ Architecture

```
Upload Slip → Slip Reader (Qwen3-VL) → Business Agent (classify + dedup) → Ledger (SQLite)
                                                    ↓
                                            Review Queue (ถ้า AI ไม่มั่นใจ)
                                                    ↓
                                            User ยืนยัน/แก้ไข/ปฏิเสธ
```

ดูรายละเอียดเพิ่มเติม: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## ⚠️ Non-goals (V1)

- **Offline First 100%** — ข้อมูลทั้งหมดอยู่ในเครื่อง
- **No SaaS** — Desktop-first, เตรียมห่อ Tauri/Electron ต่อ
- **EasySlip manual fallback เท่านั้น** — ไม่ auto ส่งข้อมูลออกนอกเครื่อง
- โปรเจกต์นี้เป็น **Module** ของ AI Personal Assistant ในอนาคต
