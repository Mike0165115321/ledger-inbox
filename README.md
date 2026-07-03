# 📒 Ledger Inbox — กล่องบัญชีอัจฉริยะ

> **ระบบบัญชีส่วนตัวสำหรับนักพัฒนาฟรีแลนซ์**
> Evidence-first Accounting — ทุกตัวเลขต้องผูกกับหลักฐาน

---

## 🎯 Features

| Feature | Status |
|:--|:--:|
| ✅ บันทึกรายรับ / รายจ่าย / โอน / ส่วนตัว | Done |
| ✅ อัปโหลดสลิป — AI อ่านอัตโนมัติ (Gemini Flash) | Done |
| ✅ จัดหมวดอัตโนมัติ + ผูกโปรเจกต์ | Done |
| ✅ กันรายการซ้ำ 3 ระดับ | Done |
| ✅ Review Queue — ยืนยัน/แก้ไข/ปฏิเสธ | Done |
| ✅ Dashboard พร้อมกราฟ interactive (Recharts) | Done |
| ✅ Timeline รายรับ-รายจ่าย (วัน/สัปดาห์/เดือน/ปี) | Done |
| ✅ คำนวณภาษีเงินได้บุคคลธรรมดา (ขั้นบันไดภาษีไทย) | Done |
| ✅ หน้า Tax Calculator — วางแผนภาษีเต็มรูปแบบ | Done |
| ✅ Export CSV / Excel / Tax Summary | Done |
| ✅ Dark Mode | Done |
| ✅ Design Token System — เปลี่ยนธีมได้ทันที | Done |
| ✅ MCP Server — AI Agent เชื่อมต่อ query ข้อมูลได้ | Done |
| ❌ Login / Cloud / Multi-user | V1 ไม่ทำ |
| ❌ Banking API | V1 ไม่ทำ |

---

## 🧱 Stack

| Layer | Tech |
|:--|:--|
| Frontend | Next.js 16 + React 19 + Tailwind CSS v4 |
| Charts | Recharts (Area, Bar, Pie, Donut) |
| Icons | Lucide React |
| Backend | Python FastAPI |
| Database | SQLite (Offline First) |
| AI Slip Reader | Gemini 3.1 Flash Lite (Vision API) |
| MCP | fastapi-mcp (Streamable HTTP) |
| Export | CSV + Excel (openpyxl) |

---

## 🚀 Quick Start

```bash
# Terminal 1 — Backend (port 8000)
cd src/backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Frontend (port 3000)
cd src/frontend
npm install
npm run dev

# เปิด http://localhost:3000
```

> **ต้องการ AI อ่านสลิป:** ตั้ง `GEMINI_API_KEY` ใน `src/backend/.env`

---

## 🤖 MCP — AI Agent Integration

Ledger Inbox มี MCP Server ในตัว — AI อย่าง Claude, Cursor, ZCode เชื่อมต่อ query ข้อมูลบัญชีได้โดยตรง

```json
{
  "mcpServers": {
    "ledger-inbox": {
      "type": "streamable-http",
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

ดูไฟล์ `mcp.json` สำหรับ config สำเร็จรูป

---

## 📁 Project Structure

```
src/
├── backend/              # FastAPI (port 8000)
│   └── app/
│       ├── api/          # documents, transactions, projects, dashboard, categories, health
│       ├── agents/       # Business Agent (classify + dedup + review)
│       ├── services/     # Gemini, Classification, Dedup, Export, Tax, Upload Queue
│       ├── mcp_tools.py  # Custom MCP compound tools
│       ├── schemas/      # Pydantic models
│       └── db/           # SQLAlchemy models + SQLite
│
└── frontend/             # Next.js 16 (port 3000)
    └── src/
        ├── app/          # 5 pages: Dashboard, Inbox, Transactions, Projects, Tax
        ├── components/   # Layout, Forms, FileUpload, StatCard, QueueStatusBar
        │   └── ui/       # Design System: Button, Card, Badge, Skeleton, Input, Modal
        └── lib/          # API client + TypeScript types
```

---

## 🗺️ Architecture

```
Upload Slip → Gemini Vision API → Business Agent (classify + dedup) → Ledger (SQLite)
                                                    ↓
                                          Review Queue (ถ้า AI ไม่มั่นใจ)
                                                    ↓
                                          User ยืนยัน/แก้ไข
```

```
Dashboard ← Timeline API ← Aggregated transactions (day/week/month/year)
Tax Page  ← Tax Calculation API ← Progressive brackets + deductions
MCP       ← fastapi-mcp ← All REST endpoints auto-exposed as tools
```

---

## 🎨 Design System

เปลี่ยนธีมทั้งแอปได้จากการแก้แค่ CSS variables ใน `globals.css`:

```css
:root { --color-surface: #fff; --color-text: #1c1917; ... }
.dark { --color-surface: #0c0a09; --color-text: #fafaf9; ... }
```

Components ทั้งหมดใช้ semantic tokens — ไม่มี hardcoded สี

---

## 🧮 Tax Calculation

คำนวณภาษีเงินได้บุคคลธรรมดาตามขั้นบันไดภาษีไทย:
- 8 progressive brackets (0% – 35%)
- หักค่าใช้จ่ายอัตโนมัติ 50% (สูงสุด 100,000)
- ค่าลดหย่อนส่วนตัว 60,000
- รองรับค่าลดหย่อนเพิ่มเติม (ประกันสังคม, ประกันชีวิต, RMF/SSF, ฯลฯ)

ดูรายละเอียด: `src/backend/app/services/tax_service.py`

---

## ⚠️ Non-goals (V1)

- Offline First 100% — ข้อมูลทั้งหมดอยู่ในเครื่อง
- No SaaS — Desktop-first
- ไม่มีระบบ Login / Multi-user
- ไม่เชื่อมต่อ Banking API
- โปรเจกต์นี้เป็น Module ของ AI Personal Assistant ในอนาคต
