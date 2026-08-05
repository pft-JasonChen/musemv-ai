import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "YouCam Muse — Web",
  description: "AI music video & song creation (web prototype)",
};

// Root layout owns <html>/<body>. The active locale (and providers/shell) live
// in the nested app/[locale]/layout.tsx; the [locale] layout keeps <html lang>
// in sync client-side. `lang="en"` is the SSR default until then.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-theme="dark" is REQUIRED, not decorative (plan D2 step 4). tokens.css
    // ships both themes and its `:root` block is the LIGHT one; dark lives under
    // [data-theme="dark"]. Drop this attribute and every --color-* resolves light
    // while the app still paints dark backgrounds from the alias layer — which
    // reads as a random CSS bug and is not one. The app is dark-only today, so
    // this is hardcoded rather than driven by a theme preference.
    <html lang="en" data-theme="dark" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
