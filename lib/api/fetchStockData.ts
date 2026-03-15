import { StockData, Timeframe } from "@/types/finance";

export async function fetchStockData(
  ticker: string,
  timeframe: Timeframe
): Promise<StockData> {
  const res = await fetch(`/api/stock/${encodeURIComponent(ticker)}?period=${timeframe}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch data (${res.status})`);
  }

  return res.json();
}
