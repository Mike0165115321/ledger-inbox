"use client";

import { useEffect, useState } from "react";
import { api, ProjectWithStats } from "@/lib/api";
import ProjectForm from "@/components/ProjectForm";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_LABELS: Record<string, string> = {
  active: "🟢 Active",
  completed: "✅ Completed",
  archived: "📦 Archived",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithStats | null>(null);

  const fetchProjects = () => {
    setLoading(true);
    api
      .getProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบโปรเจกต์นี้? รายการที่ผูกไว้จะกลายเป็นไม่มีโปรเจกต์")) return;
    await api.deleteProject(id);
    fetchProjects();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">โปรเจกต์</h1>
          <p className="text-zinc-500 mt-1">จัดการโปรเจกต์และดูผลประกอบการ</p>
        </div>
        <button
          onClick={() => {
            setEditProject(null);
            setShowForm(true);
          }}
          className="bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          + เพิ่มโปรเจกต์
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-zinc-400 text-center py-20">กำลังโหลด...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-20">⚠️ {error}</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-zinc-200">
          <p className="text-4xl mb-4">📁</p>
          <h3 className="text-lg font-semibold text-zinc-700">
            ยังไม่มีโปรเจกต์
          </h3>
          <p className="text-zinc-400 mt-1">
            คลิก &quot;+ เพิ่มโปรเจกต์&quot; เพื่อเริ่มต้น
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-800">{p.name}</h3>
                  {p.client_name && (
                    <p className="text-sm text-zinc-400">{p.client_name}</p>
                  )}
                </div>
                <span className="text-xs font-medium text-zinc-500">
                  {STATUS_LABELS[p.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-xs text-zinc-400">รายรับ</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatMoney(p.total_income)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">รายจ่าย</p>
                  <p className="text-sm font-semibold text-red-500">
                    {formatMoney(p.total_expense)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">กำไร</p>
                  <p
                    className={`text-sm font-semibold ${
                      p.profit >= 0 ? "text-blue-600" : "text-red-500"
                    }`}
                  >
                    {formatMoney(p.profit)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  {p.transaction_count} รายการ
                </span>
                <div className="flex gap-2">
                  <a
                    href={api.exportTransactions("csv", p.id)}
                    download
                    className="text-xs text-zinc-400 hover:text-blue-600"
                  >
                    📄 CSV
                  </a>
                  <button
                    onClick={() => {
                      setEditProject(p);
                      setShowForm(true);
                    }}
                    className="text-xs text-zinc-400 hover:text-blue-600"
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs text-zinc-400 hover:text-red-500"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <ProjectForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditProject(null);
        }}
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
