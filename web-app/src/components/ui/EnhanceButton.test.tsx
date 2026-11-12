import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EnhanceButton } from "./EnhanceButton";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: { enhancePrompt: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("Enhance failures", () => {
  it("preserves the draft, forwards the reason and releases loading for retry", async () => {
    let reject!: (error: unknown) => void;
    vi.mocked(api.enhancePrompt).mockImplementationOnce(
      () =>
        new Promise((_resolve, rejectRequest) => {
          reject = rejectRequest;
        }),
    );
    const onEnhanced = vi.fn();
    const onError = vi.fn();
    render(
      <EnhanceButton
        value="my original lyrics"
        kind="lyrics"
        onEnhanced={onEnhanced}
        onError={onError}
        bem="song-create"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Enhance" }));
    expect(screen.getByRole("button", { name: "Enhance" })).toBeDisabled();
    const reason = {
      error: "invalid_parameter",
      errorMessage: "aiSong: unsupported song language: Czech",
    };
    await act(async () => reject(reason));
    expect(onEnhanced).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(reason);
    expect(screen.getByRole("button", { name: "Enhance" })).toBeEnabled();
    vi.mocked(api.enhancePrompt).mockResolvedValueOnce("refined lyrics");
    fireEvent.click(screen.getByRole("button", { name: "Enhance" }));
    await act(async () => {});
    expect(onEnhanced).toHaveBeenCalledWith("refined lyrics");
  });
  it("handles unclassified failures without an unhandled rejection", async () => {
    vi.mocked(api.enhancePrompt).mockRejectedValueOnce(new Error("Unavailable"));
    const onEnhanced = vi.fn();
    render(<EnhanceButton value="my text" kind="mv" onEnhanced={onEnhanced} bem="mv-create" />);
    fireEvent.click(screen.getByRole("button", { name: "Enhance" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t enhance your text. Please try again.",
    );
    expect(onEnhanced).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Enhance" })).toBeEnabled();
  });
});
