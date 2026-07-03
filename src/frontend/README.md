# Ledger Inbox — Frontend

Next.js 16 + React 19 + Tailwind CSS v4

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | กราฟ + สรุปการเงิน + Timeline |
| `/inbox` | Inbox | อัปโหลดสลิป — Gemini อ่านอัตโนมัติ |
| `/transactions` | Transactions | ตารางรายรับ/รายจ่าย + filter/sort/pagination |
| `/projects` | Projects | จัดการโปรเจกต์ + ผลประกอบการ |
| `/tax` | Tax | เครื่องคิดเลขภาษี — ขั้นบันไดภาษีไทย |

## Tech

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS v4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Design System:** Semantic Design Tokens (`globals.css`)
- **Dark Mode:** ✅

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout + fonts
│   ├── globals.css       # Design tokens + themes
│   ├── page.tsx          # Dashboard
│   ├── inbox/page.tsx    # Document inbox
│   ├── transactions/page.tsx
│   ├── projects/page.tsx
│   └── tax/page.tsx
├── components/
│   ├── Layout.tsx        # Sidebar + nav
│   ├── StatCard.tsx      # Dashboard stat cards
│   ├── FileUpload.tsx    # Drag & drop upload
│   ├── QueueStatusBar.tsx # Gemini queue status
│   ├── TransactionForm.tsx
│   ├── ProjectForm.tsx
│   └── ui/               # Design System
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       ├── Input.tsx
│       └── Modal.tsx
└── lib/
    └── api.ts            # API client + TypeScript types
```
