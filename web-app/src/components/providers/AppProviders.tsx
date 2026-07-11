"use client";

// Client provider stack, mounted once in the root layout (never a second time).
// Order matters: the flow providers write to History as jobs start/finish.

import { CreditsProvider } from "./CreditsProvider";
import { HistoryProvider } from "./HistoryProvider";
import { MvFlowProvider } from "./MvFlowProvider";
import { SongFlowProvider } from "./SongFlowProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CreditsProvider>
      <HistoryProvider>
        <MvFlowProvider>
          <SongFlowProvider>{children}</SongFlowProvider>
        </MvFlowProvider>
      </HistoryProvider>
    </CreditsProvider>
  );
}
