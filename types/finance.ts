export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DividendEvent {
  date: string;
  amount: number;
}

export interface AnnualFinancials {
  date: string;
  totalRevenue: number | null;
  netIncome: number | null;
  basicEPS: number | null;
}

export interface FundamentalsData {
  marketCap: number | null;
  trailingPE: number | null;
  trailingEPS: number | null;
  totalRevenue: number | null;
  netIncome: number | null;
  profitMargin: number | null;
  currency: string;
  annualFinancials: AnnualFinancials[];
}

export interface StockData {
  ticker: string;
  historical: HistoricalDataPoint[];
  dividends: DividendEvent[];
  fundamentals?: FundamentalsData;
}

export type ChartMode = "raw" | "adjusted" | "totalReturn";

export type Timeframe = "1M" | "6M" | "1Y" | "5Y" | "MAX";

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface ChartSeries {
  ticker: string;
  data: ChartDataPoint[];
  color: string;
}
