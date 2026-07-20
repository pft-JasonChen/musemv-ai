import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MuseMV.ai — Web",
  description: "AI music video & song creation (web prototype)",
};

// Root layout owns <html>/<body>. The active locale (and providers/shell) live
// in the nested app/[locale]/layout.tsx; the [locale] layout keeps <html lang>
// in sync client-side. `lang="en"` is the SSR default until then.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
