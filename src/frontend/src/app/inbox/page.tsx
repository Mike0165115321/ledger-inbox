"use client";

import { useEffect, useState } from "react";
import { api, Document as DocType, ServiceHealth, SlipProcessResponse } from "@/lib/api";
import FileUpload from "@/components/FileUpload";

const STATUS_LABELS: Record<string, string> = {
  uploaded: "📤 อัปโหลดแล้ว",
  processing: "⏳ กำลังประมวลผล...",
  completed: "✅ ประมวลผลสำเร็จ",
  failed: "❌ ล้มเหลว",
};

export default function InboxPage() {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDocs = () => {
    api.getDocuments()
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
    api.getServiceHealth().then(setServiceHealth).catch(() => {});
  }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUpload = async (file: File) => {
    try {
      const result: SlipProcessResponse = await api.uploadDocument(file);
      if (result.processing_status === "completed") {
        showMsg(result.review_status === "confirmed"
          ? "✅ ประมวลผลสำเร็จ — บันทึกอัตโนมัติ"
          : "🟡 ประมวลผลสำเร็จ — ส่งตรวจสอบ");
      } else {
        showMsg(`⚠️ ${result.error_message || "ไม่สามารถประมวลผลได้"}`);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "ไม่สำเร็จ";
      showMsg(`❌ ${errMsg}`);
    }
    fetchDocs();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">กล่องหลักฐาน</h1>
        <p className="text-zinc-500 mt-1">อัปโหลดสลิป — ระบบอ่านด้วย EasySlip API</p>
      </div>

      {/* Service Status */}
      {serviceHealth && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          serviceHealth.easyslip_configured
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          {serviceHealth.easyslip_configured
            ? "🟢 EasySlip API พร้อมใช้งาน"
            : "🟡 ยังไม่ได้ตั้งค่า EASYSLIP_API_KEY — ใส่ใน environment variable"}
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-medium text-zinc-600 mb-3">อัปโหลดสลิป</h2>
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
                    <span className="text-lg shrink-0">📄</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-700 truncate">{doc.file_name}</p>
                      <p className="text-xs text-zinc-400">
                        {STATUS_LABELS[doc.processing_status] || doc.processing_status}
                        {doc.uploaded_at && ` · ${new Date(doc.uploaded_at).toLocaleDateString("th-TH")}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono shrink-0 ml-3">{doc.id.slice(0, 8)}</span>
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
