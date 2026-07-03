"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Filter,
  AlertTriangle,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  User,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { api, Transaction, Category, Project } from "@/lib/api";
import TransactionForm from "@/components/TransactionForm";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton, SkeletonTableRow } from "@/components/ui/Skeleton";

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

const REVIEW_BADGE: Record<
  string,
  { label: string; variant: "warning" | "success" | "danger" }
> = {
  pending: { label: "รอตรวจสอบ", variant: "warning" },
  confirmed: { label: "ยืนยันแล้ว", variant: "success" },
  rejected: { label: "ปฏิเสธ", variant: "danger" },
};

const PAGE_SIZE = 15;

type SortField = "date" | "amount" | "type";
type SortDir = "asc" | "desc";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filterType, filterMonth]);

  const handleCreate = async (data: any) => {
    await api.createTransaction(data);
    fetchData();
  };

  const handleUpdate = async (data: any) => {
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

  // Sorting
  const getSortValue = (tx: Transaction, field: SortField): number | string => {
    if (field === "date") return tx.transaction_datetime || "";
    if (field === "amount") return tx.amount;
    if (field === "type") return tx.type;
    return "";
  };

  const sortedTxs = [...transactions].sort((a, b) => {
    const va = getSortValue(a, sortField);
    const vb = getSortValue(b, sortField);
    const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sortedTxs.length / PAGE_SIZE));
  const paginatedTxs = sortedTxs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "amount" ? "desc" : "desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">
            รายการ
          </h1>
          <p className="text-text-muted mt-1">
            รายรับ/รายจ่ายทั้งหมด
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTx(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" />
          เพิ่มรายการ
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-text-subtle" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">ทั้งหมด</option>
            <option value="income">รายรับ</option>
            <option value="expense">รายจ่าย</option>
            <option value="transfer">โอน</option>
            <option value="personal">ส่วนตัว</option>
            <option value="unknown">ไม่แน่ใจ</option>
          </select>
        </div>

        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Content */}
      {loading ? (
        <Card padding="none">
          <div className="p-4 border-b border-border-light">
            <Skeleton className="h-4 w-32" />
          </div>
          <div>
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
          </div>
        </Card>
      ) : error ? (
        <Card className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-danger" />
          <p className="text-danger">{error}</p>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="text-center py-16">
          <FileEdit className="w-16 h-16 mx-auto mb-4 text-text-subtle" />
          <h3 className="text-lg font-semibold text-text mb-2">
            ยังไม่มีรายการ
          </h3>
          <p className="text-text-muted mb-6">
            คลิก &quot;เพิ่มรายการ&quot; เพื่อเริ่มบันทึกข้อมูลทางการเงินของคุณ
          </p>
          <Button
            onClick={() => {
              setEditTx(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายการ
          </Button>
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-alt border-b border-border sticky top-0">
                  <tr>
                    <th
                      className="text-left px-4 py-3 font-medium text-text-muted cursor-pointer select-none hover:text-text"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center">
                        วันที่
                        <SortIcon field="date" />
                      </div>
                    </th>
                    <th
                      className="text-left px-4 py-3 font-medium text-text-muted cursor-pointer select-none hover:text-text"
                      onClick={() => toggleSort("type")}
                    >
                      <div className="flex items-center">
                        ประเภท
                        <SortIcon field="type" />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-text-muted">
                      หมวดหมู่
                    </th>
                    <th
                      className="text-right px-4 py-3 font-medium text-text-muted cursor-pointer select-none hover:text-text"
                      onClick={() => toggleSort("amount")}
                    >
                      <div className="flex items-center justify-end">
                        จำนวนเงิน
                        <SortIcon field="amount" />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-text-muted">
                      หมายเหตุ
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">
                      สถานะ
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-text-muted">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTxs.map((tx) => {
                    const typeCfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.unknown;
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-border-light hover:bg-surface-hover transition-colors"
                      >
                        <td className="px-4 py-3 text-text whitespace-nowrap">
                          {formatDate(tx.transaction_datetime)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={typeCfg.variant} size="sm">
                            <span className="flex items-center gap-1">
                              {typeCfg.icon}
                              {typeCfg.label}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-text">
                          {tx.category || "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium tabular-nums ${
                            tx.type === "income"
                              ? "text-success"
                              : tx.type === "expense"
                              ? "text-danger"
                              : "text-text"
                          }`}
                        >
                          {tx.type === "income"
                            ? "+"
                            : tx.type === "expense"
                            ? "-"
                            : ""}
                          {formatMoney(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-text-muted max-w-[150px] truncate">
                          {tx.note || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {tx.review_status === "pending" && (
                              <Badge variant="warning" size="sm">
                                รอตรวจสอบ
                              </Badge>
                            )}
                            {tx.review_status === "confirmed" && (
                              <Badge variant="success" size="sm">
                                <CheckCircle2 className="w-3 h-3" />
                                ยืนยันแล้ว
                              </Badge>
                            )}
                            {tx.review_status === "rejected" && (
                              <Badge variant="danger" size="sm">
                                <XCircle className="w-3 h-3" />
                                ปฏิเสธ
                              </Badge>
                            )}
                            {tx.duplicate_status !== "unique" && (
                              <Badge variant="warning" size="sm">
                                <RefreshCw className="w-3 h-3" />
                                {tx.duplicate_status === "duplicate"
                                  ? "ซ้ำ"
                                  : "อาจซ้ำ"}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditTx(tx);
                                setShowForm(true);
                              }}
                              className="p-1.5 text-text-subtle hover:text-info hover:bg-info-bg rounded-lg transition-colors"
                              title="แก้ไข"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 text-text-subtle hover:text-danger hover:bg-danger-bg rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">
              หน้า {page} จาก {totalPages} · {transactions.length} รายการ
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                ก่อนหน้า
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ถัดไป
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
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
