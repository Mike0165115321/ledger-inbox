"use client";

import { useEffect, useRef, useState } from "react";
import { api, QueueStatus } from "@/lib/api";

interface Props {
  onQueueEmpty?: () => void;
}

export default function QueueStatusBar({ onQueueEmpty }: Props) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [lastTick, setLastTick] = useState<number>(0); // countdown วินาทีตั้งแต่ request ล่าสุด
  const prevQueueSize = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const s = await api.getQueueStatus();
      setStatus(s);
      if (s.last_processed_at) {
        const elapsed = Math.floor(
          (Date.now() - new Date(s.last_processed_at + "Z").getTime()) / 1000
        );
        setLastTick(elapsed);
      }
      if (prevQueueSize.current > 0 && s.queue_size === 0 && !s.is_processing) {
        onQueueEmpty?.();
      }
      prevQueueSize.current = s.queue_size;
    } catch {
      // backend ยังไม่พร้อม
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 3000);
    // tick counter ทุก 1 วิ (เพื่อ countdown delay)
    tickRef.current = setInterval(() => setLastTick((t) => t + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!status) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 animate-pulse">
        <div className="h-4 bg-zinc-200 rounded w-1/3 mb-3" />
        <div className="h-2 bg-zinc-200 rounded w-full" />
      </div>
    );
  }

  const {
    queue_size, is_processing, rate_limited, rate_limit_reset_at,
    requests_today, rpm_used, tpm_used,
    rpm_limit, tpm_limit, rpd_limit,
    last_processed_at, last_error,
  } = status;

  const DELAY_SEC = 5;
  const delayPct = Math.min((lastTick / DELAY_SEC) * 100, 100);

  // สี dot สถานะ
  const dotColor =
    rate_limited ? "bg-amber-400 animate-pulse"
    : is_processing ? "bg-blue-500 animate-pulse"
    : "bg-emerald-400";

  const statusLabel =
    rate_limited ? "Rate Limited — รอ backoff"
    : is_processing ? "กำลังส่ง Gemini..."
    : queue_size > 0 ? `รอในคิว ${queue_size} รูป`
    : "พร้อม";

  const statusColor =
    rate_limited ? "text-amber-700"
    : is_processing ? "text-blue-700"
    : "text-emerald-700";

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-colors ${
      rate_limited
        ? "border-amber-200 bg-amber-50"
        : is_processing || queue_size > 0
        ? "border-blue-200 bg-blue-50/50"
        : "border-zinc-200 bg-white"
    }`}>

      {/* ─── Header row ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <span className={`text-sm font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          {(is_processing || queue_size > 0) && !rate_limited && (
            <span className="flex gap-0.5 ml-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </div>
        {/* Queue badge */}
        {queue_size > 0 && (
          <span className="text-xs font-mono bg-zinc-900 text-white rounded-full px-2 py-0.5">
            คิว {queue_size} รูป
          </span>
        )}
      </div>

      {/* ─── Metrics grid — RPM / TPM / RPD ──────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">

        {/* RPM */}
        <Metric
          label="RPM"
          used={rpm_used}
          limit={rpm_limit}
          formatVal={(v) => String(v)}
          color={rpm_used / rpm_limit >= 0.87 ? "red" : rpm_used / rpm_limit >= 0.6 ? "amber" : "emerald"}
          sublabel="ใน 60 วินาที"
        />

        {/* TPM — ข้อมูลจริงจาก usageMetadata */}
        <Metric
          label="TPM"
          used={tpm_used}
          limit={tpm_limit}
          formatVal={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)}
          color={tpm_used / tpm_limit >= 0.8 ? "amber" : "zinc"}
          sublabel="โทเคน/นาที"
        />

        {/* RPD */}
        <Metric
          label="RPD"
          used={requests_today}
          limit={rpd_limit}
          formatVal={(v) => String(v)}
          color={requests_today / rpd_limit >= 0.8 ? "amber" : "zinc"}
          sublabel="วันนี้ทั้งหมด"
        />
      </div>

      {/* ─── Alert rows ───────────────────────────────────────────────── */}
      {rate_limited && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
          <span>⏸️</span>
          <span>
            โดน 429 — รอ 15 วินาทีแล้วส่งต่ออัตโนมัติ
            {rate_limit_reset_at && <> (ประมาณ ~15s)</>}
          </span>
        </div>
      )}

      {(requests_today / rpd_limit) >= 0.8 && !rate_limited && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          <span>⚠️</span>
          <span>ใกล้ถึง limit รายวัน ({requests_today}/{rpd_limit}) — เหลือ {rpd_limit - requests_today} request</span>
        </div>
      )}

      {last_error && !rate_limited && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <span className="shrink-0">❌</span>
          <span className="break-all">{last_error}</span>
        </div>
      )}
    </div>
  );
}

// ── Metric column component ───────────────────────────────────────────────────

const BAR_COLORS = {
  red:     "bg-red-500",
  amber:   "bg-amber-400",
  emerald: "bg-emerald-500",
  blue:    "bg-blue-400",
  zinc:    "bg-zinc-400",
};

function Metric({
  label, used, limit, formatVal, color, sublabel,
}: {
  label: string;
  used: number;
  limit: number;
  formatVal: (v: number) => string;
  color: keyof typeof BAR_COLORS;
  sublabel: string;
}) {
  const pct = Math.min(limit > 0 ? (used / limit) * 100 : 0, 100);
  const textColor =
    color === "red"     ? "text-red-600"
    : color === "amber" ? "text-amber-600"
    : color === "emerald" ? "text-emerald-700"
    : "text-zinc-700";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
        <span className={`text-xs font-mono font-semibold ${textColor}`}>
          {formatVal(used)}
          <span className="text-zinc-400">/{formatVal(limit)}</span>
        </span>
      </div>
      <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-400">{sublabel}</p>
    </div>
  );
}

function Spinner({ className = "" }) {
  return (
    <svg className={`w-4 h-4 animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
