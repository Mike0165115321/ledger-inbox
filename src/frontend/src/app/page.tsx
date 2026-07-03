"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import { api, DashboardSummary } from "@/lib/api";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboardSummary()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        กำลังโหลด...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500">⚠️ {error}</p>
        <p className="text-sm text-zinc-400">
          ตรวจสอบว่า Backend รันอยู่ที่ http://localhost:8000
        </p>
      </div>
    );
  }

  if (!data) return null;

  const hasData = data.transaction_count > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">แดชบอร์ด</h1>
        <p className="text-zinc-500 mt-1">ภาพรวมการเงินของคุณ</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="รายรับรวม"
          value={formatMoney(data.total_income)}
          color="green"
          subtitle={hasData ? "รายได้ทั้งหมด" : undefined}
        />
        <StatCard
          title="รายจ่ายรวม"
          value={formatMoney(data.total_expense)}
          color="red"
          subtitle={hasData ? "ค่าใช้จ่ายทั้งหมด" : undefined}
        />
        <StatCard
          title="กำไร"
          value={formatMoney(data.profit)}
          color={data.profit >= 0 ? "blue" : "red"}
          trend={data.profit >= 0 ? "up" : "down"}
          subtitle={`${data.transaction_count} รายการ`}
        />
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="text-center py-20 bg-white rounded-xl border border-zinc-200">
          <p className="text-4xl mb-4">📝</p>
          <h3 className="text-lg font-semibold text-zinc-700">
            ยังไม่มีรายการ
          </h3>
          <p className="text-zinc-400 mt-1">
            ไปที่หน้า{" "}
            <a href="/transactions" className="text-blue-600 underline">
              รายการ
            </a>{" "}
            เพื่อเริ่มบันทึกรายรับ/รายจ่าย
          </p>
        </div>
      ) : (
        <>
          {/* Monthly Breakdown */}
          {data.monthly_breakdown.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-zinc-800 mb-3">
                แยกตามเดือน
              </h2>
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-zinc-500">
                        เดือน
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-zinc-500">
                        รายรับ
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-zinc-500">
                        รายจ่าย
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-zinc-500">
                        คงเหลือ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly_breakdown.map((m) => (
                      <tr
                        key={m.month}
                        className="border-b border-zinc-100 hover:bg-zinc-50"
                      >
                        <td className="px-4 py-2.5 text-zinc-700">{m.month}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">
                          {formatMoney(m.income)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-red-500 font-medium">
                          {formatMoney(m.expense)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-zinc-800">
                          {formatMoney(m.income - m.expense)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Top Projects */}
          {data.top_projects.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-zinc-800 mb-3">
                Top Projects (by Revenue)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.top_projects.map((p) => (
                  <div
                    key={p.project_id}
                    className="bg-white rounded-xl border border-zinc-200 p-4"
                  >
                    <p className="text-sm font-medium text-zinc-500">
                      Project #{p.project_id.slice(0, 8)}...
                    </p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-emerald-600">
                        +{formatMoney(p.income)}
                      </span>
                      <span className="text-red-500">
                        -{formatMoney(p.expense)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
