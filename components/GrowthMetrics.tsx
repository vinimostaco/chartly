"use client";

import { AnnualFinancials } from "@/types/finance";

interface GrowthMetricsProps {
  annualData: AnnualFinancials[];
}

function calcYoY(data: AnnualFinancials[], field: keyof AnnualFinancials): number | null {
  if (data.length < 2) return null;
  const curr = data[data.length - 1][field] as number | null;
  const prev = data[data.length - 2][field] as number | null;
  if (curr === null || prev === null || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function calcCAGR(data: AnnualFinancials[], field: keyof AnnualFinancials, years: number): number | null {
  if (data.length < years + 1) return null;
  const end = data[data.length - 1][field] as number | null;
  const start = data[data.length - 1 - years][field] as number | null;
  if (end === null || start === null || start <= 0 || end <= 0) return null;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

function formatGrowth(n: number | null): string {
  if (n === null) return "N/A";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export default function GrowthMetrics({ annualData }: GrowthMetricsProps) {
  if (annualData.length < 2) return null;

  const metrics = [
    { label: "Revenue YoY", value: calcYoY(annualData, "totalRevenue") },
    { label: "Net Income YoY", value: calcYoY(annualData, "netIncome") },
    { label: "EPS YoY", value: calcYoY(annualData, "basicEPS") },
    { label: "FCF YoY", value: calcYoY(annualData, "freeCashFlow") },
    { label: "Revenue CAGR 5Y", value: calcCAGR(annualData, "totalRevenue", 5) },
    { label: "Net Income CAGR 5Y", value: calcCAGR(annualData, "netIncome", 5) },
  ];

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Growth Metrics
      </h3>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {metrics.map((m) => {
          const formatted = formatGrowth(m.value);
          const colorClass =
            m.value === null
              ? "text-gray-600"
              : m.value >= 0
                ? "text-green-400"
                : "text-red-400";
          return (
            <div key={m.label}>
              <div className="text-xs text-gray-500">{m.label}</div>
              <div className={`text-sm font-medium ${colorClass}`}>{formatted}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
