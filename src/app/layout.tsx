import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/ToastProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title:
    "Vello — Colectare documente contabili și upload documente clienți contabil",
  description:
    "Aplicație pentru contabili: colectare documente contabili, upload documente clienți contabil, cereri de documente, reminder automat, link securizat de upload și arhivare organizată pe client și lună.",
  keywords: [
    "vello",
    "aplicație contabili",
    "software pentru contabili",
    "program contabili clienți",
    "colectare documente contabile",
    "colectare documente contabili",
    "upload documente clienți contabil",
    "reminder automat documente",
    "aplicație cabinete de contabilitate",
    "saas contabili românia",
  ],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="antialiased min-h-screen font-[family-name:var(--font-body)]">
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
