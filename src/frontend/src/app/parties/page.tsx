"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  Mail,
  Phone,
} from "lucide-react";
import { api, Party } from "@/lib/api";
import PartyForm from "@/components/PartyForm";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const TYPE_TABS = [
  { value: "", label: "ทั้งหมด" },
  { value: "client", label: "ลูกค้า" },
  { value: "vendor", label: "Vendor" },
  { value: "middleman", label: "คนกลาง" },
  { value: "platform", label: "แพลตฟอร์ม" },
  { value: "personal", label: "ส่วนตัว" },
  { value: "government", label: "หน่วยงานรัฐ" },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPE_TABS.filter((t) => t.value).map((t) => [t.value, t.label])
);

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editParty, setEditParty] = useState<Party | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchParties = () => {
    setLoading(true);
    api
      .getParties()
      .then(setParties)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const handleCreate = async (data: {
    name: string;
    type: string;
    tax_id: string;
    address: string;
    email: string;
    phone: string;
    default_category: string;
    withholding_rate: number | null;
    notes: string;
  }) => {
    await api.createParty(data);
    fetchParties();
  };

  const handleUpdate = async (data: {
    name: string;
    type: string;
    tax_id: string;
    address: string;
    email: string;
    phone: string;
    default_category: string;
    withholding_rate: number | null;
    notes: string;
  }) => {
    if (!editParty) return;
    await api.updateParty(editParty.id, data);
    setEditParty(null);
    fetchParties();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบคู่ค้านี้? รายการที่ผูกไว้จะกลายเป็นไม่มีคู่ค้า")) return;
    await api.deleteParty(id);
    fetchParties();
  };

  const filtered = parties.filter(
    (p) =>
      (!typeFilter || p.type === typeFilter) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">คู่ค้า</h1>
          <p className="text-text-muted mt-1">ลูกค้า, vendor และคู่ค้าอื่น ๆ</p>
        </div>
        <Button
          onClick={() => {
            setEditParty(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" />
          เพิ่มคู่ค้า
        </Button>
      </div>

      {/* Search + Type tabs */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <input
            type="text"
            placeholder="ค้นหาคู่ค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t.value
                  ? "bg-accent text-text-on-accent"
                  : "bg-surface-hover text-text-muted hover:bg-surface-hover"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
          <Users className="w-16 h-16 mx-auto mb-4 text-text-subtle" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {search || typeFilter ? "ไม่พบคู่ค้า" : "ยังไม่มีคู่ค้า"}
          </h3>
          <p className="text-text-muted mb-6">
            {search || typeFilter ? "ลองเปลี่ยนตัวกรอง" : 'คลิก "เพิ่มคู่ค้า" เพื่อเริ่มต้น'}
          </p>
          {!search && !typeFilter && (
            <Button onClick={() => { setEditParty(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> เพิ่มคู่ค้า
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} hover padding="md">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-text truncate min-w-0">{p.name}</h3>
                <Badge size="sm">{TYPE_LABEL[p.type] || p.type}</Badge>
              </div>

              <div className="space-y-1 mb-3">
                {p.email && (
                  <p className="text-xs text-text-subtle flex items-center gap-1.5">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </p>
                )}
                {p.phone && (
                  <p className="text-xs text-text-subtle flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0" />
                    {p.phone}
                  </p>
                )}
                {p.default_category && (
                  <p className="text-xs text-text-muted">
                    หมวดหมู่: {p.default_category}
                  </p>
                )}
                {p.withholding_rate != null && (
                  <p className="text-xs text-text-muted">
                    หัก ณ ที่จ่าย: {p.withholding_rate}%
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end border-t border-border-light pt-3">
                <div className="flex gap-0.5">
                  <button
                    onClick={() => { setEditParty(p); setShowForm(true); }}
                    className="p-1.5 text-text-subtle hover:text-info hover:bg-info-bg rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-text-subtle hover:text-danger hover:bg-danger-bg rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <PartyForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditParty(null); }}
        onSave={editParty ? handleUpdate : handleCreate}
        initial={
          editParty
            ? {
                name: editParty.name,
                type: editParty.type,
                tax_id: editParty.tax_id || "",
                address: editParty.address || "",
                email: editParty.email || "",
                phone: editParty.phone || "",
                default_category: editParty.default_category || "",
                withholding_rate: editParty.withholding_rate,
                notes: editParty.notes || "",
              }
            : undefined
        }
        title={editParty ? "แก้ไขคู่ค้า" : "เพิ่มคู่ค้า"}
      />
    </div>
  );
}
