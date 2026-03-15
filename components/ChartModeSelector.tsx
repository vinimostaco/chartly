"use client";

import { ChartMode } from "@/types/finance";

interface ChartModeSelectorProps {
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
}

const modes: { value: ChartMode; label: string }[] = [
  { value: "raw", label: "Price" },
  { value: "adjusted", label: "Adjusted" },
  { value: "totalReturn", label: "Total Return" },
];

export default function ChartModeSelector({ mode, onModeChange }: ChartModeSelectorProps) {
  return (
    <div className="flex rounded-lg border border-gray-700 overflow-hidden">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onModeChange(m.value)}
          className={`px-4 py-1.5 text-sm font-medium transition ${
            mode === m.value
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-gray-200"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
