"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, CheckCircle2, Archive } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input, { Select } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    client_name: string;
    status: string;
    started_at: string;
    ended_at: string;
  }) => void;
  initial?: {
    name: string;
    client_name: string;
    status: string;
    started_at: string;
    ended_at: string;
  };
  title?: string;
}

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function ProjectForm({
  isOpen,
  onClose,
  onSave,
  initial,
  title = "เพิ่มโปรเจกต์",
}: ProjectFormProps) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    client_name: initial?.client_name || "",
    status: initial?.status || "active",
    started_at: initial?.started_at || new Date().toISOString().slice(0, 10),
    ended_at: initial?.ended_at || "",
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Reset form when initial changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initial?.name || "",
        client_name: initial?.client_name || "",
        status: initial?.status || "active",
        started_at: initial?.started_at || new Date().toISOString().slice(0, 10),
        ended_at: initial?.ended_at || "",
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
      if (
        !confirm("คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการปิดหรือไม่?")
      )
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
        {/* Name */}
        <Input
          label="ชื่อโปรเจกต์"
          type="text"
          required
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="เช่น พัฒนาเว็บไซต์ ABC"
        />

        {/* Client */}
        <Input
          label="ลูกค้า"
          type="text"
          value={form.client_name}
          onChange={(e) => updateField("client_name", e.target.value)}
          placeholder="ชื่อลูกค้า (ไม่บังคับ)"
        />

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            สถานะ
          </label>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => updateField("status", s.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  form.status === s.value
                    ? "bg-accent text-text-on-accent"
                    : "bg-surface-hover text-text-muted hover:bg-surface-hover"
                }`}
              >
                {s.value === "active" && <Play className="w-3.5 h-3.5" />}
                {s.value === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
                {s.value === "archived" && <Archive className="w-3.5 h-3.5" />}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="วันที่เริ่ม"
            type="date"
            value={form.started_at}
            onChange={(e) => updateField("started_at", e.target.value)}
          />
          <Input
            label="วันที่สิ้นสุด"
            type="date"
            value={form.ended_at}
            onChange={(e) => updateField("ended_at", e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
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
