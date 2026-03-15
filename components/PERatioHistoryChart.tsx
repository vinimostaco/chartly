"use client";

import { AnnualFinancials, HistoricalDataPoint } from "@/types/finance";

interface PERatioHistoryChartProps {
  annualData: AnnualFinancials[];
  historical: HistoricalDataPoint[];
  currentPE: number | null;
}

export default function PERatioHistoryChart({ annualData, historical, currentPE }: PERatioHistoryChartProps) {
  // Calculate historical P/E using year-end price / EPS
  const peData: { year: string; pe: number }[] = [];

  for (const af of annualData) {
    if (af.basicEPS === null || af.basicEPS <= 0) continue;
    const year = af.date.slice(0, 4);
    // Find closest year-end price
    const yearEndPrices = historical.filter((h) => h.date.startsWith(year));
    if (yearEndPrices.length === 0) continue;
    const yearEndPrice = yearEndPrices[yearEndPrices.length - 1].close;
    const pe = yearEndPrice / af.basicEPS;
    if (pe > 0 && pe < 200) {
      peData.push({ year, pe });
    }
  }

  if (peData.length < 2) return null;

  const peValues = peData.map((d) => d.pe);
  const minPE = Math.min(...peValues);
  const maxPE = Math.max(...peValues);
  const avgPE = peValues.reduce((s, v) => s + v, 0) / peValues.length;
  const range = Math.max(maxPE - minPE, 1);
  const padding = range * 0.15;
  const chartMin = Math.max(0, minPE - padding);
  const chartMax = maxPE + padding;
  const chartRange = chartMax - chartMin;

  // SVG line points
  const points = peData.map((d, i) => {
    const x = ((i + 0.5) / peData.length) * 1000;
    const y = 1000 - ((d.pe - chartMin) / chartRange) * 1000;
    return { x, y, pe: d.pe };
  });

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          P/E Ratio History
        </h3>
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span>Current: <span className="text-gray-300">{currentPE !== null ? currentPE.toFixed(1) : "N/A"}</span></span>
          <span>Avg: <span className="text-gray-300">{avgPE.toFixed(1)}</span></span>
          <span>Min: <span className="text-gray-300">{minPE.toFixed(1)}</span></span>
          <span>Max: <span className="text-gray-300">{maxPE.toFixed(1)}</span></span>
        </div>
      </div>

      <div className="relative" style={{ height: 120 }}>
        {/* Average line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-gray-700"
          style={{ top: `${100 - ((avgPE - chartMin) / chartRange) * 100}%` }}
        />

        {/* P/E line */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Dots + labels */}
        <div className="absolute inset-0 pointer-events-none">
          {points.map((p, i) => {
            const xPct = (p.x / 1000) * 100;
            const yPct = (p.y / 1000) * 100;
            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
              >
                <span className="text-[9px] font-medium text-indigo-400 -mt-3">
                  {p.pe.toFixed(1)}
                </span>
                <span className="block h-[5px] w-[5px] rounded-full bg-indigo-400" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Year labels */}
      <div className="flex px-1 mt-2 gap-1">
        {peData.map((d) => (
          <div key={d.year} className="flex-1 text-center min-w-0">
            <div className="text-[10px] font-medium text-gray-400 truncate">{d.year}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
