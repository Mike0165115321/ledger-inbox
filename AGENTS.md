# Ledger Inbox — Project Agents

> แต่ละตัวมีหน้าที่ชัดเจน — Handoff, not overlap

---

## 🤖 Agent Registry

| Agent | Scope | Primary Stack | Role |
|-------|:------|:--------------|:-----|
| `frontend.md` 🔵 | UI, components, layout, state management, API routes | TypeScript / Next.js / Tailwind | หน้าจอทั้งหมด + UX |
| `backend-py.md` 🟣 | AI pipeline, Vision OCR, transaction logic, SQLite, export | Python / FastAPI / SQLAlchemy | Business logic + AI |

---

## 👥 Active Agents

| Agent | Status | Task | Started | Updated |
|-------|:------:|------|---------|---------|
| — | ⚪ | — | — | — |

**Status:** 🟢 working | 🟡 waiting | 🔴 blocked | ⚪ idle

---

## ✅ Completed

```
[agent] [task] → [commit] [time]
```

---

## 🔄 Handoffs

```
[from] → [to]: [reason] [time]
```

---

## 📋 Decisions

```
[date] [decision]
  Reason: [why]
  By: [agent]
```

---

## 🎯 Agent Scopes

### frontend.md

| ทำ | ไม่ทำ |
|:--|:--|
| ✅ UI components & pages | ❌ AI processing logic |
| ✅ Next.js API routes (proxy) | ❌ Database schema |
| ✅ Layout, styling, Tailwind | ❌ Vision API integration |
| ✅ Client state management | ❌ Transaction classification |
| ✅ Loading/error/empty states | ❌ Export engine |
| ✅ Inbox, Dashboard, Review UI | |

### backend-py.md

| ทำ | ไม่ทำ |
|:--|:--|
| ✅ Vision API — อ่านสลิป | ❌ UI components |
| ✅ Transaction classification | ❌ Client-side state |
| ✅ SQLite — schema + queries | ❌ Layout/styling |
| ✅ Dedup + review logic | |
| ✅ กำไรต่อโปรเจกต์ + สรุป |
| ✅ CSV/Excel Export |
| ✅ Tax Summary |

---

## 🚫 Anti-patterns

- **Agent overlap:** สอง agent แก้ไฟล์เดียวกันใน session เดียวกัน
- **Silent assumption:** คิดว่าอีกตัวจะ "figure it out" เอง
- **No exit report:** ทำงานเสร็จแต่ไม่ log → context หาย
- **Scope creep:** "ขอทำนิดเดียว" นอก scope → slope

---

## 📁 File Structure Convention

```
src/
  frontend/         # frontend.md territory
  backend/          # backend-py.md territory
    agents/         # Business Agent logic
  shared/           # types / schemas
docs/
tests/
assets/
```
