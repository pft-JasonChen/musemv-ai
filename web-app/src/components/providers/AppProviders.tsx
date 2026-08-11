"use client";

// Client provider stack, mounted once in app/[locale]/layout.tsx (never a
// second time). Order matters: the flow providers write to History as jobs
// start/finish. LocaleProvider wraps this stack (see the [locale] layout).

import { AuthProvider } from "./AuthProvider";
import { SubscribeProvider } from "./SubscribeProvider";
import { CreditsProvider } from "./CreditsProvider";
import { HistoryProvider } from "./HistoryProvider";
import { MvFlowProvider } from "./MvFlowProvider";
import { SongFlowProvider } from "./SongFlowProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CreditsProvider>
        {/* Inside both AuthProvider AND CreditsProvider, not merged into
            either — SubscribeModal calls both useAuth() (subscribe) and
            useCredits() (addCredits on purchase), so it needs to sit inside
            both trees; see SubscribeProvider's own comment for why it isn't
            just folded into AuthProvider. */}
        <SubscribeProvider>
          <HistoryProvider>
            <MvFlowProvider>
              <SongFlowProvider>{children}</SongFlowProvider>
            </MvFlowProvider>
          </HistoryProvider>
        </SubscribeProvider>
      </CreditsProvider>
    </AuthProvider>
  );
}
