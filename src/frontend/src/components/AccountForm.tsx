"use client";

import { useState, useEffect, useCallback } from "react";
import { Landmark, Wallet, Banknote, QrCode } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: string;
    bank_name: string;
    owner_name: string;
    account_number_masked: string;
    is_active: boolean;
  }) => void;
  initial?: {
    name: string;
    type: string;
    bank_name: string;
    owner_name: string;
    account_number_masked: string;
    is_active: boolean;
  };
  title?: string;
}

const TYPES = [
  { value: "bank", label: "ธนาคาร", icon: Landmark },
  { value: "wallet", label: "Wallet", icon: Wallet },
  { value: "cash", label: "เงินสด", icon: Banknote },
  { value: "promptpay", label: "PromptPay", icon: QrCode },
];

export default function AccountForm({
  isOpen,
  onClose,
  onSave,
  initial,
  title = "เพิ่มบัญชี",
}: AccountFormProps) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    type: initial?.type || "bank",
    bank_name: initial?.bank_name || "",
    owner_name: initial?.owner_name || "",
    account_number_masked: initial?.account_number_masked || "",
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initial?.name || "",
        type: initial?.type || "bank",
        bank_name: initial?.bank_name || "",
        owner_name: initial?.owner_name || "",
        account_number_masked: initial?.account_number_masked || "",
        is_active: initial?.is_active ?? true,
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
      await onSave(form);
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
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="sm">
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="px-6 py-4 space-y-4"
      >
        <Input
          label="ชื่อบัญชี"
          type="text"
          required
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="เช่น KBANK - Mike"
        />

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
                  onClick={() => updateField("type", t.value)}
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

        <Input
          label="ธนาคาร / ผู้ให้บริการ"
          type="text"
          value={form.bank_name}
          onChange={(e) => updateField("bank_name", e.target.value)}
          placeholder="เช่น KBANK, SCB, TrueMoney (ไม่บังคับ)"
        />

        <Input
          label="ชื่อเจ้าของบัญชี"
          type="text"
          value={form.owner_name}
          onChange={(e) => updateField("owner_name", e.target.value)}
          placeholder="ใช้จับคู่ sender/receiver จากสลิปว่าเป็นเราไหม"
          helperText="ระบบใช้ค่านี้แยกรายรับ/รายจ่ายอัตโนมัติ"
        />

        <Input
          label="เลขบัญชี (ปิดบางส่วน)"
          type="text"
          value={form.account_number_masked}
          onChange={(e) => updateField("account_number_masked", e.target.value)}
          placeholder="เช่น xxx-x-x1234-x (ไม่บังคับ)"
        />

        <div className="flex items-center gap-2">
          <input
            id="account-active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField("is_active", e.target.checked)}
            className="rounded border-border text-accent focus:ring-accent"
          />
          <label htmlFor="account-active" className="text-sm text-text">
            ใช้งานอยู่
          </label>
        </div>

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
