import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alpha",
  description: "A production-ready application foundation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
