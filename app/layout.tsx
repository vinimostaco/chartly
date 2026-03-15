import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chartly",
  description: "Financial charting tool with dividend-adjusted stock price visualization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
