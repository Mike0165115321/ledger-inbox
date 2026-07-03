"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  XCircle,
  PauseCircle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import { api, QueueStatus } from "@/lib/api";
import Badge from "@/components/ui/Badge";

interface Props {
  onQueueEmpty?: () => void;
}

export default function QueueStatusBar({ onQueueEmpty }: Props) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [lastTick, setLastTick] = useState<number>(0);
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
      // backend not ready
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 3000);
    tickRef.current = setInterval(() => setLastTick((t) => t + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!status) {
    return (
      <div className="rounded-xl border border-border bg-surface-alt p-4 animate-pulse">
        <div className="h-4 bg-skeleton rounded w-1/3 mb-3" />
        <div className="h-2 bg-skeleton rounded w-full" />
      </div>
    );
  }

  const {
    queue_size,
    is_processing,
    rate_limited,
    requests_today,
    rpm_used,
    tpm_used,
    rpm_limit,
    tpm_limit,
    rpd_limit,
    last_error,
  } = status;

  // Status config
  const stateInfo = rate_limited
    ? {
        color: "border-border bg-warning-bg",
        dot: "bg-amber-400 animate-pulse",
        label: "Rate Limited — รอ backoff",
        labelColor: "text-warning",
        icon: <PauseCircle className="w-4 h-4 text-warning" />,
      }
    : is_processing
    ? {
        color: "border-border bg-info-bg",
        dot: "bg-blue-500 animate-pulse",
        label: "กำลังส่ง Gemini...",
        labelColor: "text-info",
        icon: <Loader2 className="w-4 h-4 text-info animate-spin" />,
      }
    : queue_size > 0
    ? {
        color: "border-border bg-info-bg",
        dot: "bg-blue-400",
        label: `รอในคิว ${queue_size} รูป`,
        labelColor: "text-info",
        icon: <Clock className="w-4 h-4 text-info" />,
      }
    : {
        color: "border-border bg-surface",
        dot: "bg-emerald-400",
        label: "พร้อม",
        labelColor: "text-success",
        icon: <CheckCircle2 className="w-4 h-4 text-success" />,
      };

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-colors ${stateInfo.color}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${stateInfo.dot}`} />
          <span className={`text-sm font-medium flex items-center gap-1.5 ${stateInfo.labelColor}`}>
            {stateInfo.icon}
            {stateInfo.label}
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
        {queue_size > 0 && (
          <Badge variant="default" size="sm">
            คิว {queue_size} รูป
          </Badge>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Metric
          label="RPM"
          used={rpm_used}
          limit={rpm_limit}
          formatVal={(v) => String(v)}
          color={rpm_used / rpm_limit >= 0.87 ? "red" : rpm_used / rpm_limit >= 0.6 ? "amber" : "emerald"}
          sublabel="ใน 60 วินาที"
        />
        <Metric
          label="TPM"
          used={tpm_used}
          limit={tpm_limit}
          formatVal={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v))}
          color={tpm_used / tpm_limit >= 0.8 ? "amber" : "zinc"}
          sublabel="โทเคน/นาที"
        />
        <Metric
          label="RPD"
          used={requests_today}
          limit={rpd_limit}
          formatVal={(v) => String(v)}
          color={requests_today / rpd_limit >= 0.8 ? "amber" : "zinc"}
          sublabel="วันนี้ทั้งหมด"
        />
      </div>

      {/* Alerts */}
      {rate_limited && (
        <div className="flex items-center gap-2 text-xs text-warning bg-warning-bg rounded-lg px-3 py-2">
          <PauseCircle className="w-4 h-4 shrink-0" />
          <span>โดน 429 — รอ 15 วินาทีแล้วส่งต่ออัตโนมัติ</span>
        </div>
      )}

      {requests_today / rpd_limit >= 0.8 && !rate_limited && (
        <div className="flex items-center gap-2 text-xs text-warning bg-warning-bg rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>ใกล้ถึง limit รายวัน ({requests_today}/{rpd_limit}) — เหลือ {rpd_limit - requests_today} request</span>
        </div>
      )}

      {last_error && !rate_limited && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger-bg rounded-lg px-3 py-2">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-all">{last_error}</span>
        </div>
      )}
    </div>
  );
}

// ── Metric component ──────────────────────────────────────────

const BAR_COLORS = {
  red: "bg-danger",
  amber: "bg-warning",
  emerald: "bg-success",
  blue: "bg-info",
  zinc: "bg-text-muted",
};

function Metric({
  label,
  used,
  limit,
  formatVal,
  color,
  sublabel,
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
    color === "red"
      ? "text-danger"
      : color === "amber"
      ? "text-warning"
      : color === "emerald"
      ? "text-success"
      : "text-text";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted font-medium flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {label}
        </span>
        <span className={`text-xs font-mono font-semibold ${textColor}`}>
          {formatVal(used)}
          <span className="text-text-subtle">/{formatVal(limit)}</span>
        </span>
      </div>
      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-text-subtle">{sublabel}</p>
    </div>
  );
}
