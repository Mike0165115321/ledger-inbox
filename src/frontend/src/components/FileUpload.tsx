"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, Loader2, X, FileText, Image, AlertTriangle } from "lucide-react";

interface FileUploadProps {
  /** รับหลายไฟล์พร้อมกัน */
  onUpload: (files: File[]) => Promise<void>;
}

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: File[]) => {
    const valid = files.filter((f) => ALLOWED.includes(f.type));
    const invalid = files.length - valid.length;
    return { valid, invalid };
  }, []);

  const handleFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      const files = Array.from(rawFiles);
      const { valid, invalid } = validateFiles(files);

      if (valid.length === 0) {
        setMessage({ text: "รองรับเฉพาะ jpg, png, pdf", type: "error" });
        return;
      }

      // Show selected files before uploading
      setSelectedFiles(valid);

      setUploading(true);
      setProgress({ current: 0, total: valid.length });
      setMessage(null);

      try {
        await onUpload(valid);
        setMessage({
          text: `เพิ่ม ${valid.length} รูป${valid.length > 1 ? "" : ""}เข้าคิวแล้ว${
            invalid > 0 ? ` (ข้าม ${invalid} ไฟล์ไม่รองรับ)` : ""
          }`,
          type: "success",
        });
        setSelectedFiles([]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ";
        setMessage({ text: msg, type: "error" });
      } finally {
        setUploading(false);
        setProgress({ current: 0, total: 0 });
      }
    },
    [onUpload, validateFiles]
  );

  const openPicker = () => {
    inputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-5 h-5 text-info" />;
    return <FileText className="w-5 h5 text-danger" />;
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={openPicker}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer select-none overflow-hidden ${
          dragOver
            ? "border-info bg-info-bg"
            : uploading
            ? "border-border bg-surface-muted"
            : "border-border hover:border-border hover:bg-surface-hover"
        }`}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-info/10 backdrop-blur-sm z-10">
            <div className="text-center">
              <Upload className="w-10 h-10 mx-auto mb-2 text-info" />
              <p className="text-sm font-medium text-info">
                วางไฟล์ที่นี่
              </p>
            </div>
          </div>
        )}

        {uploading ? (
          <div className="text-text-muted">
            <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin" />
            <p className="text-sm">
              กำลังเพิ่ม {progress.current}/{progress.total} รูปเข้าคิว...
            </p>
            {/* Simple progress bar */}
            <div className="mt-3 h-1.5 bg-surface-muted rounded-full max-w-xs mx-auto overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-text-muted">
            <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">
              ลากหลายไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <p className="text-xs text-text-subtle mt-1">
              รองรับ jpg, png, pdf · เลือกหลายไฟล์พร้อมกันได้
            </p>
          </div>
        )}
      </div>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="space-y-1.5">
          <p className="text-xs text-text-muted font-medium">
            ไฟล์ที่เลือก ({selectedFiles.length} ไฟล์)
          </p>
          {selectedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 bg-surface-muted rounded-lg text-sm"
            >
              {getFileIcon(file.type)}
              <span className="flex-1 truncate text-text">
                {file.name}
              </span>
              <span className="text-xs text-text-subtle shrink-0">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="p-0.5 text-text-subtle hover:text-danger rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all ${
            message.type === "success"
              ? "bg-success-bg text-success"
              : "bg-danger-bg text-danger"
          }`}
        >
          {message.type === "success" ? (
            <Upload className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
