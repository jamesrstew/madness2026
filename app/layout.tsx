import type { Metadata } from "next";
import { Source_Serif_4, Playfair_Display, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
  ),
  title: {
    default: "Golden Bracket — Your Best Shot at a Perfect Bracket",
    template: "%s | Golden Bracket",
  },
  description:
    "No one has ever picked a perfect bracket. Golden Bracket gives you the best shot — algorithm-powered predictions across 68 teams, 10 weighted factors, and real ESPN data.",
  openGraph: {
    type: "website",
    siteName: "Golden Bracket",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sourceSerif.variable} ${playfair.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        <Header />
        <main className="court-bg min-h-screen">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
