"use client";

import { useState } from "react";

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
  { value: "active", label: "🟢 Active" },
  { value: "completed", label: "✅ Completed" },
  { value: "archived", label: "📦 Archived" },
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              ชื่อโปรเจกต์ <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="เช่น พัฒนาเว็บไซต์ ABC"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              ลูกค้า
            </label>
            <input
              type="text"
              value={form.client_name}
              onChange={(e) =>
                setForm({ ...form, client_name: e.target.value })
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="ชื่อลูกค้า (ไม่บังคับ)"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              สถานะ
            </label>
            <div className="flex gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm({ ...form, status: s.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.status === s.value
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                วันที่เริ่ม
              </label>
              <input
                type="date"
                value={form.started_at}
                onChange={(e) =>
                  setForm({ ...form, started_at: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={form.ended_at}
                onChange={(e) =>
                  setForm({ ...form, ended_at: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
