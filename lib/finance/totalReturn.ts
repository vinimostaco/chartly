import { HistoricalDataPoint, DividendEvent, ChartDataPoint } from "@/types/finance";

/**
 * Calculates the total return series assuming all dividends are reinvested.
 *
 * Starting with 1 share, on each ex-dividend date the dividend payment
 * (amount * shares) is used to "buy" additional shares at the closing price.
 * The portfolio value on each day is then price * total shares.
 *
 * This shows what an investor would have earned by holding the stock
 * and reinvesting every dividend back into more shares.
 */
export function calculateTotalReturnSeries(
  historical: HistoricalDataPoint[],
  dividends: DividendEvent[]
): ChartDataPoint[] {
  // Build a set of dividend dates for quick lookup
  const dividendMap = new Map<string, number>();
  for (const div of dividends) {
    // Accumulate in case of multiple dividends on same date
    dividendMap.set(div.date, (dividendMap.get(div.date) ?? 0) + div.amount);
  }

  let shares = 1;
  const result: ChartDataPoint[] = [];

  for (const point of historical) {
    // Check if a dividend was paid on this date
    const divAmount = dividendMap.get(point.date);
    if (divAmount && point.close > 0) {
      // Reinvest: buy additional shares with the dividend
      const additionalShares = (divAmount * shares) / point.close;
      shares += additionalShares;
    }

    result.push({
      time: point.date,
      value: point.close * shares,
    });
  }

  return result;
}
