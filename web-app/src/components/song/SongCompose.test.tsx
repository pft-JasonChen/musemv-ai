import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SongCompose } from "./SongCompose";
import { DEFAULT_SONG_COMPOSE, type SongCompose as Compose } from "@/lib/mv/types";
import { api } from "@/lib/api";
import { SUPPORTED_SONG_LANGUAGES, UNSUPPORTED_LANGUAGE_MESSAGE } from "@/lib/mv/songLanguage";

const state = vi.hoisted(() => ({ compose: null as Compose | null, patch: vi.fn(), demo: false }));
vi.mock("@/lib/api", () => ({ api: { enhancePrompt: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/providers/LocaleProvider", () => ({ useLocale: () => ({ locale: "enu" }) }));
vi.mock("@/components/providers/SongFlowProvider", () => ({
  useSongFlow: () => ({ songCompose: state.compose, patchSongCompose: state.patch }),
}));
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({ requireLogin: vi.fn() }),
}));
vi.mock("@/components/providers/CreditsProvider", () => ({ useCredits: () => ({ credits: 10 }) }));
vi.mock("@/components/history/useOpenCreation", () => ({
  useOpenCreation: () => vi.fn(),
  creationHref: () => "/",
}));
vi.mock("@/components/history/useMyCreations", () => ({ useMyCreations: () => [] }));
vi.mock("@/components/shell/RoomNavbar", () => ({ RoomNavbar: () => null }));
vi.mock("@/components/credits/BuyCreditsModal", () => ({ BuyCreditsModal: () => null }));
vi.mock("@/components/ui/FloatingCTA", () => ({
  FloatingCTA: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/demo/useDemo", () => ({ useDemoFlag: () => state.demo }));
vi.mock("@/components/ui/useDialogTransition", () => ({
  useDialogTransition: (open: boolean) => ({ mounted: open, visible: open }),
  useEscapeToClose: vi.fn(),
}));

beforeEach(() => {
  state.compose = { ...DEFAULT_SONG_COMPOSE, describe: "original idea", lyrics: "original lyrics" };
  state.demo = false;
  vi.resetAllMocks();
});
afterEach(cleanup);

describe("Song Enhance error presentation", () => {
  it.each([
    ["simple", false, null],
    ["custom", true, null],
    ["custom", false, "Refine Idea"],
    ["custom", false, "Refine Lyrics"],
  ] as const)(
    "keeps %s input on an unsupported-language error (instrumental %s, direction %s)",
    async (mode, instrumental, direction) => {
      state.compose = { ...state.compose!, mode, instrumental };
      vi.mocked(api.enhancePrompt).mockRejectedValueOnce({
        error: "invalid_parameter",
        errorMessage: "aiSong: unsupported song language: Czech",
      });
      render(<SongCompose />);
      fireEvent.click(screen.getByRole("button", { name: "Enhance" }));
      if (direction) fireEvent.click(screen.getByRole("button", { name: new RegExp(direction) }));
      expect(await screen.findByRole("alert")).toHaveTextContent(UNSUPPORTED_LANGUAGE_MESSAGE);
      fireEvent.click(screen.getAllByRole("button", { name: "Supported languages" }).at(-1)!);
      expect(screen.getByRole("tooltip")).toHaveTextContent(SUPPORTED_SONG_LANGUAGES);
      expect(state.patch).not.toHaveBeenCalled();
      expect(screen.getAllByRole("textbox")[0]).toHaveValue(
        mode === "simple" ? "original idea" : "original lyrics",
      );
      expect(screen.getByRole("button", { name: "Enhance" })).toBeEnabled();
    },
  );
  it("does not turn an unrelated invalid parameter into a language error", async () => {
    state.compose = { ...state.compose!, mode: "simple" };
    vi.mocked(api.enhancePrompt).mockRejectedValueOnce({ error: "invalid_parameter" });
    render(<SongCompose />);
    fireEvent.click(screen.getByRole("button", { name: "Enhance" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t enhance your text. Please try again.",
    );
    expect(state.patch).not.toHaveBeenCalled();
  });
  it("uses the demo language state after the API response without overwriting input", async () => {
    state.compose = { ...state.compose!, mode: "simple" };
    state.demo = true;
    vi.mocked(api.enhancePrompt).mockResolvedValueOnce("enhanced text");
    render(<SongCompose />);
    fireEvent.click(screen.getByRole("button", { name: "Enhance" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(UNSUPPORTED_LANGUAGE_MESSAGE);
    expect(api.enhancePrompt).toHaveBeenCalledWith({ text: "original idea", kind: "song" });
    expect(state.patch).not.toHaveBeenCalled();
  });
});
