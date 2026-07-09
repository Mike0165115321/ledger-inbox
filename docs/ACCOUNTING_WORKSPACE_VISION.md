# Ledger Inbox — AI Personal Accountant Vision

> **อัปเดตทิศทางครั้งใหญ่ (10 Jul 2026): เปลี่ยนโจทย์อีกรอบ —**
> **Ledger Inbox ไม่ใช่แค่ workspace เตรียมบัญชีให้นักบัญชีตรวจ แต่ต้องเป็น "AI นักบัญชีส่วนตัว" ที่ทำงานแทนนักบัญชีทั้งหมด ผ่าน MCP**

เป้าหมายคือ **แทนนักบัญชี** — AI ทำทุกงานที่นักบัญชีทำ (จัดหมวด ตรวจหลักฐาน กระทบยอด เตรียมภาษี แนะนำ)
โดยเจ้าของเงินยังเป็นคนอนุมัติขั้นสุดท้าย เหมือนเซ็นรับงานจากนักบัญชี 🧾

หัวใจของระบบจึงย้ายจาก "หน้า UI" ไปอยู่ที่ **MCP Gateway** — ชุดเครื่องมือที่ทำให้ AI ตัวไหนก็ได้
(Claude ฯลฯ) ต่อเข้ามาทำหน้าที่นักบัญชีของเราได้ทันที ส่วน UI คือโต๊ะทำงานของมนุษย์
ไว้ตรวจและอนุมัติงานที่ AI ทำ

---

# 1. งานของนักบัญชีที่ AI ต้องทำแทนให้ได้

งานนักบัญชีไม่ได้เริ่มจาก "คำนวณภาษี" แต่เริ่มจาก **จัดระเบียบหลักฐานและแปลงเป็นข้อมูลบัญชีที่เชื่อถือได้**

นี่คือ job description ของ AI นักบัญชี — ทุกข้อต้องมีเครื่องมือ MCP รองรับ:

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

scope ใหม่ของโปรเจกต์นี้คือ:

## **Ledger Inbox — AI Personal Accountant for Freelance Developers**

ไม่ใช่ SaaS
ไม่ใช่ ERP
ไม่ใช่ระบบบริษัทเต็มรูปแบบ
ไม่ใช่ระบบกดยื่นภาษีอัตโนมัติ (AI เตรียมทุกอย่างให้ แต่คนเป็นผู้ยื่น)

แต่เป็น:

> **นักบัญชีส่วนตัวที่เป็น AI — จัดการรายรับ รายจ่าย หลักฐาน โปรเจกต์ และภาษีให้เราแบบครบวงจร
> โดยไม่ต้องจ้างนักบัญชี และเราเป็นคนอนุมัติงานแทนการเซ็นรับงานจากนักบัญชี**

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
**MCP / AI Access ไม่ใช่เมนูรออีกต่อไป — read-only เปิดใช้แล้ว (19 tools) และจะขยายเป็นหน้าจัดการสิทธิ์/audit log
ของ AI นักบัญชีเมื่อเปิด draft และ write**

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

อันนี้คือระดับที่ "AI นักบัญชีทำงานต่อได้จริง" — ทั้งจัดหมวด กระทบยอด และเตรียมภาษี

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

นี่คือ human-in-the-loop ที่จำเป็นมาก — และในโลกที่ AI เป็นนักบัญชี หน้านี้คือ "โต๊ะเซ็นงาน":
AI ทำงานมากองไว้ เราเปิดมาตรวจแล้วกด approve/reject เหมือนเซ็นรับงานจากนักบัญชี

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

ควร export ได้เป็น:

```text
ledger.xlsx
transactions.csv
documents.zip
tax-summary.xlsx
project-profit.xlsx
missing-documents.xlsx
```

เป้าหมายคือสิ้นปี AI รวบรวมทุกอย่างให้เสร็จ เราแค่ตรวจแล้วใช้ยื่นภาษีได้เลย
(และยัง export ส่งนักบัญชีมนุษย์ได้เสมอ ถ้าอยากให้ double-check ปีแรก ๆ)

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
รายการที่ AI ไม่มั่นใจ ต้องให้เจ้าของตัดสิน
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

# 7. MCP — หัวใจของ AI นักบัญชี

> อัปเดต 10 Jul 2026: จากเดิม MCP เป็นแค่ "ช่องให้ AI ช่วยอ่านข้อมูล" ตอนนี้ MCP คือ **ตัวผลิตภัณฑ์เอง** —
> ชุดเครื่องมือที่ทำให้ AI ทำงานเป็นนักบัญชีของเราได้เต็มตัว UI เป็นแค่โต๊ะตรวจงาน

## สถานะจริงในโค้ด (ณ 10 Jul 2026)

- `fastapi-mcp` mount อยู่ที่ `http://localhost:8000/mcp` แล้ว (`src/backend/app/main.py`)
- เปิด **read-only 19 tools** ผ่าน whitelist `MCP_READ_ONLY_OPERATIONS` (operation_id ของ GET routes) —
  ครอบคลุม transactions, projects, parties, accounts, documents, dashboard summary, tax calculation
- compound tools (`get_yearly_summary`, `get_project_report`) wire เข้า MCP แล้ว (10 Jul 2026) ผ่าน
  `GET /api/dashboard/yearly-summary` และ `GET /api/projects/{id}/report`
- write/delete/confirm/update **ไม่มีตัวไหนหลุดผ่าน MCP** (whitelist ไม่ใช่ blacklist — route ใหม่ปิดโดย default)

## สถาปัตยกรรม

MCP ไม่ควรเข้าถึง database ตรง ๆ

ต้องผ่าน:

```text
MCP Client (Claude ฯลฯ)
→ MCP Gateway
→ Permission Policy
→ Backend Service
→ Database
```

## ชุดเครื่องมือของ AI นักบัญชี — จัดตามงานในหัวข้อ 1

| งานนักบัญชี | MCP tools | สถานะ |
|:--|:--|:--|
| อ่าน/เข้าใจข้อมูล | `list_transactions`, `get_project`, `dashboard_summary`, ฯลฯ | ✅ เปิดแล้ว |
| สรุปเชิงลึก | `get_yearly_summary`, `get_project_report` | ✅ เปิดแล้ว (รวมเป็น 19 tools) |
| จัดหมวด/บันทึก | `create_draft_transaction`, `suggest_category`, `link_project`, `link_party` | Phase 2 (draft) |
| ตรวจความครบ | `find_missing_documents`, `list_unreviewed`, `flag_duplicates` | Phase 2 |
| กระทบยอด | `reconcile_statement` (ต้องมี Statement Import ก่อน) | Phase 2 |
| เตรียมภาษี | `tax_calculation` (✅ เปิดแล้ว), `build_tax_packet`, `list_withholding_certificates` | Phase 3 |
| เตือน/วางแผน | `check_budget`, `list_recurring`, `forecast_cashflow`, `vat_threshold_status` | Phase 3–4 |
| แก้สมุดบัญชีจริง | `confirm_transaction`, `edit_transaction`, ฯลฯ | Phase 4 (ผ่าน approval policy เท่านั้น) |

## ระดับสิทธิ์ 3 ขั้น ผูกกับ phase

```text
Phase 1 (เปิดแล้ว):   read_* ทั้งหมด — AI อ่าน วิเคราะห์ สรุป แนะนำ
Phase 2 (เปิด draft):  create_draft_*, suggest_* — AI ทำงานมากองที่ Review Queue
Phase 4 (เขียนจริง):   write_* ผ่าน approval policy + audit log ทุกการกระทำ
```

ห้ามให้ AI ทำสิ่งนี้จนกว่า approval policy + audit log จะครบ:

```text
delete_transaction
delete_document
confirm_transaction (ยกเว้นผ่าน auto-approve rule ที่เจ้าของตั้งเอง)
edit_amount
submit_tax
```

## Flow การทำงานของ AI นักบัญชี

```text
AI: อ่าน statement เจอรายการ 3,000 บาท → วิเคราะห์ว่าเป็นค่า AI/API
AI: สร้าง draft transaction + จัดหมวด + ผูกโปรเจกต์ ผ่าน MCP
System: เข้าคิวที่ Review Queue
User: เปิดมาเห็นงานที่ AI ทำเสร็จแล้ว กด approve
Ledger: บันทึกจริง + audit log
```

หลักคือ:

> **AI ทำงานทั้งหมดแทนนักบัญชี แต่สมุดบัญชีจริงต้องให้เจ้าของเงินอนุมัติ**
> Phase 4 ค่อยเพิ่ม auto-approve rules สำหรับรายการเสี่ยงต่ำ (เช่น รายจ่ายซ้ำ ๆ ที่เคย approve แล้ว)
> เพื่อให้เข้าใกล้ "นักบัญชีอัตโนมัติเต็มตัว" ทีละขั้น โดย audit log ต้องตามดูย้อนหลังได้เสมอ

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

แค่นี้ก็พอให้ AI นักบัญชีทำงานได้เต็มรูปแบบ — ทั้งจัดหมวด กระทบยอด และเตรียมภาษี

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

> อัปเดต 10 Jul 2026 (รอบสอง — pivot เป็น AI Personal Accountant): ทุก phase ตั้งแต่ 2 เป็นต้นไป
> วัดผลด้วยคำถามเดียว — **"AI ทำงานแทนนักบัญชีได้เพิ่มขึ้นเรื่องอะไร"** — ไม่ใช่แค่มีหน้า UI เพิ่ม

| Phase | เนื้อหา | AI นักบัญชีทำอะไรได้ |
|:--|:--|:--|
| **1 — Accounting Core** ✅ เสร็จ 10 Jul 2026 | Accounts, Owner Identity, Parties, Transactions, Documents, Review Queue, Projects, **MCP read-only (เปิดแล้ว 19 tools)**, **Statement Import เบื้องต้น (CSV)** ✅ | อ่าน วิเคราะห์ สรุป ตอบคำถามการเงินทุกมุม |
| **2 — AI Accountant Workflow** | MCP draft tools (create_draft_transaction, suggest_category, link_project/party), Missing document checker, Reconciliation, Report export, Withholding tax tracking, **Budget**, **Recurring** | จัดหมวด บันทึก draft กระทบยอด ตรวจความครบ — มากองให้เราเซ็น |
| **3 — Tax Center** | PIT estimate, Deductible expense review, VAT watch, Tax packet, **Notification** | เตรียมภาษีทั้งปี เตือน deadline และความเสี่ยง |
| **4 — Autonomous Accountant** | **Write MCP + approval policy + auto-approve rules**, Audit log เต็มรูปแบบ, **Forecast** | ทำงานเองครบวงจร เราตรวจเฉพาะรายการเสี่ยงสูง |

## ทำไมแต่ละอย่างถึงอยู่ใน roadmap

**MCP read-only ตั้งแต่ Phase 1** — ดูหัวข้อ 7 อ่านเพิ่มได้ สรุปคือ AI มีประโยชน์ตั้งแต่ข้อมูลกองแรก ไม่ต้องรอให้ระบบสมบูรณ์ (เปิดใช้จริงแล้ว 10 Jul 2026)

**Statement Import (CSV/PDF จาก KBANK, SCB, TrueMoney, KPlus)** — ตอนนี้ evidence เข้าระบบได้แค่ slip upload กับ manual entry
เท่านั้น รายการโอนผ่าน banking app ไม่เข้าระบบเลย ทำให้ reconciliation (หัวข้อ 4 ข้อ 5) ทำไม่ได้จริง เพราะไม่มี
statement ฝั่งธนาคารมาเทียบ ต้อง parse → map เข้า Account system (ใช้ Account Matching ที่มีอยู่แล้ว) → กันรายการซ้ำ
ยิ่งสำคัญขึ้นใน scope ใหม่: AI นักบัญชีจะทำงานแทนคนได้ ก็ต่อเมื่อข้อมูลไหลเข้าระบบเองครบทุกช่องทาง ไม่ใช่รอคนถ่ายสลิปทีละใบ

> ✅ **ทำแล้ว (10 Jul 2026, CSV):** `POST /api/statements/import` + `services/statement_service.py` —
> parser รองรับหัวตารางไทย/อังกฤษ (KBANK/SCB/generic), ปี พ.ศ. → ค.ศ., ข้าม preamble อัตโนมัติ
> Dedup 3 ชั้น: ไฟล์ซ้ำ (SHA-256) = 409, ref+amount ซ้ำ = ข้าม, ยอด+วันตรงกับรายการเดิม (เช่นสลิปที่เคยลง)
> = flag `suspected_duplicate` เข้า Review Queue — อันหลังนี้คือ reconciliation เบื้องต้นในตัว
> ทุกรายการเป็น `pending` + `source=statement` ผูกกับบัญชีที่เลือกและ Document ของไฟล์ statement
> UI อยู่ที่หน้า Inbox (เลือกบัญชี → อัปโหลด CSV) — PDF statement ยังไม่ทำ รอ Phase 2

**Budget / Recurring Transactions / Notification / Forecast** — วิสัยทัศน์เดิมเป็น reactive ล้วน (user ทำ ระบบบันทึก)
ไม่มีระบบที่ AI จะทัก/เตือน/วางแผนล่วงหน้า เพิ่มเข้ามาเพื่อให้ระบบ proactive มากขึ้น:
- Budget + Recurring → ควบคู่ Phase 2 (Accountant Workflow)
- Notification → ควบคู่ Phase 3 (Tax Center) เช่น เตือนรายจ่ายเกินกรอบ หรือใกล้ deadline ภาษี
- Forecast → รอ Phase 4 ตอนมี data เยอะพอให้คาดการณ์ cashflow ได้แม่น

---

# สรุป

แกนคิดของโปรเจกต์นี้ผ่านมา 3 ขั้น:

> ขั้นแรก: "AI อ่านสลิปแล้วบันทึกบัญชี"
> ขั้นสอง: "ระบบเตรียมบัญชีที่พร้อมให้นักบัญชีตรวจต่อ"

ตอนนี้คือขั้นสาม:

> **"AI นักบัญชีส่วนตัวผ่าน MCP — ทำงานแทนนักบัญชีทั้งหมด ทุกตัวเลขผูกกับหลักฐาน
> และเจ้าของเงินเป็นคนเซ็นอนุมัติ"**

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

> AI อ่านข้อมูลได้ทุกอย่าง (read-only เปิดแล้ว 19 tools)
> AI ทำงานบัญชีทั้งหมด — จัดหมวด บันทึก draft กระทบยอด เตรียมภาษี — ตั้งแต่ Phase 2
> สมุดบัญชีจริงต้องผ่าน approval เสมอ จนกว่า Phase 4 จะมี auto-approve rules + audit log ครบ

นี่ไม่ใช่แอปบัญชีเล็ก ๆ และไม่ใช่แค่ workspace อีกต่อไป — นี่คือ **AI Personal Accountant:
Business Accounting Brain ที่ทำงานแทนนักบัญชีของเราเอง** ครับ.

[1]: https://www.rd.go.th/english/6045.html "Personal Income Tax | The Revenue Department (English Site)"
[2]: https://www.rd.go.th/english/6043.html "Value Added Tax | The Revenue Department (English Site)"
