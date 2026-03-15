import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { StockData, Timeframe, FundamentalsData } from "@/types/finance";

export const runtime = "nodejs";

const yahooFinance = new YahooFinance();

// Brazilian tickers: 4 letters + 1-2 digits + optional F (e.g. WEGE3, PETR4, BBDC11, VALE3F)
function resolveYahooTicker(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (/^[A-Z]{4}\d{1,2}F?$/.test(upper)) {
    return `${upper}.SA`;
  }
  return upper;
}

function getStartDate(period: Timeframe): Date {
  const now = new Date();
  switch (period) {
    case "1M":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "6M":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1Y":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case "5Y":
      return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    case "MAX":
      return new Date(1970, 0, 1);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const period = (request.nextUrl.searchParams.get("period") || "1Y") as Timeframe;
  const yahooTicker = resolveYahooTicker(ticker);

  try {
    const startDate = getStartDate(period);

    // Fetch chart data and fundamentals in parallel
    const [chartResult, summaryResult, financialsResult] = await Promise.allSettled([
      yahooFinance.chart(yahooTicker, {
        period1: startDate,
        period2: new Date(),
        interval: "1d",
        events: "div",
      }),
      yahooFinance.quoteSummary(yahooTicker, {
        modules: ["financialData", "defaultKeyStatistics", "summaryDetail"],
      }),
      yahooFinance.fundamentalsTimeSeries(yahooTicker, {
        period1: new Date(new Date().getFullYear() - 10, 0, 1),
        type: "annual",
        module: "financials",
      }),
    ]);

    // Chart data is required
    if (chartResult.status === "rejected") {
      throw chartResult.reason;
    }

    const result = chartResult.value;

    // Deduplicate by date (keep last entry per date) and sort ascending
    const historicalMap = new Map<string, StockData["historical"][0]>();
    for (const q of result.quotes || []) {
      const date = new Date(q.date).toISOString().split("T")[0];
      historicalMap.set(date, {
        date,
        open: q.open ?? 0,
        high: q.high ?? 0,
        low: q.low ?? 0,
        close: q.close ?? 0,
        volume: q.volume ?? 0,
      });
    }
    const historical = Array.from(historicalMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    // Deduplicate dividends by date (sum amounts if multiple on same date)
    const dividendMap = new Map<string, number>();
    for (const d of result.events?.dividends || []) {
      const date = new Date(d.date).toISOString().split("T")[0];
      dividendMap.set(date, (dividendMap.get(date) ?? 0) + d.amount);
    }
    const dividends = Array.from(dividendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build fundamentals (optional — graceful degradation)
    let fundamentals: FundamentalsData | undefined;

    if (summaryResult.status === "fulfilled") {
      const summary = summaryResult.value;
      const fd = summary.financialData;
      const dks = summary.defaultKeyStatistics;
      const sd = summary.summaryDetail;

      const annualFinancials =
        financialsResult.status === "fulfilled"
          ? financialsResult.value
              .filter((f) => "totalRevenue" in f || "netIncome" in f)
              .map((f) => ({
                date: new Date(f.date).toISOString().split("T")[0],
                totalRevenue: ("totalRevenue" in f ? (f.totalRevenue as number) : null) ?? null,
                netIncome: ("netIncome" in f ? (f.netIncome as number) : null) ?? null,
                basicEPS: ("basicEPS" in f ? (f.basicEPS as number) : null) ?? null,
              }))
              .sort((a, b) => a.date.localeCompare(b.date))
          : [];

      fundamentals = {
        marketCap: sd?.marketCap ?? null,
        trailingPE: sd?.trailingPE ?? null,
        trailingEPS: dks?.trailingEps ?? null,
        totalRevenue: fd?.totalRevenue ?? null,
        netIncome: dks?.netIncomeToCommon ?? null,
        profitMargin: fd?.profitMargins ?? null,
        currency: fd?.financialCurrency ?? sd?.currency ?? "USD",
        annualFinancials,
      };
    }

    const stockData: StockData = {
      ticker: ticker.toUpperCase(),
      historical,
      dividends,
      fundamentals,
    };

    return NextResponse.json(stockData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Not Found") || message.includes("No data")) {
      return NextResponse.json(
        { error: `Ticker "${ticker}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: `Failed to fetch data: ${message}` },
      { status: 500 }
    );
  }
}
