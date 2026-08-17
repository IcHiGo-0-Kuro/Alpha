import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alpha — Scheduled access",
  description: "Schedule when your selected apps are available.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
