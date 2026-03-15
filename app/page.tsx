"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChartMode, Timeframe, StockData, ChartSeries } from "@/types/finance";
import { fetchStockData } from "@/lib/api/fetchStockData";
import { adjustPricesForDividends, calculateTotalReturnSeries } from "@/lib/finance";
import Chart from "@/components/Chart";
import TickerSearch from "@/components/TickerSearch";
import ChartModeSelector from "@/components/ChartModeSelector";
import TimeframeSelector from "@/components/TimeframeSelector";
import StockInfo from "@/components/StockInfo";
import LoadingSpinner from "@/components/LoadingSpinner";
import FundamentalsCard from "@/components/FundamentalsCard";
import EarningsChart from "@/components/EarningsChart";
import FinancialDetails from "@/components/FinancialDetails";
import ComparisonTable from "@/components/ComparisonTable";
import GrowthMetrics from "@/components/GrowthMetrics";
import DividendHistoryChart from "@/components/DividendHistoryChart";
import PERatioHistoryChart from "@/components/PERatioHistoryChart";
import FinancialComparisonTable from "@/components/FinancialComparisonTable";

const SERIES_COLORS = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
];

export default function Home() {
  const [tickers, setTickers] = useState<string[]>(["AAPL"]);
  const [timeframe, setTimeframe] = useState<Timeframe>("1Y");
  const [chartMode, setChartMode] = useState<ChartMode>("raw");
  const [stocksMap, setStocksMap] = useState<Map<string, StockData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data for all tickers
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setIsLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          tickers.map((t) => fetchStockData(t, timeframe))
        );
        if (!cancelled) {
          const map = new Map<string, StockData>();
          results.forEach((r) => map.set(r.ticker, r));
          setStocksMap(map);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [tickers, timeframe]);

  const stocks = useMemo(
    () => tickers.map((t) => stocksMap.get(t)).filter((s): s is StockData => !!s),
    [tickers, stocksMap]
  );

  const isComparing = stocks.length > 1;
  const primaryStock = stocks[0] ?? null;

  // Build chart series for all stocks
  const seriesList: ChartSeries[] = useMemo(() => {
    return stocks.map((s, i) => {
      let data;
      switch (chartMode) {
        case "raw":
          data = s.historical.map((d) => ({ time: d.date, value: d.close }));
          break;
        case "adjusted":
          data = adjustPricesForDividends(s.historical, s.dividends);
          break;
        case "totalReturn":
          data = calculateTotalReturnSeries(s.historical, s.dividends);
          break;
      }
      return {
        ticker: s.ticker,
        data,
        color: SERIES_COLORS[i % SERIES_COLORS.length],
      };
    });
  }, [stocks, chartMode]);

  const handleSearch = useCallback((ticker: string) => {
    setTickers((prev) => {
      if (prev.includes(ticker)) return prev;
      return [...prev, ticker];
    });
  }, []);

  const handleRemoveTicker = useCallback((ticker: string) => {
    setTickers((prev) => {
      const next = prev.filter((t) => t !== ticker);
      return next.length > 0 ? next : prev;
    });
  }, []);

  const handleClearComparison = useCallback(() => {
    setTickers((prev) => [prev[0]]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight text-gray-100">
            Chartly
          </h1>
          <div className="flex-1 max-w-lg">
            <TickerSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Active tickers */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {tickers.map((t, i) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-sm"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
              />
              <span className="text-gray-200">{t}</span>
              {tickers.length > 1 && (
                <button
                  onClick={() => handleRemoveTicker(t)}
                  className="ml-0.5 text-gray-500 hover:text-gray-300 transition-colors"
                  title={`Remove ${t}`}
                >
                  x
                </button>
              )}
            </span>
          ))}
          {tickers.length > 1 && (
            <button
              onClick={handleClearComparison}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear comparison
            </button>
          )}
        </div>

        {/* Stock info for primary */}
        {!isComparing && primaryStock && (
          <StockInfo ticker={primaryStock.ticker} data={primaryStock} />
        )}

        {/* Controls */}
        <div className="mb-4 flex items-center justify-between">
          <ChartModeSelector mode={chartMode} onModeChange={setChartMode} />
          <TimeframeSelector timeframe={timeframe} onTimeframeChange={setTimeframe} />
        </div>

        {/* Chart area */}
        {error ? (
          <div className="flex items-center justify-center rounded-lg border border-red-900/50 bg-red-950/30 py-20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <Chart
              seriesList={seriesList}
              dividends={!isComparing ? (primaryStock?.dividends ?? []) : []}
              showMarkers={!isComparing && chartMode !== "totalReturn"}
            />

            {/* Comparison mode */}
            {isComparing && (
              <>
                <ComparisonTable
                  stocks={stocks}
                  colors={stocks.map((_, i) => SERIES_COLORS[i % SERIES_COLORS.length])}
                />
                <FinancialComparisonTable
                  stocks={stocks}
                  colors={stocks.map((_, i) => SERIES_COLORS[i % SERIES_COLORS.length])}
                />
              </>
            )}

            {/* Single stock details */}
            {!isComparing && primaryStock && (
              <>
                {primaryStock.fundamentals &&
                  (primaryStock.fundamentals.annualFinancials.length > 0 ||
                    primaryStock.fundamentals.quarterlyFinancials.length > 0) && (
                    <EarningsChart
                      annualData={primaryStock.fundamentals.annualFinancials}
                      quarterlyData={primaryStock.fundamentals.quarterlyFinancials}
                      currency={primaryStock.fundamentals.currency}
                    />
                  )}

                <FinancialDetails data={primaryStock} />

                {primaryStock.fundamentals && (
                  <>
                    <FundamentalsCard fundamentals={primaryStock.fundamentals} />

                    {primaryStock.fundamentals.annualFinancials.length >= 2 && (
                      <GrowthMetrics annualData={primaryStock.fundamentals.annualFinancials} />
                    )}

                    <DividendHistoryChart
                      annualData={primaryStock.fundamentals.annualFinancials}
                      fundamentals={primaryStock.fundamentals}
                    />

                    <PERatioHistoryChart
                      annualData={primaryStock.fundamentals.annualFinancials}
                      historical={primaryStock.historical}
                      currentPE={primaryStock.fundamentals.trailingPE}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
