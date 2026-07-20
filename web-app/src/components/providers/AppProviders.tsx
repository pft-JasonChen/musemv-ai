"use client";

// Client provider stack, mounted once in app/[locale]/layout.tsx (never a
// second time). Order matters: the flow providers write to History as jobs
// start/finish. LocaleProvider wraps this stack (see the [locale] layout).

import { AuthProvider } from "./AuthProvider";
import { CreditsProvider } from "./CreditsProvider";
import { HistoryProvider } from "./HistoryProvider";
import { MvFlowProvider } from "./MvFlowProvider";
import { SongFlowProvider } from "./SongFlowProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CreditsProvider>
        <HistoryProvider>
          <MvFlowProvider>
            <SongFlowProvider>{children}</SongFlowProvider>
          </MvFlowProvider>
        </HistoryProvider>
      </CreditsProvider>
    </AuthProvider>
  );
}
