"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  FileText,
  Archive,
  CheckCircle2,
  Play,
  Square,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";
import { api, ProjectWithStats } from "@/lib/api";
import ProjectForm from "@/components/ProjectForm";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "success" | "info" | "default"; icon: React.ReactNode }
> = {
  active: { label: "กำลังทำ", variant: "success", icon: <Play className="w-3 h-3" /> },
  completed: { label: "เสร็จแล้ว", variant: "info", icon: <CheckCircle2 className="w-3 h-3" /> },
  archived: { label: "เก็บถาวร", variant: "default", icon: <Archive className="w-3 h-3" /> },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithStats | null>(null);
  const [search, setSearch] = useState("");

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api
      .getProjects()
      .then((data) => {
        setProjects(data);
        setSelected(new Set());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`ลบ ${selected.size} โปรเจกต์ที่เลือก? รายการที่ผูกไว้จะกลายเป็นไม่มีโปรเจกต์`)) return;
    setDeleting(true);
    let count = 0;
    for (const id of selected) {
      try {
        await api.deleteProject(id);
        count++;
      } catch { /* skip */ }
    }
    setDeleting(false);
    fetchProjects();
  };

  const handleCreate = async (data: {
    name: string;
    client_name: string;
    status: string;
    started_at: string;
    ended_at: string;
  }) => {
    await api.createProject({
      ...data,
      started_at: data.started_at || null,
      ended_at: data.ended_at || null,
    });
    fetchProjects();
  };

  const handleUpdate = async (data: {
    name: string;
    client_name: string;
    status: string;
    started_at: string;
    ended_at: string;
  }) => {
    if (!editProject) return;
    await api.updateProject(editProject.id, {
      ...data,
      started_at: data.started_at || null,
      ended_at: data.ended_at || null,
    });
    setEditProject(null);
    fetchProjects();
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm("ยืนยันการลบโปรเจกต์นี้? รายการที่ผูกไว้จะกลายเป็นไม่มีโปรเจกต์")) return;
    await api.deleteProject(id);
    fetchProjects();
  };

  const filtered = projects.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client_name && p.client_name.toLowerCase().includes(search.toLowerCase()))
  );

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">โปรเจกต์</h1>
          <p className="text-text-muted mt-1">จัดการโปรเจกต์และดูผลประกอบการ</p>
        </div>
        <Button
          onClick={() => {
            setEditProject(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4" />
          เพิ่มโปรเจกต์
        </Button>
      </div>

      {/* Search + Bulk actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
          <input
            type="text"
            placeholder="ค้นหาโปรเจกต์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {filtered.length > 0 && (
          <>
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
            >
              {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </button>
            {selected.size > 0 && (
              <Button variant="danger" size="sm" onClick={handleDeleteSelected} isLoading={deleting}>
                <Trash2 className="w-3.5 h-3.5" />
                ลบ {selected.size} โปรเจกต์
              </Button>
            )}
          </>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-32" />
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
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-text-subtle" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {search ? "ไม่พบโปรเจกต์" : "ยังไม่มีโปรเจกต์"}
          </h3>
          <p className="text-text-muted mb-6">
            {search ? "ลองเปลี่ยนคำค้นหา" : 'คลิก "เพิ่มโปรเจกต์" เพื่อเริ่มต้น'}
          </p>
          {!search && (
            <Button onClick={() => { setEditProject(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> เพิ่มโปรเจกต์
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
            const isSel = selected.has(p.id);
            const profit = p.profit;
            const profitPct = p.total_income > 0 ? Math.round((profit / p.total_income) * 100) : 0;

            return (
              <Card
                key={p.id}
                hover
                padding="md"
                className={isSel ? "ring-2 ring-accent border-accent" : ""}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Select checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(p.id); }}
                      className={`shrink-0 p-0.5 rounded transition-colors ${
                        isSel ? "text-accent" : "text-text-subtle hover:text-text"
                      }`}
                    >
                      {isSel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text truncate">{p.name}</h3>
                      {p.client_name && (
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {p.client_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusCfg.variant} size="sm">
                    <span className="flex items-center gap-1">
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </Badge>
                </div>

                {/* Date range */}
                {(p.started_at || p.ended_at) && (
                  <div className="flex items-center gap-1 text-[10px] text-text-subtle mb-3">
                    <Calendar className="w-3 h-3" />
                    {formatDate(p.started_at)} → {formatDate(p.ended_at)}
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <div className="bg-success-bg rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <p className="text-[10px] text-success font-medium">รายรับ</p>
                    </div>
                    <p className="text-sm font-bold text-success tabular-nums">
                      {formatMoney(p.total_income)}
                    </p>
                  </div>
                  <div className="bg-danger-bg rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingDown className="w-3 h-3 text-danger" />
                      <p className="text-[10px] text-danger font-medium">รายจ่าย</p>
                    </div>
                    <p className="text-sm font-bold text-danger tabular-nums">
                      {formatMoney(p.total_expense)}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${profit >= 0 ? "bg-info-bg" : "bg-danger-bg"}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className={`w-3 h-3 ${profit >= 0 ? "text-info" : "text-danger"}`} />
                      <p className={`text-[10px] font-medium ${profit >= 0 ? "text-info" : "text-danger"}`}>กำไร</p>
                    </div>
                    <p className={`text-sm font-bold tabular-nums ${profit >= 0 ? "text-info" : "text-danger"}`}>
                      {formatMoney(profit)}
                    </p>
                  </div>
                </div>

                {/* Profit margin bar */}
                {p.total_income > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-text-muted">อัตรากำไร</span>
                      <span className={`text-[10px] font-medium ${profit >= 0 ? "text-success" : "text-danger"}`}>
                        {profitPct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${profit >= 0 ? "bg-success" : "bg-danger"}`}
                        style={{ width: `${Math.min(Math.abs(profitPct), 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border-light pt-3">
                  <span className="text-xs text-text-muted">
                    {p.transaction_count.toLocaleString("th-TH")} รายการ
                  </span>
                  <div className="flex gap-0.5">
                    <a
                      href={api.exportTransactions("csv", p.id)}
                      download
                      className="p-1.5 text-text-subtle hover:text-info hover:bg-info-bg rounded-lg transition-colors"
                      title="ส่งออก CSV"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => { setEditProject(p); setShowForm(true); }}
                      className="p-1.5 text-text-subtle hover:text-info hover:bg-info-bg rounded-lg transition-colors"
                      title="แก้ไข"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOne(p.id)}
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
      <ProjectForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditProject(null); }}
        onSave={editProject ? handleUpdate : handleCreate}
        initial={
          editProject
            ? {
                name: editProject.name,
                client_name: editProject.client_name || "",
                status: editProject.status,
                started_at: editProject.started_at?.slice(0, 10) || "",
                ended_at: editProject.ended_at?.slice(0, 10) || "",
              }
            : undefined
        }
        title={editProject ? "แก้ไขโปรเจกต์" : "เพิ่มโปรเจกต์"}
      />
    </div>
  );
}
