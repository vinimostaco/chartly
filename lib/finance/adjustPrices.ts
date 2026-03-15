import { HistoricalDataPoint, DividendEvent, ChartDataPoint } from "@/types/finance";

/**
 * Adjusts historical prices for dividends using backward cumulative adjustment.
 *
 * When a dividend of amount D is paid on date X with closing price P,
 * all prices before date X are multiplied by the factor (P - D) / P.
 * This removes the artificial "drop" caused by dividend payments,
 * making the chart reflect continuous price performance.
 *
 * Dividends are applied from most recent to oldest so that
 * the adjustment factors compound correctly.
 */
export function adjustPricesForDividends(
  historical: HistoricalDataPoint[],
  dividends: DividendEvent[]
): ChartDataPoint[] {
  if (dividends.length === 0) {
    return historical.map((d) => ({ time: d.date, value: d.close }));
  }

  // Work with a copy of closing prices
  const prices = historical.map((d) => ({
    date: d.date,
    close: d.close,
  }));

  // Build a date->index lookup for finding closing prices
  const dateIndex = new Map<string, number>();
  prices.forEach((p, i) => dateIndex.set(p.date, i));

  // Sort dividends most recent first
  const sortedDividends = [...dividends].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const div of sortedDividends) {
    // Find the closing price on the ex-dividend date (or nearest prior trading day)
    let closeOnDate: number | null = null;
    let divDateObj = new Date(div.date);

    // Look for the exact date or up to 5 days before (for weekends/holidays)
    for (let offset = 0; offset < 5; offset++) {
      const checkDate = new Date(divDateObj);
      checkDate.setDate(checkDate.getDate() - offset);
      const dateStr = checkDate.toISOString().split("T")[0];
      const idx = dateIndex.get(dateStr);
      if (idx !== undefined) {
        closeOnDate = prices[idx].close;
        break;
      }
    }

    if (closeOnDate === null || closeOnDate <= div.amount) continue;

    const factor = (closeOnDate - div.amount) / closeOnDate;

    // Multiply all prices strictly before the dividend date
    for (const p of prices) {
      if (p.date < div.date) {
        p.close *= factor;
      }
    }
  }

  return prices.map((p) => ({ time: p.date, value: p.close }));
}
