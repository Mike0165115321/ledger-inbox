"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Transaction, Category, Project } from "@/lib/api";
import TransactionForm from "@/components/TransactionForm";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TYPE_LABELS: Record<string, string> = {
  income: "💰 รายรับ",
  expense: "💸 รายจ่าย",
  transfer: "↔️ โอน",
  personal: "👤 ส่วนตัว",
  unknown: "❓ ไม่แน่ใจ",
};

const TYPE_COLORS: Record<string, string> = {
  income: "text-emerald-600",
  expense: "text-red-500",
  transfer: "text-blue-600",
  personal: "text-zinc-500",
  unknown: "text-amber-500",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getTransactions({
        type: filterType || undefined,
        month: filterMonth || undefined,
      }),
      api.getCategories(),
      api.getProjects(),
    ])
      .then(([txs, cats, projs]) => {
        setTransactions(txs);
        setCategories(cats);
        setProjects(projs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterType, filterMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (data: {
    type: string;
    category: string;
    amount: number;
    transaction_datetime: string;
    note: string;
    project_id: string;
    sender_name: string;
    receiver_name: string;
    bank_or_wallet: string;
  }) => {
    await api.createTransaction(data);
    fetchData();
  };

  const handleUpdate = async (data: {
    type: string;
    category: string;
    amount: number;
    transaction_datetime: string;
    note: string;
    project_id: string;
    sender_name: string;
    receiver_name: string;
    bank_or_wallet: string;
  }) => {
    if (!editTx) return;
    await api.updateTransaction(editTx.id, data);
    setEditTx(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบรายการนี้?")) return;
    await api.deleteTransaction(id);
    fetchData();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">รายการ</h1>
          <p className="text-zinc-500 mt-1">รายรับ/รายจ่ายทั้งหมด</p>
        </div>
        <button
          onClick={() => {
            setEditTx(null);
            setShowForm(true);
          }}
          className="bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          + เพิ่มรายการ
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">ทั้งหมด</option>
          <option value="income">รายรับ</option>
          <option value="expense">รายจ่าย</option>
          <option value="transfer">โอน</option>
          <option value="personal">ส่วนตัว</option>
          <option value="unknown">ไม่แน่ใจ</option>
        </select>

        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-zinc-400 text-center py-20">กำลังโหลด...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-20">⚠️ {error}</p>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-zinc-200">
          <p className="text-4xl mb-4">📝</p>
          <h3 className="text-lg font-semibold text-zinc-700">
            ยังไม่มีรายการ
          </h3>
          <p className="text-zinc-400 mt-1">
            คลิก &quot;+ เพิ่มรายการ&quot; เพื่อเริ่มต้น
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  วันที่
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  ประเภท
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  หมวดหมู่
                </th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">
                  จำนวนเงิน
                </th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">
                  หมายเหตุ
                </th>
                <th className="text-center px-4 py-3 font-medium text-zinc-500">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3 text-zinc-600">
                    {formatDate(tx.transaction_datetime)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${TYPE_COLORS[tx.type]}`}>
                      {TYPE_LABELS[tx.type] || tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {tx.category || "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      tx.type === "income"
                        ? "text-emerald-600"
                        : tx.type === "expense"
                        ? "text-red-500"
                        : "text-zinc-700"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {formatMoney(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 max-w-[200px] truncate">
                    {tx.note || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setEditTx(tx);
                        setShowForm(true);
                      }}
                      className="text-zinc-400 hover:text-blue-600 mr-2"
                      title="แก้ไข"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-zinc-400 hover:text-red-500"
                      title="ลบ"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <TransactionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTx(null);
        }}
        onSave={editTx ? handleUpdate : handleCreate}
        initial={
          editTx
            ? {
                type: editTx.type,
                category: editTx.category || "",
                amount: editTx.amount,
                transaction_datetime:
                  editTx.transaction_datetime?.slice(0, 16) || "",
                note: editTx.note || "",
                project_id: editTx.project_id || "",
                sender_name: editTx.sender_name || "",
                receiver_name: editTx.receiver_name || "",
                bank_or_wallet: editTx.bank_or_wallet || "",
              }
            : undefined
        }
        categories={categories}
        projects={projects}
        title={editTx ? "แก้ไขรายการ" : "เพิ่มรายการ"}
      />
    </div>
  );
}
