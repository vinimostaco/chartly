"use client";

import { useEffect, useRef } from "react";
import { ChartSeries, DividendEvent } from "@/types/finance";

interface ChartProps {
  seriesList: ChartSeries[];
  dividends?: DividendEvent[];
  showMarkers?: boolean;
}

export default function Chart({ seriesList, dividends = [], showMarkers = false }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || seriesList.length === 0) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    async function initChart() {
      const { createChart, LineSeries, AreaSeries, createSeriesMarkers } = await import("lightweight-charts");

      if (disposed || !containerRef.current) return;

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      const isMulti = seriesList.length > 1;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { color: "#0a0a0f" },
          textColor: "#9ca3af",
        },
        grid: {
          vertLines: { color: "#1f2937" },
          horzLines: { color: "#1f2937" },
        },
        timeScale: {
          borderColor: "#374151",
          timeVisible: false,
        },
        rightPriceScale: {
          borderColor: "#374151",
          // For multi-stock comparison, use percentage mode
          ...(isMulti ? { mode: 1 } : {}),
        },
        crosshair: {
          vertLine: { color: "#4b5563", labelBackgroundColor: "#374151" },
          horzLine: { color: "#4b5563", labelBackgroundColor: "#374151" },
        },
      });

      // Store series references for tooltip
      const seriesRefs: { ticker: string; color: string; series: unknown }[] = [];

      for (const s of seriesList) {
        if (isMulti) {
          // Use line series for multi-stock comparison
          const series = chart.addSeries(LineSeries, {
            color: s.color,
            lineWidth: 2,
            priceFormat: { type: "percent" as const },
          });
          series.setData(s.data as { time: string; value: number }[]);
          seriesRefs.push({ ticker: s.ticker, color: s.color, series });
        } else {
          // Use line series for single stock
          const series = chart.addSeries(LineSeries, {
            color: s.color,
            lineWidth: 2,
          });
          series.setData(s.data as { time: string; value: number }[]);
          seriesRefs.push({ ticker: s.ticker, color: s.color, series });

          // Dividend markers for single stock
          if (showMarkers && dividends.length > 0) {
            const dataDateSet = new Set(s.data.map((d) => d.time));
            const markers = dividends
              .filter((d) => dataDateSet.has(d.date))
              .map((d) => ({
                time: d.date as string,
                position: "belowBar" as const,
                shape: "circle" as const,
                color: "#22c55e",
                text: `$${d.amount.toFixed(2)}`,
              }));
            if (markers.length > 0) {
              createSeriesMarkers(series, markers);
            }
          }
        }
      }

      chart.timeScale().fitContent();

      // Tooltip
      const dividendMap = new Map<string, number>();
      for (const d of dividends) {
        dividendMap.set(d.date, (dividendMap.get(d.date) ?? 0) + d.amount);
      }

      chart.subscribeCrosshairMove((param) => {
        const tooltip = tooltipRef.current;
        if (!tooltip) return;

        const p = param as {
          time?: string;
          point?: { x: number; y: number };
          seriesData: Map<unknown, { value?: number }>;
        };

        if (!p.time || !p.point) {
          tooltip.style.display = "none";
          return;
        }

        const lines: string[] = [];
        lines.push(`<div class="text-xs text-gray-400 mb-1">${p.time}</div>`);

        for (const ref of seriesRefs) {
          const val = p.seriesData.get(ref.series);
          if (val && val.value !== undefined) {
            const displayVal = isMulti
              ? `${val.value >= 0 ? "+" : ""}${val.value.toFixed(2)}%`
              : `$${val.value.toFixed(2)}`;
            lines.push(
              `<div class="flex items-center gap-1.5 text-sm">` +
                `<span class="inline-block h-2 w-2 rounded-full" style="background:${ref.color}"></span>` +
                `<span class="text-gray-400">${ref.ticker}</span>` +
                `<span class="font-medium text-gray-100 ml-auto">${displayVal}</span>` +
              `</div>`
            );
          }
        }

        if (!isMulti) {
          const divAmount = dividendMap.get(p.time as string);
          if (divAmount) {
            lines.push(`<div class="text-xs text-green-400 mt-1">Dividend: $${divAmount.toFixed(2)}</div>`);
          }
        }

        tooltip.style.display = "block";
        tooltip.style.left = `${p.point.x + 16}px`;
        tooltip.style.top = `${p.point.y - 16}px`;
        tooltip.innerHTML = lines.join("");
      });

      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          chart.applyOptions({ width: entry.contentRect.width });
        }
      });
      resizeObserver.observe(containerRef.current!);

      chartRef.current = chart;
    }

    initChart();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [seriesList, dividends, showMarkers]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-10 rounded-lg border border-gray-700 bg-gray-800/95 px-3 py-2 shadow-lg backdrop-blur-sm"
        style={{ display: "none" }}
      />
      {/* Legend for multi-stock */}
      {seriesList.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4">
          {seriesList.map((s) => (
            <span key={s.ticker} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.ticker}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
