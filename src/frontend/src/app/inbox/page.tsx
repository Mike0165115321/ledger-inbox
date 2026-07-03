"use client";

import { useEffect, useState } from "react";
import { api, Document as DocType, ModelHealth } from "@/lib/api";
import FileUpload from "@/components/FileUpload";

const STATUS_LABELS: Record<string, string> = {
  uploaded: "📤 อัปโหลดแล้ว",
  processing: "⏳ กำลังประมวลผล...",
  completed: "✅ ประมวลผลสำเร็จ",
  waiting_model: "⏸️ รอ AI model",
  failed: "❌ ล้มเหลว",
};

export default function InboxPage() {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelHealth, setModelHealth] = useState<ModelHealth | null>(null);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDocs = () => {
    api.getDocuments()
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchHealth = () => {
    api.getModelHealth()
      .then(setModelHealth)
      .catch(() => {});
  };

  useEffect(() => {
    fetchDocs();
    fetchHealth();
  }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUpload = async (file: File) => {
    const result = await api.uploadDocument(file);
    showMsg("✅ อัปโหลดสำเร็จ — กำลังประมวลผล...");
    // Auto-process after upload
    await handleProcess(result.id);
    fetchDocs();
  };

  const handleProcess = async (docId: string) => {
    setProcessing((p) => ({ ...p, [docId]: true }));
    try {
      const result = await api.processDocument(docId);
      if (result.processing_status === "completed") {
        showMsg(result.review_status === "confirmed"
          ? "✅ ประมวลผลสำเร็จ — บันทึกอัตโนมัติ"
          : "🟡 ประมวลผลสำเร็จ — ส่งตรวจสอบ");
      } else {
        showMsg(`⚠️ ${result.error_message || "ไม่สามารถประมวลผลได้"}`);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "ไม่สามารถประมวลผลได้";
      showMsg(`❌ ${errMsg}`);
    }
    setProcessing((p) => ({ ...p, [docId]: false }));
    fetchDocs();
  };

  const handleEasySlip = async (docId: string) => {
    setProcessing((p) => ({ ...p, [docId]: true }));
    try {
      const result = await api.retryEasySlip(docId);
      if (result.processing_status === "completed") {
        showMsg("✅ EasySlip ประมวลผลสำเร็จ");
      } else {
        showMsg(`⚠️ ${result.error_message || "ไม่สำเร็จ"}`);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "ไม่สำเร็จ";
      showMsg(`❌ ${errMsg}`);
    }
    setProcessing((p) => ({ ...p, [docId]: false }));
    fetchDocs();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">กล่องหลักฐาน</h1>
        <p className="text-zinc-500 mt-1">อัปโหลดสลิป — AI อ่านให้อัตโนมัติ</p>
      </div>

      {/* Model Health */}
      {modelHealth && (
        <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-3 ${
          modelHealth.ready ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
          modelHealth.ollama_running ? "bg-amber-50 border-amber-200 text-amber-700" :
          "bg-red-50 border-red-200 text-red-600"
        }`}>
          <span>{modelHealth.ready ? "🟢" : modelHealth.ollama_running ? "🟡" : "🔴"}</span>
          <span>
            {modelHealth.ready
              ? "AI พร้อมใช้งาน — อัปโหลดสลิปได้เลย"
              : modelHealth.ollama_running
              ? "Ollama รันอยู่ แต่ยังไม่มี model — รัน: ollama pull qwen3-vl:8b"
              : "Ollama ยังไม่รัน — เริ่มด้วย: ollama serve"}
          </span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-medium text-zinc-600 mb-3">อัปโหลดสลิป</h2>
        <FileUpload onUpload={handleUpload} />
      </div>

      {/* Toast Message */}
      {msg && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm shadow-lg z-50">
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

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {doc.processing_status === "waiting_model" && (
                      <>
                        <button
                          onClick={() => handleProcess(doc.id)}
                          disabled={processing[doc.id]}
                          className="text-xs px-2.5 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {processing[doc.id] ? "⏳..." : "🔄 Retry"}
                        </button>
                        <button
                          onClick={() => handleEasySlip(doc.id)}
                          disabled={processing[doc.id]}
                          className="text-xs px-2.5 py-1.5 border border-zinc-300 text-zinc-600 rounded-md hover:bg-zinc-50 disabled:opacity-50"
                        >
                          ☁️ EasySlip
                        </button>
                      </>
                    )}
                    {doc.processing_status === "failed" && (
                      <>
                        <button
                          onClick={() => handleProcess(doc.id)}
                          disabled={processing[doc.id]}
                          className="text-xs px-2.5 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800"
                        >
                          {processing[doc.id] ? "⏳..." : "🔄 Retry"}
                        </button>
                        <button
                          onClick={() => handleEasySlip(doc.id)}
                          disabled={processing[doc.id]}
                          className="text-xs px-2.5 py-1.5 border border-zinc-300 text-zinc-600 rounded-md hover:bg-zinc-50"
                        >
                          ☁️ EasySlip
                        </button>
                      </>
                    )}
                    {doc.processing_status === "uploaded" && (
                      <button
                        onClick={() => handleProcess(doc.id)}
                        disabled={processing[doc.id]}
                        className="text-xs px-2.5 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {processing[doc.id] ? "⏳..." : "▶️ Process"}
                      </button>
                    )}
                    <span className="text-xs text-zinc-400 font-mono">{doc.id.slice(0, 8)}</span>
                  </div>
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
