"use client";

import { useState } from "react";

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
  };
  categories: { id: string; name: string; type: string }[];
  projects: { id: string; name: string }[];
  title?: string;
}

const TYPES = [
  { value: "income", label: "💰 รายรับ" },
  { value: "expense", label: "💸 รายจ่าย" },
  { value: "transfer", label: "↔️ โอน" },
  { value: "personal", label: "👤 ส่วนตัว" },
  { value: "unknown", label: "❓ ไม่แน่ใจ" },
];

export default function TransactionForm({
  isOpen,
  onClose,
  onSave,
  initial,
  categories,
  projects,
  title = "เพิ่มรายการ",
}: TransactionFormProps) {
  const [form, setForm] = useState({
    type: initial?.type || "income",
    category: initial?.category || "",
    amount: initial?.amount || 0,
    transaction_datetime: initial?.transaction_datetime || new Date().toISOString().slice(0, 16),
    note: initial?.note || "",
    project_id: initial?.project_id || "",
    sender_name: initial?.sender_name || "",
    receiver_name: initial?.receiver_name || "",
    bank_or_wallet: initial?.bank_or_wallet || "",
  });

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      transaction_datetime: new Date(form.transaction_datetime).toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
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
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              ประเภท
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, type: t.value, category: "" });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    form.type === t.value
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              จำนวนเงิน (บาท)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={form.amount || ""}
              onChange={(e) =>
                setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              วันที่
            </label>
            <input
              type="datetime-local"
              required
              value={form.transaction_datetime}
              onChange={(e) =>
                setForm({ ...form, transaction_datetime: e.target.value })
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>

          {/* Category */}
          {filteredCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                หมวดหมู่
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              >
                <option value="">— เลือก —</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              โปรเจกต์
            </label>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            >
              <option value="">— ไม่ผูกโปรเจกต์ —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sender / Receiver */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                ผู้ส่ง
              </label>
              <input
                type="text"
                value={form.sender_name}
                onChange={(e) =>
                  setForm({ ...form, sender_name: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                placeholder="ชื่อผู้ส่ง"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                ผู้รับ
              </label>
              <input
                type="text"
                value={form.receiver_name}
                onChange={(e) =>
                  setForm({ ...form, receiver_name: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                placeholder="ชื่อผู้รับ"
              />
            </div>
          </div>

          {/* Bank/Wallet */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              ธนาคาร / Wallet
            </label>
            <input
              type="text"
              value={form.bank_or_wallet}
              onChange={(e) =>
                setForm({ ...form, bank_or_wallet: e.target.value })
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="เช่น KBANK, SCB, PayPal"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1.5">
              หมายเหตุ
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              placeholder="รายละเอียดเพิ่มเติม..."
            />
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
