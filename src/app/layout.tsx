import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/ToastProvider";

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
  title: "Vello — Scapă de grija actelor întârziate",
  description:
    "Trimite cereri de documente clienților în 30 secunde. Ei răspund cu un click, tu primești totul organizat. Fără cont pentru client.",
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
      </body>
    </html>
  );
}
