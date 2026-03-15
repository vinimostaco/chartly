"use client";

import { StockData, AnnualFinancials } from "@/types/finance";

interface FinancialComparisonTableProps {
  stocks: StockData[];
  colors: string[];
}

function fmt(n: number | null | undefined, currency: string): string {
  if (n === null || n === undefined) return "—";
  const symbol = currency === "BRL" ? "R$" : "$";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${symbol}${abs.toFixed(2)}`;
}

function pct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

function growthFmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
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

function fcfMargin(s: StockData): number | null {
  const fcf = s.fundamentals?.freeCashFlow;
  const rev = s.fundamentals?.totalRevenue;
  if (fcf === null || fcf === undefined || rev === null || rev === undefined || rev === 0) return null;
  return fcf / rev;
}

type MetricValue = number | null | undefined;

interface MetricRow {
  label: string;
  values: MetricValue[];
  format: (v: MetricValue, stock: StockData) => string;
  colorFn?: (v: MetricValue) => string | undefined;
  higherIsBetter: boolean;
}

function bestPerformer(row: MetricRow, stocks: StockData[]): string {
  let bestIdx = -1;
  let bestVal: number | null = null;

  for (let i = 0; i < row.values.length; i++) {
    const v = row.values[i];
    if (v === null || v === undefined) continue;
    if (bestVal === null) {
      bestVal = v;
      bestIdx = i;
    } else if (row.higherIsBetter ? v > bestVal : v < bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  }

  if (bestIdx === -1) return "—";

  const ticker = stocks[bestIdx].ticker;
  const qualifier = row.higherIsBetter ? "highest" : "lowest";
  return `${ticker} ${qualifier}`;
}

export default function FinancialComparisonTable({ stocks, colors }: FinancialComparisonTableProps) {
  if (stocks.length < 2) return null;

  const sections: { title: string; rows: MetricRow[] }[] = [
    {
      title: "Profitability",
      rows: [
        {
          label: "Return on Equity",
          values: stocks.map((s) => s.fundamentals?.returnOnEquity ?? null),
          format: (v) => pct(v),
          higherIsBetter: true,
        },
        {
          label: "Free Cash Flow (TTM)",
          values: stocks.map((s) => s.fundamentals?.freeCashFlow ?? null),
          format: (v, s) => fmt(v, s.fundamentals?.currency ?? "USD"),
          colorFn: (v) => (v !== null && v !== undefined && v < 0 ? "text-red-400" : undefined),
          higherIsBetter: true,
        },
        {
          label: "FCF Margin",
          values: stocks.map((s) => fcfMargin(s)),
          format: (v) => pct(v),
          higherIsBetter: true,
        },
      ],
    },
    {
      title: "Growth",
      rows: [
        {
          label: "Revenue Growth YoY",
          values: stocks.map((s) => calcYoY(s.fundamentals?.annualFinancials ?? [], "totalRevenue")),
          format: (v) => growthFmt(v),
          colorFn: (v) => (v !== null && v !== undefined ? (v >= 0 ? "text-green-400" : "text-red-400") : undefined),
          higherIsBetter: true,
        },
        {
          label: "Net Income Growth YoY",
          values: stocks.map((s) => calcYoY(s.fundamentals?.annualFinancials ?? [], "netIncome")),
          format: (v) => growthFmt(v),
          colorFn: (v) => (v !== null && v !== undefined ? (v >= 0 ? "text-green-400" : "text-red-400") : undefined),
          higherIsBetter: true,
        },
        {
          label: "EPS Growth YoY",
          values: stocks.map((s) => calcYoY(s.fundamentals?.annualFinancials ?? [], "basicEPS")),
          format: (v) => growthFmt(v),
          colorFn: (v) => (v !== null && v !== undefined ? (v >= 0 ? "text-green-400" : "text-red-400") : undefined),
          higherIsBetter: true,
        },
        {
          label: "Revenue CAGR (5Y)",
          values: stocks.map((s) => calcCAGR(s.fundamentals?.annualFinancials ?? [], "totalRevenue", 5)),
          format: (v) => growthFmt(v),
          colorFn: (v) => (v !== null && v !== undefined ? (v >= 0 ? "text-green-400" : "text-red-400") : undefined),
          higherIsBetter: true,
        },
        {
          label: "EPS CAGR (5Y)",
          values: stocks.map((s) => calcCAGR(s.fundamentals?.annualFinancials ?? [], "basicEPS", 5)),
          format: (v) => growthFmt(v),
          colorFn: (v) => (v !== null && v !== undefined ? (v >= 0 ? "text-green-400" : "text-red-400") : undefined),
          higherIsBetter: true,
        },
      ],
    },
    {
      title: "Financial Health",
      rows: [
        {
          label: "Debt to Equity",
          values: stocks.map((s) => s.fundamentals?.debtToEquity ?? null),
          format: (v) => (v !== null && v !== undefined ? v.toFixed(2) : "—"),
          higherIsBetter: false,
        },
        {
          label: "Net Debt",
          values: stocks.map((s) => s.fundamentals?.netDebt ?? null),
          format: (v, s) => fmt(v, s.fundamentals?.currency ?? "USD"),
          higherIsBetter: false,
        },
        {
          label: "Operating Cash Flow",
          values: stocks.map((s) => s.fundamentals?.operatingCashFlow ?? null),
          format: (v, s) => fmt(v, s.fundamentals?.currency ?? "USD"),
          colorFn: (v) => (v !== null && v !== undefined && v < 0 ? "text-red-400" : undefined),
          higherIsBetter: true,
        },
      ],
    },
  ];

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Financial Strength & Growth Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="pb-2 pr-4 text-left text-xs font-medium text-gray-500" />
              {stocks.map((s, i) => (
                <th key={s.ticker} className="pb-2 px-3 text-right text-xs font-medium">
                  <span className="flex items-center justify-end gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: colors[i] }}
                    />
                    <span className="text-gray-200">{s.ticker}</span>
                  </span>
                </th>
              ))}
              <th className="pb-2 px-3 text-right text-xs font-medium text-gray-500">
                Δ Best Performer
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <SectionBlock
                key={section.title}
                title={section.title}
                rows={section.rows}
                stocks={stocks}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SectionBlock({
  title,
  rows,
  stocks,
}: {
  title: string;
  rows: MetricRow[];
  stocks: StockData[];
}) {
  return (
    <>
      <tr>
        <td
          colSpan={stocks.length + 2}
          className="pt-4 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest"
        >
          {title}
        </td>
      </tr>
      {rows.map((row) => {
        const best = bestPerformer(row, stocks);
        return (
          <tr key={row.label} className="border-t border-gray-800/50">
            <td className="py-1.5 pr-4 text-gray-500">{row.label}</td>
            {row.values.map((v, i) => {
              const colorClass = row.colorFn?.(v);
              return (
                <td
                  key={i}
                  className={`py-1.5 px-3 text-right font-medium ${colorClass ?? "text-gray-200"}`}
                >
                  {row.format(v, stocks[i])}
                </td>
              );
            })}
            <td className="py-1.5 px-3 text-right text-xs text-gray-500 italic">
              {best}
            </td>
          </tr>
        );
      })}
    </>
  );
}
