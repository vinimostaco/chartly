"use client";

import { AnnualFinancials, FundamentalsData } from "@/types/finance";

interface DividendHistoryChartProps {
  annualData: AnnualFinancials[];
  fundamentals: FundamentalsData;
}

function formatNumber(n: number | null): string {
  if (n === null) return "N/A";
  return n.toFixed(2);
}

function formatPercent(n: number | null): string {
  if (n === null) return "N/A";
  return `${(n * 100).toFixed(2)}%`;
}

export default function DividendHistoryChart({ annualData, fundamentals }: DividendHistoryChartProps) {
  const withDividends = annualData.filter((d) => d.dividendPerShare !== null && d.dividendPerShare > 0);
  if (withDividends.length === 0) return null;

  const symbol = fundamentals.currency === "BRL" ? "R$" : "$";
  const maxDPS = Math.max(...withDividends.map((d) => d.dividendPerShare!), 0.01);

  // Dividend growth 5Y CAGR
  let divGrowth5Y: number | null = null;
  if (withDividends.length >= 6) {
    const end = withDividends[withDividends.length - 1].dividendPerShare!;
    const start = withDividends[withDividends.length - 6].dividendPerShare!;
    if (start > 0 && end > 0) {
      divGrowth5Y = (Math.pow(end / start, 1 / 5) - 1) * 100;
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Dividend History
        </h3>
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span>Yield: <span className="text-gray-300">{formatPercent(fundamentals.dividendYield)}</span></span>
          <span>Payout: <span className="text-gray-300">{formatPercent(fundamentals.payoutRatio)}</span></span>
          {divGrowth5Y !== null && (
            <span>Growth 5Y: <span className={divGrowth5Y >= 0 ? "text-green-400" : "text-red-400"}>{divGrowth5Y >= 0 ? "+" : ""}{divGrowth5Y.toFixed(1)}%</span></span>
          )}
        </div>
      </div>

      <div className="relative" style={{ height: 120 }}>
        <div className="absolute inset-0 flex items-end gap-1 px-1">
          {withDividends.map((d) => {
            const pct = (d.dividendPerShare! / maxDPS) * 100;
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center h-full">
                <div className="flex w-full items-end flex-1 min-h-0">
                  <div
                    className="flex-1 rounded-t bg-teal-500/70 hover:bg-teal-500 transition-colors cursor-default"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    title={`${symbol}${d.dividendPerShare!.toFixed(2)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex px-1 mt-2 gap-1">
        {withDividends.map((d) => (
          <div key={d.date} className="flex-1 text-center min-w-0">
            <div className="text-[10px] font-medium text-gray-400 truncate">
              {d.date.slice(0, 4)}
            </div>
            <div className="text-[9px] text-teal-400 truncate">
              {symbol}{d.dividendPerShare!.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
