"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowLeftRight,
  Landmark,
  FileText,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  BarChart3,
  ReceiptText,
  RefreshCw,
  Plus,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, DashboardSummary, TaxSummary, TaxCalculationResponse } from "@/lib/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatMoney(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatShortMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0 }).format(n);
}

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function formatThaiDate(period: string): string {
  // period can be "2026-01" or "2026-01-15" or "2026-W03"
  if (period.includes("W")) {
    const [year, week] = period.split("-W");
    return `สัปดาห์ ${parseInt(week)}/${year}`;
  }
  if (period.length === 7) {
    const [y, m] = period.split("-");
    return `${THAI_MONTHS[parseInt(m) - 1]} ${y}`;
  }
  if (period.length === 10) {
    const [y, m, d] = period.split("-");
    return `${parseInt(d)} ${THAI_MONTHS[parseInt(m) - 1]} ${y}`;
  }
  return period;
}

/* ─── Count-Up Animation Hook ─────────────────────────────────── */
function useCountUp(end: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const startVal = prevEnd.current;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (end - startVal) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevEnd.current = end;
      }
    }
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration]);

  return value;
}

/* ─── Sparkline Component ─────────────────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 80;
  const h = 28;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

/* ─── Custom Tooltip ──────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-text mb-1">
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name === "income" ? "รายรับ" : "รายจ่าย"}:{" "}
          {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* ─── CHART COLORS ────────────────────────────────────────────── */
const DONUT_COLORS = [
  "#059669",
  "#2563eb",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#a1a1aa",
];

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [taxData, setTaxData] = useState<TaxSummary | null>(null);
  const [taxCalcData, setTaxCalcData] = useState<TaxCalculationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() + 543); // Thai year

  // Timeline
  const [granularity, setGranularity] = useState<"day" | "week" | "month" | "year">("month");
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const fetchInitial = useCallback(() => {
    setLoading(true);
    Promise.all([api.getDashboardSummary(), api.getTaxSummary(), api.getTaxCalculation()])
      .then(([summary, tax, taxCalc]) => {
        setData(summary);
        setTaxData(tax);
        setTaxCalcData(taxCalc);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fetchTimeline = useCallback(async (g: string) => {
    setTimelineLoading(true);
    try {
      const res = await api.getTimeline({ granularity: g as any });
      const formatted = res.data.map((pt) => ({
        ...pt,
        label: formatThaiDate(pt.period),
      }));
      setTimelineData(formatted);
    } catch {
      // ignore
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitial();
    fetchTimeline("month");
  }, [fetchInitial, fetchTimeline]);

  // Reset timeline on granularity change
  useEffect(() => {
    fetchTimeline(granularity);
  }, [granularity, fetchTimeline]);

  /* ── Loader ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[350px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[250px] rounded-xl" />
          <Skeleton className="h-[250px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-danger" />
          <h2 className="text-lg font-semibold text-text mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-sm text-text-muted mb-4">{error}</p>
          <p className="text-xs text-text-subtle">
            ตรวจสอบว่า Backend รันอยู่ที่ http://localhost:8000
          </p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const hasData = data.transaction_count > 0;

  // For sparklines, extract from monthly_breakdown
  const sparkIncome = data.monthly_breakdown.map((m) => m.income);
  const sparkExpense = data.monthly_breakdown.map((m) => m.expense);
  const sparkProfit = data.monthly_breakdown.map((m) => m.income - m.expense);

  // Monthly breakdown for charts
  const monthlyChartData = data.monthly_breakdown.map((m) => ({
    month: m.month,
    label: THAI_MONTHS[parseInt(m.month.split("-")[1]) - 1] || m.month,
    income: m.income,
    expense: m.expense,
  }));

  // Donut data
  const donutData =
    taxData?.expense_categories
      ?.slice(0, 6)
      .map((c) => ({ name: c.name, value: c.amount })) || [];
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);
  if (taxData && taxData.total_expense - donutTotal > 0) {
    donutData.push({ name: "อื่นๆ", value: taxData.total_expense - donutTotal });
  }

  // Top projects for chart
  const topProjectsData = data.top_projects.slice(0, 5).map((p) => ({
    name: `Project ${p.project_id.slice(0, 6)}...`,
    income: p.income,
    expense: p.expense,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-text">
          แดชบอร์ด
        </h1>
        <p className="text-text-muted mt-1">
          ภาพรวมการเงินของคุณ
        </p>
      </div>

      {!hasData ? (
        /* ── Empty State ──────────────────────────────────── */
        <Card className="text-center py-20">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-text-subtle" />
          <h3 className="text-lg font-semibold text-text mb-2">
            ยังไม่มีข้อมูล
          </h3>
          <p className="text-text-muted mb-6 max-w-md mx-auto">
            เริ่มต้นด้วยการเพิ่มรายการหรืออัปโหลดสลิปเข้าไปในระบบ
            ระบบจะแสดงภาพรวมทางการเงินของคุณ
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/transactions">
              <Button size="lg">
                <Plus className="w-4 h-4" />
                เพิ่มรายการ
              </Button>
            </a>
            <a href="/inbox">
              <Button variant="secondary" size="lg">
                อัปโหลดสลิป
              </Button>
            </a>
          </div>
        </Card>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════
              SECTION 1: HERO STAT CARDS
             ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="รายรับรวม"
              value={formatMoney(data.total_income)}
              color="green"
              gradient
              trend="up"
              subtitle="รายได้ทั้งหมด"
              icon={<TrendingUp className="w-5 h-5 text-success" />}
            />
            <StatCard
              title="รายจ่ายรวม"
              value={formatMoney(data.total_expense)}
              color="red"
              gradient
              trend={data.total_expense > 0 ? "down" : "neutral"}
              subtitle="ค่าใช้จ่ายทั้งหมด"
              icon={<TrendingDown className="w-5 h-5 text-danger" />}
            />
            <StatCard
              title="กำไร"
              value={formatMoney(data.profit)}
              color={data.profit >= 0 ? "blue" : "red"}
              gradient
              trend={data.profit >= 0 ? "up" : "down"}
              subtitle={`${data.transaction_count} รายการ`}
              icon={<DollarSign className="w-5 h-5 text-info" />}
            />
          </div>

          {/* ══════════════════════════════════════════════════
              TAX ALERT
             ══════════════════════════════════════════════════ */}
          {taxCalcData && (
            <a href="/tax" className="block group">
              <Card
                hover
                padding="sm"
                className="transition-all duration-200"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        (taxCalcData.effective_rate || 0) < 10
                          ? "bg-success-bg"
                          : (taxCalcData.effective_rate || 0) < 20
                          ? "bg-warning-bg"
                          : "bg-danger-bg"
                      }`}
                    >
                      <ReceiptText
                        className={`w-5 h-5 ${
                          (taxCalcData.effective_rate || 0) < 10
                            ? "text-success"
                            : (taxCalcData.effective_rate || 0) < 20
                            ? "text-warning"
                            : "text-danger"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">
                        สรุปภาษีปีนี้
                      </p>
                      <p className="text-xs text-text-muted">
                        อัตราภาษีที่แท้จริง:{" "}
                        {taxCalcData.effective_rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-text">
                      {formatMoney(taxCalcData.total_tax)}
                    </p>
                    <p className="text-xs text-text-subtle group-hover:text-accent transition-colors">
                      ดูรายละเอียด →
                    </p>
                  </div>
                </div>
                {/* mini progress bar */}
                {taxCalcData.effective_rate > 0 && (
                  <div className="mt-2 w-full bg-surface-hover rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        (taxCalcData.effective_rate || 0) < 10
                          ? "bg-success"
                          : (taxCalcData.effective_rate || 0) < 20
                          ? "bg-warning"
                          : "bg-danger"
                      }`}
                      style={{
                        width: `${Math.min(
                          (taxCalcData.effective_rate || 0) * 3,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </Card>
            </a>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 2: TIMELINE + DONUT
             ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Chart */}
            <Card padding="none" className="lg:col-span-2 overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold text-text">
                  แนวโน้ม
                </h2>
                {/* Granularity toggle */}
                <div className="flex gap-1 bg-surface-hover rounded-lg p-1">
                  {(["day", "week", "month", "year"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGranularity(g)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        granularity === g
                          ? "bg-surface text-text shadow-sm"
                          : "text-text-muted hover:text-text"
                      }`}
                    >
                      {g === "day"
                        ? "วัน"
                        : g === "week"
                        ? "สัปดาห์"
                        : g === "month"
                        ? "เดือน"
                        : "ปี"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-2" style={{ height: 350 }}>
                {timelineLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-6 h-6 text-text-subtle animate-spin" />
                  </div>
                ) : timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timelineData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatShortMoney}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="income"
                        stroke="#059669"
                        fill="url(#incomeGrad)"
                        strokeWidth={2}
                        animationDuration={1000}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="expense"
                        stroke="#dc2626"
                        fill="url(#expenseGrad)"
                        strokeWidth={2}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">
                    ไม่มีข้อมูลในช่วงเวลานี้
                  </div>
                )}
              </div>
            </Card>

            {/* Donut Chart */}
            <Card padding="none" className="overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <h2 className="text-lg font-semibold text-text">
                  รายจ่ายแยกหมวด
                </h2>
              </div>
              <div style={{ height: 300 }}>
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={800}
                      >
                        {donutData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatMoney(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">
                    ไม่มีข้อมูลรายจ่าย
                  </div>
                )}
              </div>
              {/* Custom legend */}
              {donutData.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {donutData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            DONUT_COLORS[i % DONUT_COLORS.length],
                        }}
                      />
                      <span className="text-xs text-text-muted">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ══════════════════════════════════════════════════
              SECTION 3: INCOME VS EXPENSE BAR + TOP PROJECTS
             ══════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card padding="none" className="overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <h2 className="text-lg font-semibold text-text">
                  รายรับ vs รายจ่าย (รายเดือน)
                </h2>
              </div>
              <div style={{ height: 300 }}>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyChartData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatShortMoney}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        formatter={(value) =>
                          value === "income" ? "รายรับ" : "รายจ่าย"
                        }
                      />
                      <Bar
                        dataKey="income"
                        name="income"
                        fill="#059669"
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                      />
                      <Bar
                        dataKey="expense"
                        name="expense"
                        fill="#dc2626"
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">
                    ไม่มีข้อมูล
                  </div>
                )}
              </div>
            </Card>

            {/* Top Projects Horizontal Bar */}
            <Card padding="none" className="overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <h2 className="text-lg font-semibold text-text">
                  โปรเจกต์ยอดนิยม (รายรับ)
                </h2>
              </div>
              <div style={{ height: 300 }}>
                {topProjectsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProjectsData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatShortMoney}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: any) => formatMoney(Number(value))}
                      />
                      <Bar
                        dataKey="income"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                        animationDuration={800}
                        label={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">
                    ไม่มีข้อมูลโปรเจกต์
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ══════════════════════════════════════════════════
              SECTION 4: TAX SUMMARY
             ══════════════════════════════════════════════════ */}
          {taxData && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-text-muted" />
                  <h2 className="text-lg font-semibold text-text">
                    สรุปภาษี
                  </h2>
                </div>
                {/* Year selector */}
                <select
                  value={taxYear}
                  onChange={(e) => setTaxYear(parseInt(e.target.value))}
                  className="text-sm rounded-lg border border-border px-3 py-1.5 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {[new Date().getFullYear() + 543, new Date().getFullYear() + 542].map(
                    (y) => (
                      <option key={y} value={y}>
                        ปี {y}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-success-bg rounded-xl p-3">
                  <p className="text-xs text-success font-medium">
                    รายได้ทั้งปี
                  </p>
                  <p className="text-lg font-bold text-success mt-1">
                    {formatMoney(taxData.total_income)}
                  </p>
                </div>
                <div className="bg-danger-bg rounded-xl p-3">
                  <p className="text-xs text-danger font-medium">
                    รายจ่ายทั้งปี
                  </p>
                  <p className="text-lg font-bold text-danger mt-1">
                    {formatMoney(taxData.total_expense)}
                  </p>
                </div>
                <div className="bg-info-bg rounded-xl p-3">
                  <p className="text-xs text-info font-medium">
                    กำไรประมาณการ
                  </p>
                  <p
                    className={`text-lg font-bold mt-1 ${
                      taxData.estimated_profit >= 0
                        ? "text-info"
                        : "text-danger"
                    }`}
                  >
                    {formatMoney(taxData.estimated_profit)}
                  </p>
                </div>
                <div className="bg-surface-muted rounded-xl p-3">
                  <p className="text-xs text-text-muted font-medium">
                    จำนวนรายการ
                  </p>
                  <p className="text-lg font-bold text-text mt-1">
                    {taxData.transaction_count.toLocaleString("th-TH")}
                  </p>
                </div>
              </div>

              {taxData.expense_categories.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-text-subtle mb-2 font-medium">
                    หมวดรายจ่ายสูงสุด
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {taxData.expense_categories.slice(0, 6).map((c) => (
                      <Badge key={c.name} variant="default">
                        {c.name}: {formatMoney(c.amount)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-text-subtle italic">
                {taxData.tax_bracket_note}
              </p>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════
              SECTION 5: EXPORT
             ══════════════════════════════════════════════════ */}
          <section>
            <h2 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
              <Download className="w-5 h-5" />
              ส่งออก
            </h2>
            <div className="flex gap-3 flex-wrap">
              <a href={api.exportTransactions("csv")} download>
                <Button variant="secondary" size="md">
                  <FileText className="w-4 h-4" />
                  CSV (รายการทั้งหมด)
                </Button>
              </a>
              <a href={api.exportTransactions("xlsx")} download>
                <Button variant="secondary" size="md">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel (รายการทั้งหมด)
                </Button>
              </a>
              <a href={api.exportTaxSummary()} download>
                <Button variant="primary" size="md">
                  <FileSpreadsheet className="w-4 h-4" />
                  Tax Summary Excel
                </Button>
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
