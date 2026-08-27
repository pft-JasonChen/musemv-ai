import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// The real guard for the double-start bug fixed in e739c4e.
//
// WHY THIS LIVES IN VITEST AND NOT IN e2e/
// The bug is a React **Strict Mode** double-invoke of the mount effect, and
// Strict Mode's double-invoke exists ONLY in React's development build. The
// Playwright suite boots `next start -p 3100` (see playwright.config.ts), i.e.
// the production build, where React elides it — so an e2e test can never
// observe this regression, and one written there passes with OR without the
// `started` ref. That is the "a test that cannot fail is worse than no test"
// trap in AGENTS.md. Vitest runs React's dev build, so <StrictMode> here
// double-invokes for real and the assertion below genuinely bites.
//
// Mutation-tested both directions when written: with the `started` ref removed
// from StoryboardGenerationScreen.tsx this fails with startStoryboard called
// 2 times; with it restored, 1.

const push = vi.fn();
const replace = vi.fn();
const startStoryboard = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/providers/LocaleProvider", () => ({
  useLocale: () => ({ locale: "enu" }),
}));
vi.mock("@/components/providers/MvFlowProvider", () => ({
  useMvFlow: () => ({
    startStoryboard,
    storyboard: null,
    // A ready brief, so the screen starts generating instead of redirecting to
    // /mv/room via its own flow-guard. `isComposeReady` needs a song and a
    // non-empty description; the rest of ComposeState is irrelevant here.
    compose: {
      mvType: "singing",
      song: { id: "s1", source: "library", title: "T", durationSec: 145, art: "" },
      description: "a brief that is ready",
      photos: [],
      settings: {
        ratio: "9:16",
        resolution: "Standard",
        title: { on: true, text: "" },
        author: { on: true, text: "" },
        showSubtitle: true,
        watermark: false,
      },
    },
    gen: { status: "processing", progress: 10, step: "Thinking" },
  }),
}));
vi.mock("@/components/shell/DetailNavbar", () => ({
  DetailNavbar: () => null,
}));
vi.mock("@/components/ui/DpIcon", () => ({ DpIcon: () => null }));

// Imported after the mocks are registered.
const { StoryboardGenerationScreen } = await import("./StoryboardGenerationScreen");

describe("StoryboardGenerationScreen", () => {
  beforeEach(() => {
    startStoryboard.mockClear();
    push.mockClear();
    replace.mockClear();
  });

  it("starts the storyboard job exactly once under StrictMode's double mount", () => {
    render(
      <StrictMode>
        <StoryboardGenerationScreen />
      </StrictMode>,
    );
    // Without the `started` ref this is 2: two jobs, charged twice (GL-01
    // charges on start), and the first job's History row is orphaned at
    // "Generating..." forever because its poll is replaced with no
    // markFailed/markCompleted.
    expect(startStoryboard).toHaveBeenCalledTimes(1);
  });

  it("still starts exactly once on a plain (non-Strict) mount", () => {
    render(<StoryboardGenerationScreen />);
    expect(startStoryboard).toHaveBeenCalledTimes(1);
  });
});
