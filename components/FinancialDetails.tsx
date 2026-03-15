"use client";

import { StockData } from "@/types/finance";

interface FinancialDetailsProps {
  data: StockData;
}

function formatCurrency(n: number | null, currency: string): string {
  if (n === null) return "—";
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
  if (n === null) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

function formatNumber(n: number | null, decimals = 2): string {
  if (n === null) return "—";
  return n.toFixed(decimals);
}

export default function FinancialDetails({ data }: FinancialDetailsProps) {
  const f = data.fundamentals;
  if (!f) return null;

  const currency = f.currency;
  const symbol = currency === "BRL" ? "R$" : "$";
  const hist = data.historical;

  // Price stats
  const latest = hist.length > 0 ? hist[hist.length - 1] : null;
  const first = hist.length > 0 ? hist[0] : null;
  const high52w = hist.length > 0 ? Math.max(...hist.map((h) => h.high)) : null;
  const low52w = hist.length > 0 ? Math.min(...hist.map((h) => h.low)) : null;
  const avgVolume =
    hist.length > 0
      ? hist.reduce((sum, h) => sum + h.volume, 0) / hist.length
      : null;

  const priceChange =
    latest && first ? ((latest.close - first.close) / first.close) * 100 : null;

  const totalDividends = data.dividends.reduce((s, d) => s + d.amount, 0);
  const dividendYield =
    latest && totalDividends > 0
      ? (totalDividends / latest.close) * 100
      : null;

  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
        {data.ticker} — Financial Overview
      </h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Price & Trading */}
        <div>
          <h4 className="mb-2 text-xs font-medium text-gray-500 uppercase">
            Price & Trading
          </h4>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-800">
              <Row label="Current Price" value={latest ? `${symbol}${latest.close.toFixed(2)}` : "—"} />
              <Row
                label="Period Change"
                value={priceChange !== null ? `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%` : "—"}
                valueClass={priceChange !== null ? (priceChange >= 0 ? "text-green-400" : "text-red-400") : undefined}
              />
              <Row label="Period High" value={high52w !== null ? `${symbol}${high52w.toFixed(2)}` : "—"} />
              <Row label="Period Low" value={low52w !== null ? `${symbol}${low52w.toFixed(2)}` : "—"} />
              <Row label="Avg Volume" value={avgVolume !== null ? formatCurrency(avgVolume, "").replace("$", "").replace("R$", "") : "—"} />
              <Row label="Total Dividends" value={totalDividends > 0 ? `${symbol}${totalDividends.toFixed(2)}` : "—"} />
              <Row label="Dividend Yield" value={dividendYield !== null ? `${dividendYield.toFixed(2)}%` : "—"} />
            </tbody>
          </table>
        </div>

        {/* Fundamentals */}
        <div>
          <h4 className="mb-2 text-xs font-medium text-gray-500 uppercase">
            Fundamentals
          </h4>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-800">
              <Row label="Market Cap" value={formatCurrency(f.marketCap, currency)} />
              <Row label="P/E Ratio (TTM)" value={formatNumber(f.trailingPE)} />
              <Row label="EPS (TTM)" value={formatNumber(f.trailingEPS)} />
              <Row label="Revenue" value={formatCurrency(f.totalRevenue, currency)} />
              <Row label="Net Income" value={formatCurrency(f.netIncome, currency)} />
              <Row label="Profit Margin" value={formatPercent(f.profitMargin)} />
              <Row label="Free Cash Flow" value={formatCurrency(f.freeCashFlow, currency)} />
              <Row label="Operating CF" value={formatCurrency(f.operatingCashFlow, currency)} />
              <Row label="ROE" value={formatPercent(f.returnOnEquity)} />
              <Row label="Total Debt" value={formatCurrency(f.totalDebt, currency)} />
              <Row label="Net Debt" value={formatCurrency(f.netDebt, currency)} />
              <Row label="Debt/Equity" value={f.debtToEquity !== null ? f.debtToEquity.toFixed(2) : "—"} />
              <Row label="Book Value" value={formatNumber(f.bookValue)} />
              <Row label="P/B" value={formatNumber(f.priceToBook)} />
              <Row label="Dividend Yield" value={formatPercent(f.dividendYield)} />
              <Row label="Payout Ratio" value={formatPercent(f.payoutRatio)} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual Financials Table */}
      {f.annualFinancials.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-xs font-medium text-gray-500 uppercase">
            Annual Results
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Year</th>
                  <th className="pb-2 pr-4 font-medium text-right">Revenue</th>
                  <th className="pb-2 pr-4 font-medium text-right">Net Income</th>
                  <th className="pb-2 pr-4 font-medium text-right">EPS</th>
                  <th className="pb-2 pr-4 font-medium text-right">FCF</th>
                  <th className="pb-2 pr-4 font-medium text-right">DPS</th>
                  <th className="pb-2 font-medium text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {[...f.annualFinancials].reverse().map((af) => {
                  const margin =
                    af.totalRevenue && af.netIncome
                      ? (af.netIncome / af.totalRevenue) * 100
                      : null;
                  return (
                    <tr key={af.date} className="text-gray-300">
                      <td className="py-1.5 pr-4 text-gray-400">
                        {af.date.slice(0, 4)}
                      </td>
                      <td className="py-1.5 pr-4 text-right">
                        {formatCurrency(af.totalRevenue, currency)}
                      </td>
                      <td
                        className={`py-1.5 pr-4 text-right ${
                          af.netIncome !== null && af.netIncome < 0
                            ? "text-red-400"
                            : ""
                        }`}
                      >
                        {formatCurrency(af.netIncome, currency)}
                      </td>
                      <td className="py-1.5 pr-4 text-right">
                        {formatNumber(af.basicEPS)}
                      </td>
                      <td className={`py-1.5 pr-4 text-right ${af.freeCashFlow !== null && af.freeCashFlow < 0 ? "text-red-400" : ""}`}>
                        {formatCurrency(af.freeCashFlow, currency)}
                      </td>
                      <td className="py-1.5 pr-4 text-right">
                        {af.dividendPerShare !== null ? formatNumber(af.dividendPerShare) : "—"}
                      </td>
                      <td className="py-1.5 text-right">
                        {margin !== null ? `${margin.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <tr>
      <td className="py-1.5 text-gray-500">{label}</td>
      <td className={`py-1.5 text-right font-medium ${valueClass ?? "text-gray-200"}`}>
        {value}
      </td>
    </tr>
  );
}
