"use client";

import { useState } from "react";
import { AnnualFinancials } from "@/types/finance";

interface EarningsChartProps {
  annualData: AnnualFinancials[];
  quarterlyData: AnnualFinancials[];
  currency: string;
}

function formatCompact(n: number, currency: string): string {
  const symbol = currency === "BRL" ? "R$" : "$";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(1)}M`;
  return `${sign}${symbol}${(abs / 1e3).toFixed(0)}K`;
}

function formatLabel(date: string, isQuarterly: boolean): string {
  if (!isQuarterly) return date.slice(0, 4);
  const d = new Date(date);
  const month = d.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${date.slice(2, 4)}`;
}

export default function EarningsChart({ annualData, quarterlyData, currency }: EarningsChartProps) {
  const [view, setView] = useState<"annual" | "quarterly">("annual");

  const data = view === "annual" ? annualData : quarterlyData;
  if (data.length === 0) return null;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.totalRevenue ?? 0, Math.abs(d.netIncome ?? 0), Math.abs(d.freeCashFlow ?? 0))),
    1
  );

  const margins = data.map((d) => {
    if (d.totalRevenue && d.netIncome) {
      return (d.netIncome / d.totalRevenue) * 100;
    }
    return null;
  });

  const validMargins = margins.filter((m): m is number => m !== null);
  const minMargin = validMargins.length > 0 ? Math.min(...validMargins) : 0;
  const maxMargin = validMargins.length > 0 ? Math.max(...validMargins) : 50;
  const marginRange = Math.max(maxMargin - minMargin, 1);
  const marginPadding = marginRange * 0.3;
  const marginBottom = minMargin - marginPadding;
  const marginTotalRange = maxMargin + marginPadding - marginBottom;

  const marginPoints = data
    .map((_, i) => {
      const m = margins[i];
      if (m === null) return null;
      const xPct = ((i + 0.5) / data.length) * 100;
      const yPct = 100 - ((m - marginBottom) / marginTotalRange) * 100;
      return { x: xPct, y: yPct, margin: m };
    })
    .filter((p): p is { x: number; y: number; margin: number } => p !== null);

  const isQuarterly = view === "quarterly";

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Revenue, Net Income & Margin
          </h3>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-blue-500" />
              Revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />
              Net Income
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-purple-500" />
              FCF
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-3 bg-amber-400" />
              Margin
            </span>
          </div>
        </div>

        {/* Annual / Quarterly switch */}
        <div className="flex rounded-md border border-gray-700 overflow-hidden text-[11px]">
          <button
            onClick={() => setView("annual")}
            className={`px-2.5 py-1 font-medium transition ${
              view === "annual"
                ? "bg-gray-700 text-gray-100"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Annual
          </button>
          <button
            onClick={() => setView("quarterly")}
            disabled={quarterlyData.length === 0}
            className={`px-2.5 py-1 font-medium transition ${
              view === "quarterly"
                ? "bg-gray-700 text-gray-100"
                : "text-gray-500 hover:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            Quarterly
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: 150 }}>
        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1 px-1">
          {data.map((year, i) => {
            const revenue = year.totalRevenue ?? 0;
            const income = year.netIncome ?? 0;
            const fcf = year.freeCashFlow ?? 0;
            const revPct = (revenue / maxVal) * 100;
            const incPct = (Math.abs(income) / maxVal) * 100;
            const fcfPct = (Math.abs(fcf) / maxVal) * 100;
            const margin = margins[i];

            return (
              <div key={year.date} className="flex flex-1 flex-col items-center h-full">
                <div className="flex w-full items-end gap-px flex-1 min-h-0">
                  <div
                    className="flex-1 rounded-t bg-blue-500/70 hover:bg-blue-500 transition-colors cursor-default"
                    style={{ height: `${Math.max(revPct, 1)}%` }}
                    title={`Revenue: ${formatCompact(revenue, currency)}`}
                  />
                  <div
                    className={`flex-1 rounded-t transition-colors cursor-default ${
                      income < 0
                        ? "bg-red-500/70 hover:bg-red-500"
                        : "bg-emerald-500/70 hover:bg-emerald-500"
                    }`}
                    style={{ height: `${Math.max(incPct, 1)}%` }}
                    title={`Net Income: ${formatCompact(income, currency)}${margin !== null ? ` (${margin.toFixed(1)}%)` : ""}`}
                  />
                  <div
                    className={`flex-1 rounded-t transition-colors cursor-default ${
                      fcf < 0
                        ? "bg-red-500/70 hover:bg-red-500"
                        : "bg-purple-500/70 hover:bg-purple-500"
                    }`}
                    style={{ height: `${Math.max(fcfPct, 1)}%` }}
                    title={`FCF: ${formatCompact(fcf, currency)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Net Margin line */}
        {marginPoints.length >= 2 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            <polyline
              points={marginPoints.map((p) => `${p.x * 10},${p.y * 10}`).join(" ")}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Margin dots + labels */}
        {marginPoints.length >= 2 && (
          <div className="absolute inset-0 pointer-events-none">
            {marginPoints.map((p, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <span className="text-[9px] font-medium text-amber-400 -mt-3">
                  {p.margin.toFixed(1)}%
                </span>
                <span className="block h-[6px] w-[6px] rounded-full bg-amber-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Labels + values */}
      <div className={`flex px-1 mt-2 ${isQuarterly ? "gap-0.5" : "gap-2"}`}>
        {data.map((year, i) => {
          const revenue = year.totalRevenue ?? 0;
          const income = year.netIncome ?? 0;
          const fcf = year.freeCashFlow ?? 0;
          const margin = margins[i];
          return (
            <div key={year.date} className="flex-1 text-center min-w-0">
              <div className={`font-medium text-gray-400 truncate ${isQuarterly ? "text-[8px]" : "text-[10px]"}`}>
                {formatLabel(year.date, isQuarterly)}
              </div>
              <div className={`text-blue-400 truncate ${isQuarterly ? "text-[7px]" : "text-[9px]"}`}>
                {formatCompact(revenue, currency)}
              </div>
              <div className={`truncate ${isQuarterly ? "text-[7px]" : "text-[9px]"} ${income < 0 ? "text-red-400" : "text-emerald-400"}`}>
                {formatCompact(income, currency)}
              </div>
              <div className={`truncate ${isQuarterly ? "text-[7px]" : "text-[9px]"} ${fcf < 0 ? "text-red-400" : "text-purple-400"}`}>
                {formatCompact(fcf, currency)}
              </div>
              {margin !== null && !isQuarterly && (
                <div className="text-[9px] text-amber-400">{margin.toFixed(1)}%</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
