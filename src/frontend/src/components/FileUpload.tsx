"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  /** รับหลายไฟล์พร้อมกัน */
  onUpload: (files: File[]) => Promise<void>;
}

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const handleFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      const files = Array.from(rawFiles).filter((f) => ALLOWED.includes(f.type));
      const invalid = Array.from(rawFiles).length - files.length;

      if (files.length === 0) {
        setMessage("❌ รองรับเฉพาะ jpg, png, pdf");
        return;
      }

      setUploading(true);
      setPendingCount(files.length);
      setMessage(null);

      try {
        await onUpload(files);
        setMessage(
          files.length === 1
            ? `✅ เพิ่ม 1 รูปเข้าคิวแล้ว`
            : `✅ เพิ่ม ${files.length} รูปเข้าคิวแล้ว${invalid > 0 ? ` (ข้าม ${invalid} ไฟล์ไม่รองรับ)` : ""}`
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ";
        setMessage(`❌ ${msg}`);
      } finally {
        setUploading(false);
        setPendingCount(0);
      }
    },
    [onUpload]
  );

  const openPicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,application/pdf";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleFiles(files);
    };
    input.click();
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={openPicker}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer select-none ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
      >
        {uploading ? (
          <div className="text-zinc-500">
            <p className="text-2xl mb-2">⏳</p>
            <p className="text-sm">
              กำลังเพิ่ม {pendingCount} รูปเข้าคิว...
            </p>
          </div>
        ) : (
          <div className="text-zinc-500">
            <p className="text-3xl mb-2">📤</p>
            <p className="text-sm font-medium">
              ลากหลายไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              รองรับ jpg, png, pdf · เลือกหลายไฟล์พร้อมกันได้
            </p>
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
