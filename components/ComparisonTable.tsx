"use client";

import { StockData } from "@/types/finance";

interface ComparisonTableProps {
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

function num(n: number | null | undefined, d = 2): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(d);
}

export default function ComparisonTable({ stocks, colors }: ComparisonTableProps) {
  if (stocks.length < 2) return null;

  const rows: { label: string; values: { text: string; className?: string }[] }[] = [];

  // Price info
  rows.push({
    label: "Current Price",
    values: stocks.map((s) => {
      const cur = s.fundamentals?.currency ?? "USD";
      const sym = cur === "BRL" ? "R$" : "$";
      const latest = s.historical[s.historical.length - 1];
      return { text: latest ? `${sym}${latest.close.toFixed(2)}` : "—" };
    }),
  });

  rows.push({
    label: "Period Change",
    values: stocks.map((s) => {
      if (s.historical.length < 2) return { text: "—" };
      const first = s.historical[0].close;
      const last = s.historical[s.historical.length - 1].close;
      const change = ((last - first) / first) * 100;
      return {
        text: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        className: change >= 0 ? "text-green-400" : "text-red-400",
      };
    }),
  });

  // Fundamentals
  rows.push({
    label: "Market Cap",
    values: stocks.map((s) => ({
      text: fmt(s.fundamentals?.marketCap, s.fundamentals?.currency ?? "USD"),
    })),
  });

  rows.push({
    label: "P/E (TTM)",
    values: stocks.map((s) => ({ text: num(s.fundamentals?.trailingPE) })),
  });

  rows.push({
    label: "EPS (TTM)",
    values: stocks.map((s) => ({ text: num(s.fundamentals?.trailingEPS) })),
  });

  rows.push({
    label: "Revenue",
    values: stocks.map((s) => ({
      text: fmt(s.fundamentals?.totalRevenue, s.fundamentals?.currency ?? "USD"),
    })),
  });

  rows.push({
    label: "Net Income",
    values: stocks.map((s) => {
      const ni = s.fundamentals?.netIncome;
      return {
        text: fmt(ni, s.fundamentals?.currency ?? "USD"),
        className: ni !== null && ni !== undefined && ni < 0 ? "text-red-400" : undefined,
      };
    }),
  });

  rows.push({
    label: "Profit Margin",
    values: stocks.map((s) => ({ text: pct(s.fundamentals?.profitMargin) })),
  });

  rows.push({
    label: "Dividends (Period)",
    values: stocks.map((s) => {
      const total = s.dividends.reduce((sum, d) => sum + d.amount, 0);
      const cur = s.fundamentals?.currency ?? "USD";
      const sym = cur === "BRL" ? "R$" : "$";
      return { text: total > 0 ? `${sym}${total.toFixed(2)}` : "—" };
    }),
  });

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Comparison
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="py-1.5 pr-4 text-gray-500">{row.label}</td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={`py-1.5 px-3 text-right font-medium ${v.className ?? "text-gray-200"}`}
                  >
                    {v.text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
