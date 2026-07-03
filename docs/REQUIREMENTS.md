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
- ❌ Predictive finance

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

## 5. Current Features (Implemented)

- **Core Ledger:** จัดการ Project, สร้าง Transaction, หน้า Dashboard และสรุป Timeline
- **AI Extraction:** สแกนสลิปโอนเงินด้วย Gemini Vision API และดึงข้อมูลอัตโนมัติ (Slip Reader)
- **Classification & Review:** จัดหมวดหมู่, ผูก Project, ตรวจสอบรายการซ้ำ และรวมคิวตรวจสอบ (Review Queue) ไว้ใน Inbox
- **Tax & Reports:** คำนวณภาษีเงินได้เบื้องต้น (Tax Calculation)
- **MCP Server:** รองรับการเชื่อมต่อกับ AI Agents ภายนอก (เช่น Claude, ZCode) เพื่ออ่าน/เขียนข้อมูลบัญชีได้โดยตรง

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

---

## 8. Accounting Core (สิ่งที่ต้อง Mirror จากหลักการบัญชี)

หน้าที่หลักของ "นักบัญชี" ที่ซอฟต์แวร์ต้อง mirror มีดังนี้:

1. **รับข้อมูลดิบเข้าระบบ (Capture / Inbox)**
   ส่วนที่ตรงกับชื่อ repo — "Inbox" คือจุดที่ธุรกรรมดิบ (raw transactions) เข้ามาก่อนถูกจัดหมวดหมู่ เช่น statement ธนาคาร, ใบเสร็จ, invoice ที่ scan มา ยังไม่ผ่านการตัดสินใจว่าจะลงบัญชีอย่างไร
2. **ผังบัญชี (Chart of Accounts)**
   โครงสร้างหมวดบัญชีทั้งหมด (สินทรัพย์ หนี้สิน ทุน รายได้ ค่าใช้จ่าย) — เป็นกระดูกสันหลังที่ทุกธุรกรรมต้อง map เข้าไป
3. **บัญชีคู่ (Double-Entry Bookkeeping)**
   หัวใจของระบบบัญชีจริง — ทุกรายการต้อง debit = credit เสมอ ถ้า engine ไม่บังคับกฎนี้ มันจะไม่ใช่ "ระบบบัญชี" แต่เป็นแค่ tracker ธรรมดา
4. **สมุดรายวัน → บัญชีแยกประเภท (Journal Entries → General Ledger)**
   รายการที่ผ่านการจัดหมวดจาก inbox แล้ว จะถูก post เข้า ledger จริง พร้อม timestamp, reference, และต้อง immutable (แก้ไขย้อนหลังไม่ได้ ต้องทำ reversing entry แทน) เพื่อรักษา audit trail (ร่องรอยการตรวจสอบ)
5. **การกระทบยอด (Reconciliation)**
   เทียบข้อมูลใน ledger กับ statement จริงจากธนาคาร เพื่อจับความคลาดเคลื่อน — เป็นจุดที่ระบบ "นักบัญชี" อัตโนมัติส่วนใหญ่มักไปสะดุด เพราะการ matching อัตโนมัติ (rule-based หรือ ML) ทำได้ไม่ 100%
6. **ปิดงวดบัญชี (Period Closing)**
   ล็อกงวดที่ปิดแล้วไม่ให้แก้ไข และ carry balance ไปงวดถัดไป
7. **รายงานทางการเงิน (Financial Statements)**
   งบกำไรขาดทุน (P&L), งบดุล (Balance Sheet), งบกระแสเงินสด (Cash Flow) — ต้อง generate ได้จาก ledger โดยตรง ไม่ใช่คำนวณแยกต่างหาก

