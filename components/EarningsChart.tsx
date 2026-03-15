"use client";

import { AnnualFinancials } from "@/types/finance";

interface EarningsChartProps {
  data: AnnualFinancials[];
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

export default function EarningsChart({ data, currency }: EarningsChartProps) {
  if (data.length === 0) return null;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.totalRevenue ?? 0, Math.abs(d.netIncome ?? 0))),
    1
  );

  // Compute net margin for each year
  const margins = data.map((d) => {
    if (d.totalRevenue && d.netIncome) {
      return (d.netIncome / d.totalRevenue) * 100;
    }
    return null;
  });
  const validMargins = margins.filter((m): m is number => m !== null);
  const maxMargin = validMargins.length > 0 ? Math.max(...validMargins.map(Math.abs)) : 50;
  // Scale margin to 0-100 range for positioning (center at 50% if no negatives)
  const marginScale = Math.max(maxMargin, 1);

  // Build SVG line points for net margin
  const barChartHeight = 140;
  const linePoints = data
    .map((_, i) => {
      const m = margins[i];
      if (m === null) return null;
      // x: center of each bar group
      const x = ((i + 0.5) / data.length) * 100;
      // y: inverted (0% margin = bottom, maxMargin = top)
      const y = 100 - (m / marginScale) * 100;
      return `${x},${y}`;
    })
    .filter(Boolean);

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
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
            <span className="inline-block h-1 w-3 rounded bg-amber-400" />
            Net Margin
          </span>
        </div>
      </div>

      <div className="relative" style={{ height: barChartHeight }}>
        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-2 px-1">
          {data.map((year, i) => {
            const revenue = year.totalRevenue ?? 0;
            const income = year.netIncome ?? 0;
            const revPct = (revenue / maxVal) * 100;
            const incPct = (Math.abs(income) / maxVal) * 100;
            const margin = margins[i];

            return (
              <div key={year.date} className="flex flex-1 flex-col items-center h-full">
                <div className="flex w-full items-end gap-0.5 flex-1 min-h-0">
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
                </div>
              </div>
            );
          })}
        </div>

        {/* Net Margin line overlay */}
        {linePoints.length >= 2 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ height: barChartHeight }}
          >
            <polyline
              points={linePoints.join(" ")}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots on each data point */}
            {data.map((_, i) => {
              const m = margins[i];
              if (m === null) return null;
              const x = ((i + 0.5) / data.length) * 100;
              const y = 100 - (m / marginScale) * 100;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="#f59e0b"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        )}

        {/* Margin % labels */}
        <div className="absolute inset-0 flex items-end gap-2 px-1 pointer-events-none">
          {data.map((year, i) => {
            const m = margins[i];
            if (m === null) return <div key={year.date} className="flex-1" />;
            const yPos = 100 - (m / marginScale) * 100;
            return (
              <div key={year.date} className="relative flex-1">
                <span
                  className="absolute left-1/2 -translate-x-1/2 text-[9px] font-medium text-amber-400 whitespace-nowrap"
                  style={{ bottom: `${100 - yPos + 3}%` }}
                >
                  {m.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Year labels */}
      <div className="flex gap-2 px-1 mt-1">
        {data.map((year) => (
          <div key={year.date} className="flex-1 text-center text-[10px] text-gray-500">
            {year.date.slice(0, 4)}
          </div>
        ))}
      </div>
    </section>
  );
}
