"use client";

import { useEffect, useState } from "react";
import {
  Landmark,
  Wallet,
  Banknote,
  QrCode,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  User,
} from "lucide-react";
import { api, Account } from "@/lib/api";
import AccountForm from "@/components/AccountForm";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  bank: { label: "ธนาคาร", icon: <Landmark className="w-4 h-4" /> },
  wallet: { label: "Wallet", icon: <Wallet className="w-4 h-4" /> },
  cash: { label: "เงินสด", icon: <Banknote className="w-4 h-4" /> },
  promptpay: { label: "PromptPay", icon: <QrCode className="w-4 h-4" /> },
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState("");

  const fetchAccounts = () => {
    setLoading(true);
    api
      .getAccounts()
      .then(setAccounts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (data: {
    name: string;
    type: string;
    bank_name: string;
    owner_name: string;
    account_number_masked: string;
    is_active: boolean;
  }) => {
    await api.createAccount(data);
    fetchAccounts();
  };

  const handleUpdate = async (data: {
    name: string;
    type: string;
    bank_name: string;
    owner_name: string;
    account_number_masked: string;
    is_active: boolean;
  }) => {
    if (!editAccount) return;
    await api.updateAccount(editAccount.id, data);
    setEditAccount(null);
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบบัญชีนี้? รายการที่ผูกไว้จะกลายเป็นไม่มีบัญชี")) return;
    await api.deleteAccount(id);
    fetchAccounts();
  };

  const filtered = accounts.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.bank_name && a.bank_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">บัญชี</h1>
          <p className="text-text-muted mt-1">
            บัญชีธนาคาร/wallet ที่เป็นของคุณ — ใช้แยกทิศทางเงินเข้า/ออกอัตโนมัติ
          </p>
        </div>
        <Button
          onClick={() => {
            setEditAccount(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" />
          เพิ่มบัญชี
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
        <input
          type="text"
          placeholder="ค้นหาบัญชี..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-danger" />
          <p className="text-danger">{error}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <Landmark className="w-16 h-16 mx-auto mb-4 text-text-subtle" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {search ? "ไม่พบบัญชี" : "ยังไม่มีบัญชี"}
          </h3>
          <p className="text-text-muted mb-6">
            {search ? "ลองเปลี่ยนคำค้นหา" : 'คลิก "เพิ่มบัญชี" เพื่อเริ่มต้น'}
          </p>
          {!search && (
            <Button onClick={() => { setEditAccount(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> เพิ่มบัญชี
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const typeCfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.bank;
            return (
              <Card key={a.id} hover padding="md" className={!a.is_active ? "opacity-60" : ""}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 text-text-muted">
                      {typeCfg.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text truncate">{a.name}</h3>
                      {a.owner_name && (
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {a.owner_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={a.is_active ? "success" : "default"} size="sm">
                    {a.is_active ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                  </Badge>
                </div>

                {a.bank_name && (
                  <p className="text-xs text-text-subtle mb-3">{a.bank_name}</p>
                )}
                {a.account_number_masked && (
                  <p className="text-xs text-text-subtle mb-3 font-mono">
                    {a.account_number_masked}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-border-light pt-3 mt-2">
                  <Badge size="sm">{typeCfg.label}</Badge>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => { setEditAccount(a); setShowForm(true); }}
                      className="p-1.5 text-text-subtle hover:text-info hover:bg-info-bg rounded-lg transition-colors"
                      title="แก้ไข"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-text-subtle hover:text-danger hover:bg-danger-bg rounded-lg transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <AccountForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditAccount(null); }}
        onSave={editAccount ? handleUpdate : handleCreate}
        initial={
          editAccount
            ? {
                name: editAccount.name,
                type: editAccount.type,
                bank_name: editAccount.bank_name || "",
                owner_name: editAccount.owner_name || "",
                account_number_masked: editAccount.account_number_masked || "",
                is_active: editAccount.is_active,
              }
            : undefined
        }
        title={editAccount ? "แก้ไขบัญชี" : "เพิ่มบัญชี"}
      />
    </div>
  );
}
