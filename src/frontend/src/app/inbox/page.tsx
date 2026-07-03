"use client";

import { useEffect, useState } from "react";
import { api, Document as DocType } from "@/lib/api";
import FileUpload from "@/components/FileUpload";

export default function InboxPage() {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = () => {
    api
      .getDocuments()
      .then((data) => setDocs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (file: File) => {
    await api.uploadDocument(file);
    fetchDocs();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">กล่องหลักฐาน</h1>
        <p className="text-zinc-500 mt-1">
          อัปโหลดสลิป ใบเสร็จ หรือเอกสารการเงิน
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-medium text-zinc-600 mb-3">อัปโหลดเอกสาร</h2>
        <FileUpload onUpload={handleUpload} />
        <p className="text-xs text-zinc-400 mt-3">
          💡 Week 1: เก็บไฟล์อย่างเดียว — AI อ่านสลิปจะมาใน Week 2
        </p>
      </div>

      {/* Uploaded Documents */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-800 mb-3">
          เอกสารที่อัปโหลดแล้ว
        </h2>

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
              <div
                key={doc.id}
                className="bg-white rounded-lg border border-zinc-200 px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {doc.processing_status === "uploaded"
                        ? "📤 อัปโหลดแล้ว"
                        : doc.processing_status}
                      {doc.uploaded_at &&
                        ` · ${new Date(doc.uploaded_at).toLocaleDateString("th-TH")}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {doc.id.slice(0, 8)}...
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
