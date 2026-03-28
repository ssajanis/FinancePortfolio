import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FinanceOS",
  description: "Personal finance management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#0a0f0d", color: "#e8f5e9" }} className="min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto px-8 py-6">{children}</main>
      </body>
    </html>
  );
}
