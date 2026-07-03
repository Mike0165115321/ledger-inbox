"use client";

import { useEffect, useState } from "react";
import {
  Calculator,
  ReceiptText,
  Landmark,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  User,
  Wallet,
  Plus,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, TaxCalculationResponse } from "@/lib/api";

/* ─── Helper ─────────────────────────────────────────────────── */
function formatMoney(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/* ─── Year helpers ───────────────────────────────────────────── */
function getThaiYears(): number[] {
  const current = new Date().getFullYear() + 543; // Buddhist year
  return [current, current - 1];
}

function thaiToCE(thaiYear: number): number {
  return thaiYear - 543;
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function TaxPage() {
  const [data, setData] = useState<TaxCalculationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(getThaiYears()[0]);

  const fetchTax = (thaiYear: number) => {
    setLoading(true);
    const ceYear = thaiToCE(thaiYear);
    api
      .getTaxCalculation(ceYear)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTax(selectedYear);
  }, [selectedYear]);

  /* ── Loading State ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  /* ── Error State ──────────────────────────────────────────── */
  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-danger" />
          <h2 className="text-lg font-semibold text-text mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-sm text-text-muted mb-4">{error}</p>
        </Card>
      </div>
    );
  }

  /* ── Empty State ──────────────────────────────────────────── */
  if (!data) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="text-center py-16">
          <Calculator className="w-16 h-16 mx-auto mb-4 text-text-subtle" />
          <h3 className="text-lg font-semibold text-text mb-2">
            ไม่มีข้อมูลภาษี
          </h3>
          <p className="text-text-muted mb-6 max-w-md mx-auto">
            เพิ่มรายการรายรับรายจ่ายก่อน เพื่อให้ระบบคำนวณภาษีให้คุณ
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/transactions">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-text-on-accent text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />
                เพิ่มรายการ
              </button>
            </a>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Determine highlight row ──────────────────────────────── */
  const highlightIndex = data.brackets.findIndex(
    (b) => b.taxable > 0 && data.net_taxable_income <= parseFloat(b.label.replace(/[^0-9]/g, "")) * (b.label.includes("ขึ้นไป") ? 1e12 : 1)
  );
  // Simpler: find the bracket that contains the net_taxable_income
  let highlightRow = -1;
  let cumulative = 0;
  for (let i = 0; i < data.brackets.length; i++) {
    const b = data.brackets[i];
    if (b.taxable > 0) {
      cumulative += b.taxable;
      if (data.net_taxable_income <= cumulative) {
        highlightRow = i;
        break;
      }
    }
  }
  // If net_taxable_income exceeds all brackets, highlight last
  if (highlightRow === -1 && data.brackets.length > 0) {
    highlightRow = data.brackets.length - 1;
  }

  /* ── Effective rate color ─────────────────────────────────── */
  const rateColor =
    data.effective_rate < 10
      ? "text-success"
      : data.effective_rate < 20
      ? "text-warning"
      : "text-danger";

  const rateBarColor =
    data.effective_rate < 10
      ? "bg-success"
      : data.effective_rate < 20
      ? "bg-warning"
      : "bg-danger";

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* ════════════════════════════════════════════════════════
          HEADER
         ════════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            วางแผนภาษี
          </h1>
          <p className="text-text-muted mt-1">
            ภาพรวมภาระภาษีและการหักลดหย่อน
          </p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="text-sm rounded-lg border border-border px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {getThaiYears().map((y) => (
            <option key={y} value={y}>
              ปี {y}
            </option>
          ))}
        </select>
      </div>

      {/* ════════════════════════════════════════════════════════
          TWO-COLUMN SECTION
         ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column ────────────────────────────────── */}
        <div className="space-y-4">
          {/* Gross Income */}
          <Card>
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-text-muted">
                รายได้รวม
              </span>
            </div>
            <p className="text-2xl font-bold text-text">
              {formatMoney(data.gross_income)}
            </p>
          </Card>

          {/* Total Expenses */}
          <Card>
            <div className="flex items-center gap-3 mb-1">
              <Wallet className="w-5 h-5 text-danger" />
              <span className="text-sm font-medium text-text-muted">
                รายจ่ายทั้งปี
              </span>
            </div>
            <p className="text-2xl font-bold text-text">
              {formatMoney(data.total_expenses)}
            </p>
          </Card>

          {/* Allowances Section */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-info" />
              <h2 className="text-sm font-semibold text-text">
                ค่าลดหย่อน
              </h2>
            </div>
            <div className="space-y-2">
              {data.allowances.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-sm text-text">{a.label}</span>
                  <Badge variant="default" size="sm">
                    {formatMoney(a.amount)}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
              <span className="text-sm font-semibold text-text">
                รวมค่าลดหย่อน
              </span>
              <span className="text-sm font-bold text-text">
                {formatMoney(data.total_allowances)}
              </span>
            </div>
          </Card>
        </div>

        {/* ── Right Column ───────────────────────────────── */}
        <div className="space-y-4">
          {/* Expense Deduction */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <ReceiptText className="w-5 h-5 text-info" />
              <h2 className="text-sm font-semibold text-text">
                การหักค่าใช้จ่าย
              </h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">
                  หักค่าใช้จ่ายเหมา
                </span>
                <span className="text-sm font-medium text-text">
                  50% ของรายได้
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">
                  สูงสุด 100,000 บาท
                </span>
                <span className="text-sm font-semibold text-success">
                  {formatMoney(data.expense_deduction)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="w-full bg-surface-hover rounded-full h-2.5">
                  <div
                    className="bg-info h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (data.expense_deduction / 100000) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-text-subtle mt-1">
                  {formatMoney(data.expense_deduction)} / ฿100,000
                </p>
              </div>
            </div>
          </Card>

          {/* Net Taxable Income Summary */}
          <Card variant="elevated" className="bg-gradient-to-br from-accent/5 to-accent/10">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">
                  รายได้หลังหักค่าใช้จ่าย
                </span>
                <span className="text-sm font-semibold text-text">
                  {formatMoney(data.income_after_expenses)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">
                  หักค่าลดหย่อน
                </span>
                <span className="text-sm font-semibold text-text">
                  - {formatMoney(data.total_allowances)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-bold text-text">
                  รายได้สุทธิ
                </span>
                <span className="text-base font-bold text-text">
                  {formatMoney(data.net_taxable_income)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          TAX BRACKET TABLE
         ════════════════════════════════════════════════════════ */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            ตารางคำนวณภาษีแบบขั้นบันได
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-medium text-text-muted">
                  ช่วงรายได้
                </th>
                <th className="text-right px-5 py-3 font-medium text-text-muted">
                  อัตรา
                </th>
                <th className="text-right px-5 py-3 font-medium text-text-muted">
                  ฐานภาษี
                </th>
                <th className="text-right px-5 py-3 font-medium text-text-muted">
                  ภาษี
                </th>
              </tr>
            </thead>
            <tbody>
              {data.brackets.map((b, i) => {
                const isHighlighted = i === highlightRow;
                return (
                  <tr
                    key={i}
                    className={`border-b border-border/50 transition-colors ${
                      isHighlighted
                        ? "bg-accent/10 border-accent/30"
                        : "hover:bg-surface-hover"
                    }`}
                  >
                    <td className="px-5 py-3 text-text">
                      <div className="flex items-center gap-2">
                        <span>{b.label}</span>
                        {isHighlighted && (
                          <ChevronDown className="w-3.5 h-3.5 text-accent" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-text-muted">
                      {b.rate_pct}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text">
                      {formatNumber(b.taxable)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text">
                      {b.tax > 0 ? formatNumber(b.tax) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-surface-hover">
                <td className="px-5 py-3 font-semibold text-text">
                  รวม
                </td>
                <td />
                <td className="px-5 py-3 text-right font-semibold text-text">
                  {formatNumber(data.net_taxable_income)}
                </td>
                <td className="px-5 py-3 text-right font-bold text-text">
                  {formatNumber(data.total_tax)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* ════════════════════════════════════════════════════════
          SUMMARY: TOTAL TAX + EFFECTIVE RATE
         ════════════════════════════════════════════════════════ */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Tax */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-5 h-5 text-danger" />
              <span className="text-sm font-medium text-text-muted">
                ภาษีที่ต้องชำระ
              </span>
            </div>
            <p className="text-3xl font-bold text-text">
              {formatMoney(data.total_tax)}
            </p>
          </div>

          {/* Effective Rate */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-5 h-5 ${rateColor}`} />
              <span className="text-sm font-medium text-text-muted">
                อัตราภาษีที่แท้จริง
              </span>
            </div>
            <p className={`text-3xl font-bold ${rateColor}`}>
              {data.effective_rate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress bar for effective rate */}
        {data.effective_rate > 0 && (
          <div className="mt-4">
            <div className="w-full bg-surface-hover rounded-full h-3">
              <div
                className={`${rateBarColor} h-3 rounded-full transition-all duration-700`}
                style={{
                  width: `${Math.min(data.effective_rate * 3, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-text-subtle">0%</span>
              <span className="text-xs text-text-subtle">
                {data.effective_rate.toFixed(1)}%
              </span>
              <span className="text-xs text-text-subtle">35%</span>
            </div>
          </div>
        )}

        {/* Disclaimer Note */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-warning-bg">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning-text">{data.note}</p>
        </div>
      </Card>
    </div>
  );
}
