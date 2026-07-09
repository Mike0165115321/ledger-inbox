"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Pencil,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  User,
  HelpCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { api, Transaction, Category, Project, Account, Party } from "@/lib/api";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

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

const TYPE_CONFIG: Record<
  string,
  { label: string; variant: "success" | "danger" | "info" | "default" | "warning"; icon: React.ReactNode }
> = {
  income: { label: "รายรับ", variant: "success", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  expense: { label: "รายจ่าย", variant: "danger", icon: <TrendingDown className="w-3.5 h-3.5" /> },
  transfer: { label: "โอน", variant: "info", icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
  personal: { label: "ส่วนตัว", variant: "default", icon: <User className="w-3.5 h-3.5" /> },
  unknown: { label: "ไม่แน่ใจ", variant: "warning", icon: <HelpCircle className="w-3.5 h-3.5" /> },
};

export default function ReviewQueuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getReviewQueue(),
      api.getCategories(),
      api.getProjects(),
      api.getAccounts(),
      api.getParties(),
    ])
      .then(([txs, cats, projs, accs, parts]) => {
        setTransactions(txs);
        setCategories(cats);
        setProjects(projs);
        setAccounts(accs);
        setParties(parts);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirm = async (id: string) => {
    setBusyId(id);
    try {
      await api.confirmTransaction(id);
      fetchData();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("ปฏิเสธรายการนี้?")) return;
    setBusyId(id);
    try {
      await api.rejectTransaction(id);
      fetchData();
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editTx) return;
    await api.updateTransaction(editTx.id, data);
    setEditTx(null);
    fetchData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">คิวตรวจสอบ</h1>
        <p className="text-text-muted mt-1">
          รายการที่ AI ไม่มั่นใจพอ หรือสงสัยว่าซ้ำ — ตรวจก่อนลงบัญชีจริง
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-danger" />
          <p className="text-danger">{error}</p>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="text-center py-16">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-text-subtle" />
          <h3 className="text-lg font-semibold text-text mb-2">คิวว่าง 🎉</h3>
          <p className="text-text-muted">ไม่มีรายการรอตรวจสอบตอนนี้</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const typeCfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.unknown;
            const isBusy = busyId === tx.id;
            return (
              <Card key={tx.id} padding="md">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Badge variant={typeCfg.variant} size="sm">
                      <span className="flex items-center gap-1">
                        {typeCfg.icon}
                        {typeCfg.label}
                      </span>
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-semibold text-text tabular-nums">
                        {formatMoney(tx.amount)} {tx.currency}
                      </p>
                      <p className="text-xs text-text-subtle mt-0.5">
                        {formatDate(tx.transaction_datetime)}
                        {tx.category && ` · ${tx.category}`}
                      </p>
                      {(tx.sender_name || tx.receiver_name) && (
                        <p className="text-xs text-text-muted mt-1">
                          {tx.sender_name || "?"} → {tx.receiver_name || "?"}
                        </p>
                      )}
                      {tx.note && (
                        <p className="text-xs text-text-subtle mt-1 truncate max-w-md">
                          {tx.note}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <Badge variant="warning" size="sm">
                          confidence {(tx.confidence * 100).toFixed(0)}%
                        </Badge>
                        {tx.duplicate_status !== "unique" && (
                          <Badge variant="warning" size="sm">
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              {tx.duplicate_status === "duplicate" ? "ซ้ำ" : "อาจซ้ำ"}
                            </span>
                          </Badge>
                        )}
                        {tx.document_id && (
                          <a
                            href={api.getDocumentFileUrl(tx.document_id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-info hover:underline"
                          >
                            <FileText className="w-3 h-3" />
                            ดูหลักฐาน
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(tx.id)}
                      isLoading={isBusy}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setEditTx(tx); setShowForm(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(tx.id)}
                      isLoading={isBusy}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <TransactionForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTx(null); }}
        onSave={handleUpdate}
        initial={
          editTx
            ? {
                type: editTx.type,
                category: editTx.category || "",
                amount: editTx.amount,
                transaction_datetime: editTx.transaction_datetime?.slice(0, 16) || "",
                note: editTx.note || "",
                project_id: editTx.project_id || "",
                sender_name: editTx.sender_name || "",
                receiver_name: editTx.receiver_name || "",
                bank_or_wallet: editTx.bank_or_wallet || "",
                account_id: editTx.account_id || "",
                party_id: editTx.party_id || "",
              }
            : undefined
        }
        categories={categories}
        projects={projects}
        accounts={accounts}
        parties={parties}
        title="แก้ไขรายการ"
      />
    </div>
  );
}
