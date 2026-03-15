"use client";

import { Timeframe } from "@/types/finance";

interface TimeframeSelectorProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

const timeframes: Timeframe[] = ["1M", "6M", "1Y", "5Y", "MAX"];

export default function TimeframeSelector({
  timeframe,
  onTimeframeChange,
}: TimeframeSelectorProps) {
  return (
    <div className="flex gap-1">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onTimeframeChange(tf)}
          className={`rounded px-3 py-1 text-xs font-medium transition ${
            timeframe === tf
              ? "bg-gray-600 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
