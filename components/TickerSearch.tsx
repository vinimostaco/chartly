"use client";

import { useState, FormEvent } from "react";

interface TickerSearchProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

export default function TickerSearch({ onSearch, isLoading }: TickerSearchProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (ticker) {
      onSearch(ticker);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search ticker (e.g. AAPL, WEGE3, PETR4)"
        disabled={isLoading}
        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
      >
        {isLoading ? "Loading..." : "Search"}
      </button>
    </form>
  );
}
