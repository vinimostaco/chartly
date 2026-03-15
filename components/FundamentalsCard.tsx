"use client";

import { FundamentalsData } from "@/types/finance";

interface FundamentalsCardProps {
  fundamentals: FundamentalsData;
}

function formatLargeNumber(n: number | null, currency: string): string {
  if (n === null) return "N/A";
  const symbol = currency === "BRL" ? "R$" : "$";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${symbol}${abs.toFixed(2)}`;
}

function formatPercent(n: number | null): string {
  if (n === null) return "N/A";
  return `${(n * 100).toFixed(2)}%`;
}

function formatNumber(n: number | null): string {
  if (n === null) return "N/A";
  return n.toFixed(2);
}

export default function FundamentalsCard({ fundamentals }: FundamentalsCardProps) {
  const { currency } = fundamentals;

  const row1 = [
    { label: "Market Cap", value: formatLargeNumber(fundamentals.marketCap, currency) },
    { label: "P/E (TTM)", value: formatNumber(fundamentals.trailingPE) },
    { label: "EPS (TTM)", value: formatNumber(fundamentals.trailingEPS) },
    { label: "Revenue", value: formatLargeNumber(fundamentals.totalRevenue, currency) },
    { label: "Net Income", value: formatLargeNumber(fundamentals.netIncome, currency) },
    { label: "Profit Margin", value: formatPercent(fundamentals.profitMargin) },
  ];

  const row2 = [
    { label: "Free Cash Flow", value: formatLargeNumber(fundamentals.freeCashFlow, currency) },
    { label: "ROE", value: formatPercent(fundamentals.returnOnEquity) },
    { label: "Debt/Equity", value: fundamentals.debtToEquity !== null ? fundamentals.debtToEquity.toFixed(2) : "N/A" },
    { label: "Book Value", value: formatNumber(fundamentals.bookValue) },
    { label: "P/B", value: formatNumber(fundamentals.priceToBook) },
    { label: "Shares Out.", value: formatLargeNumber(fundamentals.sharesOutstanding, "") },
  ];

  const row3 = [
    { label: "Operating CF", value: formatLargeNumber(fundamentals.operatingCashFlow, currency) },
    { label: "Total Debt", value: formatLargeNumber(fundamentals.totalDebt, currency) },
    { label: "Net Debt", value: formatLargeNumber(fundamentals.netDebt, currency) },
    { label: "Dividend Rate", value: fundamentals.dividendRate !== null ? `${currency === "BRL" ? "R$" : "$"}${fundamentals.dividendRate.toFixed(2)}` : "N/A" },
    { label: "Dividend Yield", value: formatPercent(fundamentals.dividendYield) },
    { label: "Payout Ratio", value: formatPercent(fundamentals.payoutRatio) },
  ];

  const renderRow = (metrics: { label: string; value: string }[]) => (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
      {metrics.map((m) => (
        <div key={m.label}>
          <div className="text-xs text-gray-500">{m.label}</div>
          <div className={`text-sm font-medium ${m.value === "N/A" ? "text-gray-600" : "text-gray-100"}`}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Fundamentals
      </h3>
      <div className="space-y-4">
        {renderRow(row1)}
        {renderRow(row2)}
        {renderRow(row3)}
      </div>
    </section>
  );
}
