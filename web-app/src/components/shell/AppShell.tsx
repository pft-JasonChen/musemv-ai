"use client";

import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/config";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  // The public share-link page (/share) is a standalone, no-navigation page
  // (spec P2-S1) — render it bare, without the app sidebar/top bar.
  const bare = stripLocalePrefix(usePathname() || "/").startsWith("/share");
  if (bare) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      </div>
    </div>
  );
}
