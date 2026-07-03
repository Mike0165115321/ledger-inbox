"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Document as DocType, QueuedUploadResponse } from "@/lib/api";
import FileUpload from "@/components/FileUpload";
import QueueStatusBar from "@/components/QueueStatusBar";

const STATUS_LABELS: Record<string, string> = {
  uploaded:  "📤 อัปโหลดแล้ว",
  queued:    "🕐 รอในคิว",
  processing: "⏳ กำลังประมวลผล...",
  completed: "✅ ประมวลผลสำเร็จ",
  failed:    "❌ ล้มเหลว",
};

export default function InboxPage() {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDocs = useCallback(() => {
    api.getDocuments()
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 4000);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("ลบเอกสารนี้? รายการบัญชีจะไม่ถูกลบ")) return;
    await api.deleteDocument(docId);
    showMsg("🗑️ ลบแล้ว");
    fetchDocs();
  };

  /** รับหลายไฟล์ → ส่ง batch → เข้า queue ทั้งหมด */
  const handleUpload = async (files: File[]) => {
    try {
      if (files.length === 1) {
        const result: QueuedUploadResponse = await api.uploadDocument(files[0]);
        showMsg(
          result.processing_status === "queued"
            ? `🕐 เพิ่มเข้าคิวแล้ว (ลำดับที่ ${result.queue_position})`
            : `⚠️ ${result.error || "ไม่สำเร็จ"}`
        );
      } else {
        const result = await api.uploadDocumentsBatch(files);
        showMsg(`🕐 เพิ่ม ${result.queued}/${files.length} รูปเข้าคิวแล้ว`);
      }
      fetchDocs();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "ไม่สำเร็จ";
      showMsg(`❌ ${errMsg}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">กล่องหลักฐาน</h1>
        <p className="text-zinc-500 mt-1">อัปโหลดสลิป — Gemini อ่านอัตโนมัติ</p>
      </div>

      {/* Queue Status Panel — poll ทุก 3s, refresh list เมื่อ queue ว่าง */}
      <QueueStatusBar onQueueEmpty={fetchDocs} />

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-medium text-zinc-600 mb-3">
          อัปโหลดสลิป
          <span className="ml-2 text-zinc-400 font-normal">(เลือกหลายไฟล์พร้อมกันได้)</span>
        </h2>
        <FileUpload onUpload={handleUpload} />
      </div>

      {/* Toast */}
      {msg && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm shadow-lg z-50 animate-in">
          {msg}
        </div>
      )}

      {/* Documents List */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-800 mb-3">เอกสารทั้งหมด</h2>
        {loading ? (
          <p className="text-zinc-400 text-center py-10">กำลังโหลด...</p>
        ) : docs.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-zinc-200">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-zinc-500">ยังไม่มีเอกสาร</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg border border-zinc-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg shrink-0">
                      {doc.processing_status === "queued" ? "🕐"
                       : doc.processing_status === "processing" ? "⏳"
                       : doc.processing_status === "completed" ? "✅"
                       : doc.processing_status === "failed" ? "❌"
                       : "📄"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-700 truncate">{doc.file_name}</p>
                      <p className="text-xs text-zinc-400">
                        {STATUS_LABELS[doc.processing_status] || doc.processing_status}
                        {doc.uploaded_at && ` · ${new Date(doc.uploaded_at).toLocaleDateString("th-TH")}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono shrink-0 ml-3">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="hover:text-red-500 mr-1"
                      title="ลบ"
                    >
                      🗑️
                    </button>
                    {doc.id.slice(0, 8)}
                  </span>
                </div>
                {doc.error_message && (
                  <p className="text-xs text-red-500 mt-2">{doc.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
