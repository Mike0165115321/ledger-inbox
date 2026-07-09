"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Input, { Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface PartyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: string;
    tax_id: string;
    address: string;
    email: string;
    phone: string;
    default_category: string;
    withholding_rate: number | null;
    notes: string;
  }) => void;
  initial?: {
    name: string;
    type: string;
    tax_id: string;
    address: string;
    email: string;
    phone: string;
    default_category: string;
    withholding_rate: number | null;
    notes: string;
  };
  title?: string;
}

const TYPES = [
  { value: "client", label: "ลูกค้า" },
  { value: "vendor", label: "Vendor" },
  { value: "middleman", label: "คนกลาง" },
  { value: "platform", label: "แพลตฟอร์ม" },
  { value: "personal", label: "ส่วนตัว" },
  { value: "government", label: "หน่วยงานรัฐ" },
];

export default function PartyForm({
  isOpen,
  onClose,
  onSave,
  initial,
  title = "เพิ่มคู่ค้า",
}: PartyFormProps) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    type: initial?.type || "client",
    tax_id: initial?.tax_id || "",
    address: initial?.address || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    default_category: initial?.default_category || "",
    withholding_rate: initial?.withholding_rate ?? null,
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initial?.name || "",
        type: initial?.type || "client",
        tax_id: initial?.tax_id || "",
        address: initial?.address || "",
        email: initial?.email || "",
        phone: initial?.phone || "",
        default_category: initial?.default_category || "",
        withholding_rate: initial?.withholding_rate ?? null,
        notes: initial?.notes || "",
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
      const target = e.target as HTMLElement;
      if (target.tagName !== "TEXTAREA") {
        e.preventDefault();
        handleSubmit(e);
      }
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
          label="ชื่อ"
          type="text"
          required
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="ชื่อลูกค้า/vendor/คู่ค้า"
        />

        <Select
          label="ประเภท"
          value={form.type}
          onChange={(e) => updateField("type", e.target.value)}
          options={TYPES}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="เลขผู้เสียภาษี"
            type="text"
            value={form.tax_id}
            onChange={(e) => updateField("tax_id", e.target.value)}
            placeholder="ไม่บังคับ"
          />
          <Input
            label="อัตราหัก ณ ที่จ่าย (%)"
            type="number"
            step="0.01"
            value={form.withholding_rate ?? ""}
            onChange={(e) =>
              updateField(
                "withholding_rate",
                e.target.value === "" ? null : parseFloat(e.target.value)
              )
            }
            placeholder="เช่น 3"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="อีเมล"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          <Input
            label="เบอร์โทร"
            type="text"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>

        <Input
          label="หมวดหมู่เริ่มต้น"
          type="text"
          value={form.default_category}
          onChange={(e) => updateField("default_category", e.target.value)}
          placeholder="เช่น รายได้ฟรีแลนซ์ (ไม่บังคับ)"
        />

        <Textarea
          label="ที่อยู่"
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
          rows={2}
        />

        <Textarea
          label="หมายเหตุ"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={2}
        />

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
