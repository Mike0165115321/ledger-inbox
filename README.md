# 📒 Ledger Inbox — กล่องบัญชีอัจฉริยะ

> **โปรเจคบัญชีส่วนตัวสำหรับนักพัฒนาฟรีแลนซ์**
> Evidence-first Accounting — ทุกตัวเลขต้องผูกกับหลักฐาน

---

## แก่นของโปรเจค

ไม่ใช่แอพบัญชี — คือ **Developer Business OS**

ระบบที่ตอบคำถามพวกนี้ให้ได้:
- แต่ละโปรเจกต์ ได้เงินเท่าไหร่ จ่ายไปเท่าไหร่ เหลือกำไรจริงเท่าไหร่
- ปีนี้รายได้รวมเท่าไหร่ ค่า AI/API/Server/Domain หมดไปเท่าไหร่
- รายการไหนยังไม่มีหลักฐาน รายการไหนยังไม่รู้หมวด
- ใกล้ถึงเกณฑ์ภาษีหรือยัง เตรียมข้อมูลยื่นภาษีได้ไหม

## V1

**Ledger Agent ตัวเดียว — 6 อย่าง:**
- ✅ เก็บรายรับ
- ✅ เก็บรายจ่าย
- ✅ แนบสลิป
- ✅ จัดหมวด
- ✅ ผูกโปรเจกต์
- ✅ สรุปกำไร

**ไม่ทำ:** Login, Cloud, Multi-user, Banking API, Tax Filing, Dashboard หรู

## Stack

| Layer | Tech |
|:--|:--|
| Frontend | Next.js / React |
| Backend | Node.js / Fastify / Hono |
| Database | SQLite (Offline First) |
| AI | Vision model API |
| Desktop | Tauri / Electron (phase 2) |

## Roadmap

| Week | Focus |
|:--|:--|
| 1 | Core Ledger — ยังไม่มี AI ก็ใช้จดบัญชีได้ |
| 2 | AI Extraction — Vision API อ่านสลิป |
| 3 | Classification + Review — จัดหมวดอัตโนมัติ |
| 4 | Reports — Export + Tax Summary |

---

## ทำไมถึงอยู่ GitHup ไม่ใช่ Aetox

เพราะโปรเจคนี้คือ **แอปพลิเคชัน** (Desktop App + Database + Agent) ไม่ใช่ AI skill หรือ agent component
และจะ push ขึ้น GitHub (`Mike0165115321/ledger-inbox`) เมื่อพร้อม
