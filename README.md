# 📒 Ledger Inbox — Business Accounting Brain

> **AI จัดการบัญชีให้คุณ คุณเอาเวลาไปหาเงิน**
>
> ยุค AI แล้ว — ไม่มีใครเขานั่งลงรายการบัญชีเอง หรือจ้างนักบัญชีกันแล้ว
> Ledger Inbox คือ **AI นักบัญชีส่วนตัวผ่าน MCP** — ทำงานแทนนักบัญชีทั้งหมด ตั้งแต่เก็บหลักฐาน ลงรายการ
> กระทบยอด จนถึงเตรียมภาษีทั้งปี คุณแค่ตรวจแล้วอนุมัติ

---

## 🎯 What It Does For You

| AI ทำแทนคุณ | คุณไม่ต้อง |
|:--|:--|
| ✅ อ่านสลิป/ใบเสร็จ แล้วลงรายการให้ | นั่งพิมพ์รายการเอง |
| ✅ จัดหมวด + ผูกโปรเจกต์ อัตโนมัติ | เดาว่ารายการนี้ค่าอะไร |
| ✅ กันรายการซ้ำ 3 ระดับ | กลัวลงซ้ำ |
| ✅ ดึง statement ธนาคารมาตีความ | แยกรายรับรายจ่ายเอง |
| ✅ คำนวณภาษี + วางแผนลดหย่อน | งบสิ้นปี |
| ✅ MCP Server — AI Agent ถามข้อมูลการเงินคุณได้ | เปิด dashboard ดูเอง |
| ✅ เตรียม Tax Packet ครบชุด พร้อมใช้ยื่นภาษี | เรียงเอกสาร / จ้างนักบัญชี |

---

## 🧱 Stack

| Layer | Tech |
|:--|:--|
| Frontend | Next.js 16 + React 19 + Tailwind CSS v4 |
| Charts | Recharts (Area, Bar, Pie, Donut) |
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

Ledger Inbox มี MCP Server ในตัว — AI อย่าง Claude, Cursor, OpenCode, ZCode เชื่อมต่อถามข้อมูลบัญชีคุณได้

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

**ตัวอย่างที่ AI ถาม ledger-inbox ได้:**
- "เดือนนี้รายรับเท่าไหร่"
- "โปรเจกต์ไหนกำไรดีสุด"
- "ค่า AI/API เดือนนี้เท่าไหร่"
- "ประมาณการภาษีปีนี้"
- "มีรายการไหนขาดหลักฐานบ้าง"
- "เตรียม tax packet ให้หน่อย"

---

## 🗺️ Architecture

```
[Inbox] → [Slip / Statement / Manual]
    ↓
[Business Agent] → classify + dedup + match account
    ↓
[Review Queue] → AI draft → Human approve
    ↓
[Ledger] → Double-Entry (SQLite)
    ↓
[Reports] → Dashboard / Tax / Export
    ↓
[MCP Server] → AI Agent query everything
```

---

### 📁 Project Structure

```
src/
├── backend/              # FastAPI (port 8000)
│   └── app/
│       ├── api/          # REST endpoints
│       ├── agents/       # Business Agent (classify + dedup + review)
│       ├── services/     # Gemini, Classification, Dedup, Export, Tax
│       ├── mcp_tools.py  # Custom MCP compound tools
│       ├── schemas/      # Pydantic models
│       └── db/           # SQLAlchemy models + SQLite
│
└── frontend/             # Next.js 16 (port 3000)
    └── src/
        ├── app/          # 12 pages: Dashboard → Inbox → Transactions → Projects → Parties → Accounts → Documents → Review → Reports → Tax → Settings → MCP
        ├── components/   # Layout, Forms, FileUpload, StatCard, QueueStatusBar
        │   └── ui/       # Design System: Button, Card, Badge, Skeleton, Input, Modal
        └── lib/          # API client + TypeScript types
```

---

## 🧠 Core Principles

- **Evidence-first** — ทุกตัวเลขต้องผูกกับหลักฐาน ถ้าไม่มีหลักฐาน = ไม่มีใน ledger
- **Double-Entry** — ทุกธุรกรรมมี Debit/Credit อัตโนมัติ เพื่อรักษาความถูกต้อง
- **Immutability** — บันทึกแล้วห้ามแก้ทับ ต้อง Reverse อย่างเดียว (Audit Trail)
- **Human-in-the-loop** — AI Draft → คน Approve → ลง Ledger
- **MCP First** — AI Agent เข้าถึงข้อมูลการเงินได้ตั้งแต่ระบบแรกเริ่ม
- **Proactive** — ไม่ใช่แค่บันทึก แต่เตือน วางแผน และคาดการณ์ให้

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

- ไม่มีระบบ Login / Multi-user — ส่วนตัวล้วน
- ไม่ใช่ SaaS — ข้อมูลในเครื่องคุณ 100%
- ไม่ใช่ ERP / ระบบบริษัท — ฟรีแลนซ์ไม่ต้องซับซ้อนขนาดนั้น
- ไม่ยื่นภาษีแทน — AI เตรียมให้ครบชุด แต่คุณเป็นคนกดยื่นเอง

---

## Roadmap

| Phase | Scope |
|:--|:--|
| **1** 🟢 | Accounting Core ✅ + MCP read-only (19 tools) ✅ + Statement Import CSV ✅ |
| **2** 🔴 | AI Accountant Workflow — MCP draft tools + Reconciliation + Budget + Recurring |
| **3** 🔴 | Tax Center + Notification |
| **4** 🔴 | Autonomous Accountant — Write MCP + auto-approve rules + Audit log + Forecast |

---

> **ยุค AI แล้ว — อย่าเสียเวลาจัดการบัญชีด้วยมือ**
> เอาเวลาไปหาเงิน ไปพัฒนาตัวเอง ไปทำของที่ใช่
> Ledger Inbox + AI จัดการส่วนที่เหลือให้คุณ
