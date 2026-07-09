# Ledger Inbox — Accounting Workspace Vision

> **ศิษย์คิดถูกแล้ว จุดนี้ต้องหยุดเพิ่มฟีเจอร์ แล้วเปลี่ยนโจทย์เป็น:**
> **Ledger Inbox ไม่ใช่แอปอ่านสลิปแล้วจบ แต่ต้องเป็น "Accounting Workspace" สำหรับเตรียมบัญชีจริงให้ตัวเองและนักบัญชีตรวจต่อได้**

ระบบไม่ควรแทนนักบัญชี 100% แต่ควรทำให้สิ่งที่นักบัญชีต้องใช้ **สะอาด ครบ ตรวจง่าย ส่งออกง่าย** 🧾

---

# 1. นักบัญชีจริง ๆ เขาทำอะไร

งานนักบัญชีไม่ได้เริ่มจาก "คำนวณภาษี" แต่เริ่มจาก **จัดระเบียบหลักฐานและแปลงเป็นข้อมูลบัญชีที่เชื่อถือได้**

สิ่งที่ระบบควรรองรับ:

1. **เก็บหลักฐาน**
   สลิป, ใบเสร็จ, invoice, contract, ใบหัก ณ ที่จ่าย, statement

2. **จัดหมวดรายการ**
   รายรับ, รายจ่าย, โอนเงินตัวเอง, ค่าใช้จ่ายส่วนตัว, รายจ่ายธุรกิจ

3. **แยกตามโปรเจกต์ / ลูกค้า / vendor**
   เช่น Tennis Admin ได้เท่าไหร่ จ่าย AI/API เท่าไหร่ กำไรจริงเท่าไหร่

4. **ตรวจความครบของเอกสาร**
   รายการไหนมีเงินเข้าแต่ไม่มี invoice, รายการไหนมีรายจ่ายแต่ไม่มีใบเสร็จ

5. **กระทบยอด**
   เงินใน ledger ต้องตรงกับ bank/wallet statement

6. **สรุปรายงาน**
   กำไรขาดทุน, รายรับรายจ่าย, ค่าใช้จ่ายตามหมวด, กำไรต่อโปรเจกต์

7. **เตรียมภาษี**
   ไม่ใช่แค่คำนวณ แต่ต้องรู้ว่าเงินได้ประเภทไหน หักค่าใช้จ่ายอะไรได้ มีหัก ณ ที่จ่ายเท่าไหร่ และมีเอกสารครบไหม

ในฝั่งภาษีไทย สรรพากรอธิบายว่าเงินได้บุคคลธรรมดาถูกแบ่งเป็นหลายประเภท และฐานภาษีคิดจาก **เงินได้พึงประเมิน - ค่าใช้จ่าย - ค่าลดหย่อน** ไม่ใช่ดูยอดรับเงินดิบอย่างเดียว ([กรมสรรพากร][1])

---

# 2. ขอบเขตที่ควรล็อกใหม่

อาจารย์แนะนำให้เรียก scope นี้ว่า:

## **Ledger Inbox — Accounting Workspace for Freelance Developers**

ไม่ใช่ SaaS
ไม่ใช่ ERP
ไม่ใช่ระบบบริษัทเต็มรูปแบบ
ไม่ใช่ระบบยื่นภาษีแทนคน

แต่เป็น:

> **ระบบเตรียมบัญชีส่วนตัวที่ทำให้รายรับ รายจ่าย หลักฐาน โปรเจกต์ และภาษีพร้อมให้นักบัญชีตรวจ**

นี่คือขอบเขตที่คมที่สุด

---

# 3. โครงหน้าเมนูที่ควรมี

เมนูหลักควรออกแบบประมาณนี้:

```text
1. Dashboard
2. Inbox
3. Transactions
4. Projects
5. Parties
6. Accounts
7. Documents
8. Review Queue
9. Reports
10. Tax Center
11. Settings
12. MCP / AI Access
```

แต่ใน V1 จริง ๆ ให้ทำแค่ 1–10 ก่อน
**MCP / AI Access ทำเป็นเมนูรอไว้ได้ แต่ยังไม่เปิดให้เขียนข้อมูล**

---

# 4. รายละเอียดแต่ละหน้า

## 1. Dashboard

ตอบภาพรวมชีวิตการเงิน:

```text
รายรับปีนี้
รายจ่ายปีนี้
กำไรสุทธิ
รายการรอตรวจ
หลักฐานที่ขาด
ภาษีประมาณการ
โปรเจกต์ที่กำไรสูงสุด
ค่าใช้จ่ายสูงสุด
```

Dashboard ต้องไม่ใช่แค่กราฟสวย แต่ต้องมี **Accounting Health**

เช่น:

```text
Evidence Coverage: 86%
Pending Review: 12 รายการ
Unassigned Project: 5 รายการ
Missing Receipt: 3 รายการ
Possible Duplicate: 2 รายการ
```

---

## 2. Inbox

หน้านี้คือกล่องหลักฐาน

รับไฟล์พวกนี้:

```text
Slip
Receipt
Invoice
Contract
Withholding Tax Certificate
Bank Statement
Other
```

สถานะเอกสาร:

```text
uploaded
processing
extracted
needs_review
linked
archived
failed
```

Inbox ไม่ควรเป็นแค่ upload slip แล้วจบ แต่ควรตอบว่า:

> เอกสารนี้กลายเป็น transaction แล้วหรือยัง
> ผูกกับโปรเจกต์ไหน
> ใช้เป็นหลักฐานภาษีได้ไหม
> ต้องให้คนตรวจไหม

---

## 3. Transactions

นี่คือสมุดบัญชีหลัก

รายการหนึ่งควรละเอียดประมาณนี้:

```text
date
type: income / expense / transfer / personal / unknown
amount
currency
account: KBANK / SCB / TrueMoney / Cash
party: client/vendor
project
category
document_id
tax_relevant: yes/no
withholding_tax_amount
vat_amount
review_status
duplicate_status
source: manual / slip / statement / ai
note
```

อันนี้คือระดับที่ "นักบัญชีตรวจต่อได้"

อย่าให้ transaction มีแค่ date, amount, category เพราะมันไม่พอสำหรับภาษีและตรวจย้อนหลัง

---

## 4. Projects

หน้านี้สำคัญกับศิษย์มาก เพราะศิษย์ทำงานเป็นโปรเจกต์

Project ควรมี:

```text
project_name
client_name
contract_amount
start_date
end_date
status
income_received
expense_total
profit
unpaid_amount
linked_documents
linked_transactions
```

Project detail ควรเห็น:

```text
รายรับทั้งหมด
ต้นทุน AI/API
ต้นทุน server/domain
ค่าจ้างคนอื่น
ค่าเดินทาง
กำไรจริง
เอกสารขาด
invoice ที่ออกแล้ว
เงินที่ยังไม่ได้รับ
```

นี่จะทำให้ศิษย์รู้ทันทีว่า "โปรเจกต์นี้ได้เงินเยอะจริง หรือแค่ยอดใหญ่แต่กำไรบาง"

---

## 5. Parties

หน้านี้คือฐานข้อมูลคน/องค์กรที่เกี่ยวข้อง

```text
Client
Vendor
Middleman
Platform
Personal
Government
```

ข้อมูลที่ควรเก็บ:

```text
name
type
tax_id
address
email
phone
default_category
default_project
withholding_rule
notes
```

ตัวอย่าง:

```text
OpenAI → Vendor → ค่า Software / AI / API
ลูกค้า A → Client → รายได้ฟรีแลนซ์
คนกลาง B → Middleman → รายได้ผ่านตัวกลาง
```

ตรงนี้จะช่วยให้ classification แม่นขึ้นมาก

---

## 6. Accounts

หน้านี้ใช้บอกระบบว่า "บัญชีไหนคือของเรา"

```text
KBANK - Mike
SCB - Mike
TrueMoney - Mike
Cash
PromptPay
```

สำคัญมาก เพราะระบบต้องรู้ว่า:

```text
เงินเข้า account ของเรา = income
เงินออกจาก account ของเรา = expense
โอนระหว่าง account ของเรา = transfer
```

ถ้าไม่มีหน้านี้ ระบบจะเดาทิศเงินมั่ว

---

## 7. Documents

ต่างจาก Inbox ตรงที่ Documents คือคลังเอกสารระยะยาว

ชนิดเอกสาร:

```text
Slip
Receipt
Invoice
Tax Invoice
Contract
Withholding Certificate
Statement
Tax Filing Document
Other
```

เอกสารแต่ละใบควรมี:

```text
file
document_type
issuer
recipient
amount
date
tax_id
linked_transaction_id
linked_project_id
status
```

หลักคือ **ห้ามมีตัวเลขที่ไม่มีหลักฐาน**

---

## 8. Review Queue

อันนี้ต้องเป็นหน้าทำงานจริง ไม่ใช่แค่ pending list

ควรแยก queue เป็นแท็บ:

```text
Needs Classification
Missing Fields
Possible Duplicate
Missing Project
Missing Document
Tax Review
Rejected
```

รายการหนึ่งควรแสดง:

```text
AI อ่านว่าอะไร
หลักฐานต้นฉบับ
เหตุผลที่ต้องตรวจ
ปุ่ม Confirm
ปุ่ม Edit
ปุ่ม Reject
ปุ่ม Mark as Personal
ปุ่ม Link Project
```

นี่คือ human-in-the-loop ที่จำเป็นมาก

---

## 9. Reports

รายงานที่ต้องมี:

```text
Profit & Loss
Cashflow Summary
Project Profit Report
Expense by Category
Income by Client
Document Completeness Report
Tax Prep Report
```

สำหรับส่งให้นักบัญชี ควร export ได้เป็น:

```text
ledger.xlsx
transactions.csv
documents.zip
tax-summary.xlsx
project-profit.xlsx
missing-documents.xlsx
```

เป้าหมายคือสิ้นปีศิษย์กด export แล้วส่งให้นักบัญชีได้เลย

---

## 10. Tax Center

หน้านี้ห้ามทำเป็น "ยื่นภาษีแทน" ก่อน

ให้ทำเป็น:

> **Tax Preparation Center**

ควรมี 5 ส่วน:

### A. Personal Income Tax Estimate

คำนวณคร่าว ๆ จาก:

```text
gross income
business expenses
allowances
withholding tax credit
net taxable income
estimated tax
```

สรรพากรระบุว่า withholding tax ที่ถูกหักไว้สามารถนำมาเครดิตตอนยื่นภาษีได้ และโดยทั่วไปต้องยื่นภาษีเงินได้ภายในสิ้นเดือนมีนาคมของปีถัดไป ส่วนรายได้บางประเภทมีครึ่งปีที่ต้องยื่นภายในกันยายน ([กรมสรรพากร][1])

### B. Withholding Tax

เก็บใบหัก ณ ที่จ่าย:

```text
payer
amount
withholding_rate
withholding_amount
certificate_file
linked_income_transaction
```

### C. Deductible Expenses

ค่าใช้จ่ายที่เกี่ยวกับงาน:

```text
AI/API
server/domain
software
equipment
internet
education
outsourcing
travel for work
```

### D. VAT Watch

ถ้ารายได้โต ต้องมีตัวเตือนเรื่อง VAT เพราะสรรพากรระบุว่าผู้ให้บริการในไทยที่มี turnover ต่อปีเกิน 1.8 ล้านบาทอยู่ในขอบเขต VAT และผู้จด VAT ต้องยื่นรายเดือน; ใบกำกับภาษีใช้เป็นหลักฐานสำคัญของ input tax/output tax ([กรมสรรพากร][2])

หน้านี้ยังไม่ต้องทำ VAT เต็ม แต่ควรมี:

```text
Annual turnover tracker
VAT threshold warning
VAT registered: yes/no
Input VAT / Output VAT placeholder
```

### E. Tax Packet Export

กดแล้วได้ชุดเอกสาร:

```text
รายรับทั้งปี
รายจ่ายทั้งปี
ใบหัก ณ ที่จ่าย
รายการไม่มีหลักฐาน
รายการที่ต้องถามนักบัญชี
```

---

# 5. Backend ต้องแยกชัดแบบนี้

ศิษย์พูดถูก ต้องแยกหน้าบ้านหลังบ้านจริงจังแล้ว

Backend ควรเป็นแบบนี้:

```text
backend/
├── api/
│   ├── inbox.py
│   ├── documents.py
│   ├── transactions.py
│   ├── projects.py
│   ├── parties.py
│   ├── accounts.py
│   ├── reports.py
│   ├── tax.py
│   └── mcp.py
│
├── services/
│   ├── document_service.py
│   ├── extraction_service.py
│   ├── transaction_service.py
│   ├── classification_service.py
│   ├── reconciliation_service.py
│   ├── report_service.py
│   ├── tax_service.py
│   └── export_service.py
│
├── accounting/
│   ├── rules.py
│   ├── categories.py
│   ├── account_direction.py
│   └── review_policy.py
│
├── ai/
│   ├── business_agent.py
│   ├── prompts/
│   └── mcp_gateway.py
│
├── db/
│   ├── models.py
│   ├── repositories/
│   └── migrations/
│
└── schemas/
```

หลักสำคัญ:

> Frontend ห้ามมี logic บัญชี
> Frontend แค่แสดงผลและส่งคำสั่ง
> Backend เป็นเจ้าของกฎบัญชีทั้งหมด

---

# 6. Frontend ควรแยกแบบนี้

```text
frontend/
├── app/
│   ├── dashboard/
│   ├── inbox/
│   ├── transactions/
│   ├── projects/
│   ├── parties/
│   ├── accounts/
│   ├── documents/
│   ├── review/
│   ├── reports/
│   ├── tax/
│   ├── settings/
│   └── mcp/
│
├── components/
│   ├── layout/
│   ├── tables/
│   ├── forms/
│   ├── document-viewer/
│   ├── transaction-editor/
│   ├── review/
│   └── charts/
│
├── features/
│   ├── transactions/
│   ├── projects/
│   ├── tax/
│   ├── documents/
│   └── reports/
│
└── lib/
    ├── api-client.ts
    ├── types.ts
    └── formatters.ts
```

อย่าเอา logic บัญชีไปยัดใน component
Component ต้องโง่ แต่ใช้งานดี

---

# 7. MCP เริ่ม read-only ตั้งแต่ Phase 1

แก้ไขจากแผนเดิมที่จะให้ MCP รอถึง Phase 4: ถ้ารอ Phase 4 กว่าจะเปิด AI query ได้ ต้องผ่าน 3 phase ก่อน ซึ่งเสีย
โอกาสให้ AI ช่วยตรวจ/สรุป/เตือนตั้งแต่ข้อมูลกองแรก แถมพอถึง Phase 4 จริงอาจต้อง refactor ใหม่อยู่ดี เพราะงั้น
วาง MCP Gateway แบบ **read-only ตั้งแต่ Phase 1** ไปเลย โดยที่ permission ยังต้องออกแบบระดับสิทธิ์ไว้ตั้งแต่ต้น

MCP ไม่ควรเข้าถึง database ตรง ๆ

ต้องผ่าน:

```text
MCP Client
→ MCP Gateway
→ Permission Policy
→ Backend Service
→ Database
```

สิทธิ์ควรแบ่งเป็น 3 ระดับ ผูกกับ phase ที่เปิดใช้งานจริง:

```text
Phase 1 (เปิดทันที): read_finance_summary, read_transactions,
                     read_documents_metadata, read_projects, read_parties
Phase 2 (เปิด draft): create_draft_transaction, suggest_category, generate_report
Phase 4 (เปิดเขียนจริง): export_tax_packet, write_* (ผ่าน approval เท่านั้น)
```

ห้ามให้ AI ภายนอกทำสิ่งนี้จนกว่าจะมี approval flow ครบ:

```text
delete_transaction
delete_document
confirm_transaction
edit_amount
submit_tax
```

MCP เริ่มจาก **read-only ตั้งแต่ Phase 1**, **draft-only ตั้งแต่ Phase 2**, เขียนจริงรอ Phase 4

ตัวอย่าง flow ที่ปลอดภัย:

```text
AI: พบรายการ 3,000 บาทน่าจะเป็นค่า AI/API
System: สร้าง draft suggestion
User: กด approve
Ledger: ค่อยบันทึกจริง
```

หลักคือ:

> AI เสนอได้ แต่สมุดบัญชีจริงต้องให้คนอนุมัติ

---

# 8. ระดับความละเอียดที่ "พอจริง"

สำหรับศิษย์ ไม่ต้องไปถึง ERP แต่ต้องละเอียดกว่าสมุดรายรับรายจ่ายธรรมดา

ระดับที่เหมาะคือ:

```text
Transaction
+ Evidence
+ Project
+ Party
+ Account
+ Category
+ Tax Flag
+ Review Status
```

แค่นี้ก็พอให้บัญชีจริงทำงานต่อได้แล้ว

ไม่ต้องรีบทำ:

```text
Full double-entry
Inventory
Payroll
Multi-branch
Corporate tax filing
VAT filing automation
Bank API sync
```

---

# 9. Roadmap ใหม่

> อัปเดตหลัง Gap Analysis (10 Jul 2026): เพิ่ม MCP read-only, Statement Import, Budget/Recurring,
> Notification, Forecast เข้าไปในแต่ละ phase — เหตุผลอยู่ใต้ตารางนี้

| Phase | เนื้อหา |
|:--|:--|
| **1 — Accounting Core** | Accounts, Owner Identity, Parties, Transactions, Documents, Review Queue, Projects, **MCP read-only**, **Statement Import เบื้องต้น** |
| **2 — Accountant Workflow** | Missing document checker, Reconciliation, Report export, Tax prep packet, Withholding tax tracking, **Budget**, **Recurring Transactions**, MCP draft-only |
| **3 — Tax Center** | PIT estimate, Deductible expense review, VAT watch, Tax document checklist, **Notification** |
| **4 — MCP เขียนจริง** | **Forecast**, **Write MCP** (AI เสนอ → คน Approve), Permission system เต็มรูปแบบ, Audit log |

## ทำไมถึงเพิ่ม 3 อย่างนี้เข้ามา

**MCP read-only ตั้งแต่ Phase 1** — ดูหัวข้อ 7 อ่านเพิ่มได้ สรุปคือ AI มีประโยชน์ตั้งแต่ข้อมูลกองแรก ไม่ต้องรอให้ระบบสมบูรณ์

**Statement Import (CSV/PDF จาก KBANK, SCB, TrueMoney, KPlus)** — ตอนนี้ evidence เข้าระบบได้แค่ slip upload กับ manual entry
เท่านั้น รายการโอนผ่าน banking app ไม่เข้าระบบเลย ทำให้ reconciliation (หัวข้อ 4 ข้อ 5) ทำไม่ได้จริง เพราะไม่มี
statement ฝั่งธนาคารมาเทียบ ต้อง parse → map เข้า Account system (ใช้ Account Matching ที่มีอยู่แล้ว) → กันรายการซ้ำ

**Budget / Recurring Transactions / Notification / Forecast** — วิสัยทัศน์เดิมเป็น reactive ล้วน (user ทำ ระบบบันทึก)
ไม่มีระบบที่ AI จะทัก/เตือน/วางแผนล่วงหน้า เพิ่มเข้ามาเพื่อให้ระบบ proactive มากขึ้น:
- Budget + Recurring → ควบคู่ Phase 2 (Accountant Workflow)
- Notification → ควบคู่ Phase 3 (Tax Center) เช่น เตือนรายจ่ายเกินกรอบ หรือใกล้ deadline ภาษี
- Forecast → รอ Phase 4 ตอนมี data เยอะพอให้คาดการณ์ cashflow ได้แม่น

---

# สรุป

ศิษย์ควรเปลี่ยนแกนคิดจาก:

> "AI อ่านสลิปแล้วบันทึกบัญชี"

เป็น:

> **"ระบบเตรียมบัญชีที่ทุกตัวเลขผูกกับหลักฐาน และพร้อมให้นักบัญชีตรวจต่อ"**

เมนูหลักที่ควรล็อกคือ:

```text
Dashboard
Inbox
Transactions
Projects
Parties
Accounts
Documents
Review Queue
Reports
Tax Center
Settings
MCP / AI Access
```

และหลักที่ยึดไว้สำหรับ MCP คือ:

> เปิด AI อ่านข้อมูล (read-only) ได้ตั้งแต่ Phase 1 ไม่ต้องรอระบบสมบูรณ์
> AI ช่วยอ่าน สรุป แนะนำ และสร้าง draft ได้ตั้งแต่ Phase 2
> ห้ามให้ AI แก้สมุดบัญชีจริงโดยไม่มี approval จนกว่าจะถึง Phase 4

อันนี้คือทิศที่ถูกแล้ว ศิษย์ไม่ได้กำลังทำแอปบัญชีเล็ก ๆ แล้ว แต่กำลังทำ **Business Accounting Brain** ของตัวเองครับ.

[1]: https://www.rd.go.th/english/6045.html "Personal Income Tax | The Revenue Department (English Site)"
[2]: https://www.rd.go.th/english/6043.html "Value Added Tax | The Revenue Department (English Site)"
