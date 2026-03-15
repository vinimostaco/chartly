"use client";

import { StockData } from "@/types/finance";

interface StockInfoProps {
  ticker: string;
  data: StockData | null;
}

export default function StockInfo({ ticker, data }: StockInfoProps) {
  if (!data || data.historical.length === 0) {
    return (
      <div className="py-2">
        <h2 className="text-2xl font-bold text-gray-100">{ticker}</h2>
      </div>
    );
  }

  const currency = data.fundamentals?.currency ?? "USD";
  const symbol = currency === "BRL" ? "R$" : "$";

  const latest = data.historical[data.historical.length - 1];
  const first = data.historical[0];
  const change = latest.close - first.close;
  const changePercent = (change / first.close) * 100;
  const totalDividends = data.dividends.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-2">
      <h2 className="text-2xl font-bold text-gray-100">{ticker}</h2>
      <span className="text-2xl font-semibold text-gray-100">
        {symbol}{latest.close.toFixed(2)}
      </span>
      <span
        className={`text-sm font-medium ${
          change >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)} ({changePercent >= 0 ? "+" : ""}
        {changePercent.toFixed(2)}%)
      </span>
      {totalDividends > 0 && (
        <span className="text-sm text-gray-500">
          Dividends: {symbol}{totalDividends.toFixed(2)}
        </span>
      )}
    </div>
  );
}
