"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const allowed = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowed.includes(file.type)) {
        setMessage("❌ รองรับเฉพาะ jpg, png, pdf");
        return;
      }
      setUploading(true);
      setMessage(null);
      try {
        await onUpload(file);
        setMessage("✅ อัปโหลดสำเร็จ");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ";
        setMessage(`❌ ${msg}`);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/jpeg,image/png,application/pdf";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        {uploading ? (
          <div className="text-zinc-500">
            <p className="text-2xl mb-2">⏳</p>
            <p className="text-sm">กำลังอัปโหลด...</p>
          </div>
        ) : (
          <div className="text-zinc-500">
            <p className="text-2xl mb-2">📤</p>
            <p className="text-sm font-medium">
              ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <p className="text-xs text-zinc-400 mt-1">รองรับ jpg, png, pdf</p>
          </div>
        )}
      </div>

      {message && (
        <p
          className={`text-sm px-3 py-2 rounded-lg ${
            message.startsWith("✅")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
