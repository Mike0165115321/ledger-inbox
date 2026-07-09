"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  User,
  HelpCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input, { Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    type: string;
    category: string;
    amount: number;
    transaction_datetime: string;
    note: string;
    project_id: string;
    sender_name: string;
    receiver_name: string;
    bank_or_wallet: string;
    account_id: string;
    party_id: string;
  }) => void;
  initial?: {
    type: string;
    category: string;
    amount: number;
    transaction_datetime: string;
    note: string;
    project_id: string;
    sender_name: string;
    receiver_name: string;
    bank_or_wallet: string;
    account_id: string;
    party_id: string;
  };
  categories: { id: string; name: string; type: string }[];
  projects: { id: string; name: string }[];
  accounts?: { id: string; name: string }[];
  parties?: { id: string; name: string }[];
  title?: string;
}

const TYPES = [
  { value: "income", label: "รายรับ", icon: TrendingUp },
  { value: "expense", label: "รายจ่าย", icon: TrendingDown },
  { value: "transfer", label: "โอน", icon: ArrowLeftRight },
  { value: "personal", label: "ส่วนตัว", icon: User },
  { value: "unknown", label: "ไม่แน่ใจ", icon: HelpCircle },
];

export default function TransactionForm({
  isOpen,
  onClose,
  onSave,
  initial,
  categories,
  projects,
  accounts = [],
  parties = [],
  title = "เพิ่มรายการ",
}: TransactionFormProps) {
  const [form, setForm] = useState({
    type: initial?.type || "income",
    category: initial?.category || "",
    amount: initial?.amount || 0,
    transaction_datetime:
      initial?.transaction_datetime || new Date().toISOString().slice(0, 16),
    note: initial?.note || "",
    project_id: initial?.project_id || "",
    sender_name: initial?.sender_name || "",
    receiver_name: initial?.receiver_name || "",
    bank_or_wallet: initial?.bank_or_wallet || "",
    account_id: initial?.account_id || "",
    party_id: initial?.party_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Reset form when initial changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        type: initial?.type || "income",
        category: initial?.category || "",
        amount: initial?.amount || 0,
        transaction_datetime:
          initial?.transaction_datetime || new Date().toISOString().slice(0, 16),
        note: initial?.note || "",
        project_id: initial?.project_id || "",
        sender_name: initial?.sender_name || "",
        receiver_name: initial?.receiver_name || "",
        bank_or_wallet: initial?.bank_or_wallet || "",
        account_id: initial?.account_id || "",
        party_id: initial?.party_id || "",
      });
      setDirty(false);
    }
  }, [initial, isOpen]);

  const updateField = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setDirty(true);
    },
    []
  );

  const handleClose = () => {
    if (dirty) {
      if (!confirm("คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการปิดหรือไม่?"))
        return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        transaction_datetime: new Date(form.transaction_datetime).toISOString(),
      });
      setDirty(false);
      onClose();
    } catch {
      // error handled upstream
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="px-6 py-4 space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            ประเภท
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    updateField("type", t.value);
                    updateField("category", "");
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.type === t.value
                      ? "bg-accent text-text-on-accent"
                      : "bg-surface-hover text-text-muted hover:bg-surface-hover"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <Input
          label="จำนวนเงิน (บาท)"
          type="number"
          step="0.01"
          min="0"
          required
          value={form.amount || ""}
          onChange={(e) => updateField("amount", parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />

        {/* Date */}
        <Input
          label="วันที่"
          type="datetime-local"
          required
          value={form.transaction_datetime}
          onChange={(e) => updateField("transaction_datetime", e.target.value)}
        />

        {/* Category */}
        {filteredCategories.length > 0 && (
          <Select
            label="หมวดหมู่"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            options={filteredCategories.map((c) => ({
              value: c.name,
              label: c.name,
            }))}
            placeholder="— เลือก —"
          />
        )}

        {/* Project */}
        <Select
          label="โปรเจกต์"
          value={form.project_id}
          onChange={(e) => updateField("project_id", e.target.value)}
          options={projects.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
          placeholder="— ไม่ผูกโปรเจกต์ —"
        />

        {/* Account / Party */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="บัญชี"
            value={form.account_id}
            onChange={(e) => updateField("account_id", e.target.value)}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            placeholder="— ไม่ผูกบัญชี —"
          />
          <Select
            label="คู่ค้า"
            value={form.party_id}
            onChange={(e) => updateField("party_id", e.target.value)}
            options={parties.map((p) => ({ value: p.id, label: p.name }))}
            placeholder="— ไม่ผูกคู่ค้า —"
          />
        </div>

        {/* Sender / Receiver */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="ผู้ส่ง"
            type="text"
            value={form.sender_name}
            onChange={(e) => updateField("sender_name", e.target.value)}
            placeholder="ชื่อผู้ส่ง"
          />
          <Input
            label="ผู้รับ"
            type="text"
            value={form.receiver_name}
            onChange={(e) => updateField("receiver_name", e.target.value)}
            placeholder="ชื่อผู้รับ"
          />
        </div>

        {/* Bank/Wallet */}
        <Input
          label="ธนาคาร / Wallet"
          type="text"
          value={form.bank_or_wallet}
          onChange={(e) => updateField("bank_or_wallet", e.target.value)}
          placeholder="เช่น KBANK, SCB, PayPal"
        />

        {/* Note */}
        <Textarea
          label="หมายเหตุ"
          value={form.note}
          onChange={(e) => updateField("note", e.target.value)}
          rows={2}
          placeholder="รายละเอียดเพิ่มเติม..."
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button type="submit" className="flex-1" isLoading={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
