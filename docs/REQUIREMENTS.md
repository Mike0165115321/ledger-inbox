# 📒 Ledger Inbox — Requirements

> **สิ่งที่ต้องการ: ระบบบัญชีส่วนตัวสำหรับนักพัฒนาฟรีแลนซ์**
> Evidence-first Accounting — ทุกตัวเลขต้องผูกกับหลักฐาน
> kickoff: 3 Jul 2026

---

## 1. Project Identity

| Item | Detail |
|:--|:--|
| **Name** | Ledger Inbox (กล่องบัญชีอัจฉริยะ — ชื่อชั่วคราว) |
| **Core Concept** | Evidence-first Accounting — ทุกตัวเลขต้องผูกกับหลักฐาน |
| **Tagline** | บัญชีสำหรับฟรีแลนซ์ที่ขี้เกียจทำบัญชี แต่ไม่อยากหลงตัวเลขกำไรของตัวเอง |
| **Target Users** | Freelance devs, online workers, AI/API users |
| **Philosophy** | AI ช่วยกรอก แต่คนยืนยัน |
| **Long-term Vision** | Module ของ AI Personal Assistant ที่ดูแลชีวิตการทำงานทั้งหมด |
| **ไม่ใช่แอปบัญชี** | — คือ **Developer Business OS** และควรเป็น **Module** ของ AI Assistant ส่วนตัว |

---

## 2. V1 Scope

### ทำใน V1

- ✅ เก็บรายรับ
- ✅ เก็บรายจ่าย
- ✅ แนบสลิป
- ✅ จัดหมวด
- ✅ ผูกโปรเจกต์
- ✅ สรุปกำไร

### ไม่ทำใน V1

- ❌ Login / User / Multi-user
- ❌ Cloud / Subscription
- ❌ API ธนาคาร / Wallet
- ❌ Tax filing (มีแค่ Tax Summary)
- ❌ Multi-agent (มีแค่ Business Agent ตัวเดียว)
- ❌ Dashboard หรูเกินจำเป็น
- ❌ Predictive finance
- ❌ OCR เองทั้งหมด (ใช้ Vision API)

### Form Factor

- **Desktop App (Offline First)**
- Database: SQLite — ข้อมูลทั้งหมดอยู่ในเครื่อง ไม่ต้องอัปโหลด cloud
- MVP แรกทำ Web Local ก่อนง่ายกว่า
- ระยะต่อไป → Tauri หรือ Electron ห่อเป็น Desktop App

---

## 3. Transaction Types

| Type | Description |
|:--|:--|
| Income | รายรับ |
| Expense | รายจ่าย |
| Transfer | โอนระหว่างบัญชีตัวเอง |
| Personal | ค่าใช้จ่ายส่วนตัว |
| Unknown | ยังไม่แน่ใจ |

---

## 4. Key Questions ที่ระบบต้องตอบ

- ปีนี้ได้เงินรวมเท่าไหร่
- แต่ละโปรเจกต์ได้เงินเท่าไหร่
- แต่ละโปรเจกต์มีต้นทุนเท่าไหร่
- กำไรจริงเหลือเท่าไหร่
- ค่า AI/API/Server/Domain หมดไปเท่าไหร่
- รายรับไหนยังไม่มีหลักฐาน
- รายจ่ายไหนยังไม่รู้หมวด
- รายได้ทั้งปีเข้าใกล้เกณฑ์ภาษีหรือยัง
- เตรียมสรุปให้ยื่นภาษีได้ไหม

---

## 5. Roadmap

| Week | Focus | Goal |
|:--|:--|:--|
| Week 1 | Core Ledger | สร้าง project, เพิ่ม transaction, อัปโหลดสลิป, Dashboard พื้นฐาน — **ยังไม่มี AI ก็ใช้จดบัญชีได้** |
| Week 2 | AI Extraction | Slip Reader: Qwen3-VL ทดสอบ + เริ่ม pipeline |
| Week 3 | Classification + Review | จัดหมวด, ผูกโปรเจกต์, กันรายการซ้ำ, Review Queue |
| Week 4 | Reports | รายงานเดือน/ปี, กำไรต่อโปรเจกต์, Export CSV/Excel, Tax Summary |

---

## 6. Go-to-Market Strategy

- **ห้ามขายใน 6 เดือนแรก** — สร้างให้ตัวเองใช้ก่อน
- หลังจากใช้จริง 6 เดือน → รู้ pain point จริง → V2 จะโหด
- กลุ่มเป้าหมาย: Freelance, นักพัฒนา, คนรับงานออนไลน์, คนใช้ AI/API ทำงาน

---

## 7. Non-goals (General)

- **Offline First 100%** — ข้อมูลส่วนตัวทั้งหมด ไม่ต้องอัปโหลด cloud
- **No SaaS** — เป็น Desktop App ที่ทำงานในเครื่อง
- โปรเจกต์นี้ควรเป็น **Module** ของ AI Personal Assistant ในอนาคต (ไม่ใช่โปรแกรมแยก)
