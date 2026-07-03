"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Trash2,
  Upload,
  FileText,
  Square,
  CheckSquare,
} from "lucide-react";
import { api, Document as DocType, QueuedUploadResponse } from "@/lib/api";
import FileUpload from "@/components/FileUpload";
import QueueStatusBar from "@/components/QueueStatusBar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }
> = {
  uploaded: { label: "อัปโหลดแล้ว", variant: "info" },
  queued: { label: "รอในคิว", variant: "warning" },
  processing: { label: "กำลังประมวลผล...", variant: "info" },
  completed: { label: "สำเร็จ", variant: "success" },
  failed: { label: "ล้มเหลว", variant: "danger" },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  uploaded: <FileText className="w-4 h-4 text-info" />,
  queued: <Clock className="w-4 h-4 text-warning" />,
  processing: <Loader2 className="w-4 h-4 text-info animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4 text-success" />,
  failed: <XCircle className="w-4 h-4 text-danger" />,
};

const MAX_VISIBLE = 20;

function formatDateThai(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(docs: DocType[]): Map<string, DocType[]> {
  const groups = new Map<string, DocType[]>();
  for (const doc of docs) {
    const key = formatDateThai(doc.uploaded_at);
    const arr = groups.get(key) || [];
    arr.push(doc);
    groups.set(key, arr);
  }
  return groups;
}

export default function InboxPage() {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchDocs = useCallback(() => {
    api
      .getDocuments()
      .then((d) => {
        setDocs(d.slice(0, MAX_VISIBLE));
        setSelected(new Set());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const showMsg = (text: string) => {
    setMsg(text);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setMsg(null), 300);
    }, 3500);
  };

  const toggleSelect = (docId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === docs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(docs.map((d) => d.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`ลบ ${selected.size} เอกสารที่เลือก? รายการบัญชีจะไม่ถูกลบ`)) return;
    setDeleting(true);
    let count = 0;
    for (const id of selected) {
      try {
        await api.deleteDocument(id);
        count++;
      } catch { /* skip */ }
    }
    showMsg(`ลบแล้ว ${count} เอกสาร`);
    setDeleting(false);
    fetchDocs();
  };

  const handleDeleteOne = async (docId: string) => {
    if (!confirm("ลบเอกสารนี้? รายการบัญชีจะไม่ถูกลบ")) return;
    await api.deleteDocument(docId);
    showMsg("ลบเอกสารแล้ว");
    fetchDocs();
  };

  const handleUpload = async (files: File[]) => {
    try {
      if (files.length === 1) {
        const result: QueuedUploadResponse = await api.uploadDocument(files[0]);
        showMsg(
          result.processing_status === "queued"
            ? `เพิ่มเข้าคิวแล้ว (ลำดับที่ ${result.queue_position})`
            : `${result.error || "ไม่สำเร็จ"}`
        );
      } else {
        const result = await api.uploadDocumentsBatch(files);
        showMsg(`เพิ่ม ${result.queued}/${files.length} รูปเข้าคิวแล้ว`);
      }
      fetchDocs();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "ไม่สำเร็จ";
      showMsg(errMsg);
    }
  };

  const allSelected = docs.length > 0 && selected.size === docs.length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">
          อัปโหลดสลิปแนบหลักฐาน
        </h1>
        <p className="text-text-muted mt-1">
          อัปโหลดสลิป — Gemini อ่านอัตโนมัติ
        </p>
      </div>

      {/* Queue Status Panel */}
      <QueueStatusBar onQueueEmpty={fetchDocs} />

      {/* Upload Zone */}
      <Card>
        <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          อัปโหลดสลิป
          <span className="font-normal text-text-subtle">
            (เลือกหลายไฟล์พร้อมกันได้)
          </span>
        </h2>
        <FileUpload onUpload={handleUpload} />
      </Card>

      {/* Toast Notification */}
      {msg && (
        <div
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
            toastVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          <div className="bg-accent text-text-on-accent px-4 py-2.5 rounded-lg text-sm shadow-lg flex items-center gap-2">
            {msg}
          </div>
        </div>
      )}

      {/* Documents Grid by Date */}
      <div>
        {/* Header + Bulk actions */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text">
            เอกสารทั้งหมด
          </h2>
          {docs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
              {selected.size > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteSelected}
                  isLoading={deleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบ {selected.size} รายการ
                </Button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <Card className="text-center py-12">
            <Inbox className="w-16 h-16 mx-auto mb-4 text-text-subtle" />
            <h3 className="text-lg font-semibold text-text mb-1">
              ยังไม่มีเอกสาร
            </h3>
            <p className="text-sm text-text-subtle max-w-sm mx-auto">
              อัปโหลดสลิปหรือเอกสารทางการเงินของคุณ ระบบจะประมวลผลและ
              สร้างรายการบัญชีให้อัตโนมัติ
            </p>
          </Card>
        ) : (
          Array.from(groupByDate(docs).entries()).map(([dateLabel, groupDocs]) => (
            <div key={dateLabel} className="mb-6">
              {/* Date header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border-light" />
                <span className="text-xs font-medium text-text-muted shrink-0">
                  {dateLabel}
                </span>
                <div className="h-px flex-1 bg-border-light" />
              </div>

              {/* Thumbnail grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {groupDocs.map((doc) => {
                  const statusCfg = STATUS_CONFIG[doc.processing_status] || STATUS_CONFIG.uploaded;
                  const isImage = doc.file_type === "jpg" || doc.file_type === "png";
                  const imgSrc = api.getDocumentFileUrl(doc.id);
                  const isSel = selected.has(doc.id);

                  return (
                    <div
                      key={doc.id}
                      className={`group relative bg-surface rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
                        isSel
                          ? "border-accent ring-2 ring-accent shadow-md"
                          : "border-border hover:shadow-md"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-[3/4] bg-surface-alt relative overflow-hidden">
                        {isImage ? (
                          <img
                            src={imgSrc}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-10 h-10 text-text-subtle" />
                          </div>
                        )}

                        {/* Select checkbox — top left */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(doc.id);
                          }}
                          className={`absolute top-2 left-2 p-1 rounded-md transition-all ${
                            isSel
                              ? "bg-accent text-text-on-accent"
                              : "bg-surface/80 backdrop-blur-sm text-text-subtle opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {isSel ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        {/* Status badge — top right */}
                        <div className="absolute top-2 right-2">
                          <Badge variant={statusCfg.variant} size="sm">
                            <span className="flex items-center gap-1">
                              {STATUS_ICONS[doc.processing_status]}
                              {statusCfg.label}
                            </span>
                          </Badge>
                        </div>

                        {/* Delete button — bottom right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOne(doc.id);
                          }}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-surface/90 text-text-subtle hover:text-danger hover:bg-surface transition-colors shadow-sm"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Footer info */}
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-text truncate" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        <p className="text-[10px] text-text-subtle mt-0.5">
                          {formatTime(doc.uploaded_at)}
                        </p>
                        {doc.error_message && (
                          <p className="text-[10px] text-danger mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{doc.error_message}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {docs.length >= MAX_VISIBLE && (
          <p className="text-xs text-text-subtle text-center mt-4">
            แสดง {MAX_VISIBLE} รายการล่าสุด
          </p>
        )}
      </div>
    </div>
  );
}
