import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "March Madness 2026 — Bracket Predictor",
  description:
    "Build your 2026 NCAA Tournament bracket with algorithm-powered predictions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Header />
        <main className="court-bg min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
