"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Transaction } from "@/lib/api";
import TransactionForm from "@/components/TransactionForm";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(n);
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function confBadge(c: number) {
  if (c >= 0.85) return { emoji: "🟢", label: "สูง", cls: "text-emerald-600 bg-emerald-50" };
  if (c >= 0.6) return { emoji: "🟡", label: "กลาง", cls: "text-amber-600 bg-amber-50" };
  return { emoji: "🔴", label: "ต่ำ", cls: "text-red-600 bg-red-50" };
}

function dupBadge(s: string) {
  if (s === "duplicate") return "🔄 ซ้ำ";
  if (s === "suspected_duplicate") return "🟡 อาจซ้ำ";
  return "";
}

function getReviewReasons(tx: Transaction): string[] {
  const reasons: string[] = [];
  if (tx.confidence < 0.6) reasons.push(`🔴 AI มั่นใจต่ำ (${Math.round(tx.confidence * 100)}%)`);
  else if (tx.confidence < 0.85) reasons.push(`🟡 AI มั่นใจปานกลาง (${Math.round(tx.confidence * 100)}%)`);
  if (!tx.amount) reasons.push("⚠️ ไม่พบจำนวนเงิน");
  if (!tx.transaction_datetime) reasons.push("⚠️ ไม่พบวันที่");
  if (!tx.sender_name && !tx.receiver_name) reasons.push("⚠️ ไม่พบชื่อ");
  if (tx.duplicate_status === "duplicate") reasons.push("🔄 พบรายการซ้ำ");
  else if (tx.duplicate_status === "suspected_duplicate") reasons.push("🟡 อาจเป็นรายการซ้ำ");
  if (!reasons.length) reasons.push("📝 รอตรวจสอบ");
  return reasons;
}

export default function ReviewPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([api.getReviewQueue(), api.getCategories(), api.getProjects()])
      .then(([queue, cats, projs]) => {
        setTxs(queue);
        setCategories(cats);
        setProjects(projs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirm = async (id: string) => {
    await api.confirmTransaction(id);
    setActionMsg("✅ ยืนยันแล้ว");
    setTimeout(() => setActionMsg(null), 2000);
    fetchData();
  };

  const handleReject = async (id: string) => {
    await api.rejectTransaction(id);
    setActionMsg("❌ ปฏิเสธแล้ว");
    setTimeout(() => setActionMsg(null), 2000);
    fetchData();
  };

  const handleUpdate = async (data: {
    type: string; category: string; amount: number;
    transaction_datetime: string; note: string; project_id: string;
    sender_name: string; receiver_name: string; bank_or_wallet: string;
  }) => {
    if (!editTx) return;
    await api.updateTransaction(editTx.id, { ...data, review_status: "edited" });
    setEditTx(null);
    setShowForm(false);
    fetchData();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">ตรวจสอบ</h1>
        <p className="text-zinc-500 mt-1">รายการที่ AI ไม่มั่นใจ — รอคุณยืนยันหรือแก้ไข</p>
      </div>

      {actionMsg && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium">
          {actionMsg}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-400 text-center py-20">กำลังโหลด...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-20">⚠️ {error}</p>
      ) : txs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-zinc-200">
          <p className="text-4xl mb-4">🎉</p>
          <h3 className="text-lg font-semibold text-zinc-700">ไม่มีรายการที่ต้องตรวจสอบ</h3>
          <p className="text-zinc-400 mt-1">ทุกรายการได้รับการยืนยันแล้ว</p>
        </div>
      ) : (
        <div className="space-y-3">
          {txs.map((tx) => (
            <div key={tx.id} className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${confBadge(tx.confidence).cls}`}>
                    {confBadge(tx.confidence).emoji} {confBadge(tx.confidence).label} ({Math.round(tx.confidence * 100)}%)
                  </span>
                  {dupBadge(tx.duplicate_status) && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-600">
                      {dupBadge(tx.duplicate_status)}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    tx.type === "income" ? "bg-emerald-50 text-emerald-600" :
                    tx.type === "expense" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {tx.type}
                  </span>
                </div>
                <span className="text-xs text-zinc-400">{formatDate(tx.transaction_datetime)}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-xs text-zinc-400">จำนวนเงิน</p>
                  <p className="text-sm font-semibold text-zinc-800">{formatMoney(tx.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">หมวดหมู่</p>
                  <p className="text-sm text-zinc-600">{tx.category || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">ผู้ส่ง/ผู้รับ</p>
                  <p className="text-sm text-zinc-600">{tx.sender_name || tx.receiver_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">ธนาคาร</p>
                  <p className="text-sm text-zinc-600">{tx.bank_or_wallet || "—"}</p>
                </div>
              </div>

              {tx.note && (
                <p className="text-sm text-zinc-500 mb-3">📝 {tx.note}</p>
              )}

              {/* Reasons */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {getReviewReasons(tx).map((r, i) => (
                  <span key={i} className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                    {r}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirm(tx.id)}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  ✅ ยืนยัน
                </button>
                <button
                  onClick={() => { setEditTx(tx); setShowForm(true); }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  onClick={() => handleReject(tx.id)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  ❌ ปฏิเสธ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <TransactionForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTx(null); }}
        onSave={handleUpdate}
        initial={editTx ? {
          type: editTx.type,
          category: editTx.category || "",
          amount: editTx.amount,
          transaction_datetime: editTx.transaction_datetime?.slice(0, 16) || "",
          note: editTx.note || "",
          project_id: editTx.project_id || "",
          sender_name: editTx.sender_name || "",
          receiver_name: editTx.receiver_name || "",
          bank_or_wallet: editTx.bank_or_wallet || "",
        } : undefined}
        categories={categories}
        projects={projects}
        title="แก้ไขรายการ"
      />
    </div>
  );
}
