import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EditTitleSubtitleDialog } from "./EditTitleSubtitleDialog";
import { TITLE_EFFECTS, SUBTITLE_STYLES } from "@/lib/mv/textEffects";

vi.mock("@/components/ui/useDialogTransition", () => ({
  useDialogTransition: (open: boolean) => ({ mounted: open, visible: open }),
  useEscapeToClose: vi.fn(),
}));
vi.mock("@/lib/ssr", () => ({ PHONE_QUERY: "", useMediaQuery: () => false }));
vi.mock("@/components/mv/MobileScenePreview", () => ({
  MobileScenePreview: ({ src }: { src: string }) => <video src={src} data-testid="canvas-video" />,
}));

const observers: {
  target?: Element;
  callback: IntersectionObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
}[] = [];
beforeEach(() => {
  observers.length = 0;
});
function intersect(target: Element, ratio: number) {
  const observer = observers.find((o) => o.target === target)!;
  act(() =>
    observer.callback(
      [
        {
          target,
          isIntersecting: ratio > 0,
          intersectionRatio: ratio,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  );
}
beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      record: (typeof observers)[number];
      constructor(callback: IntersectionObserverCallback) {
        this.record = { callback, disconnect: vi.fn() };
        observers.push(this.record);
      }
      observe(target: Element) {
        this.record.target = target;
      }
      disconnect() {
        this.record.disconnect();
      }
    },
  );
  Object.defineProperty(HTMLElement.prototype, "scrollBy", { configurable: true, value: vi.fn() });
});

async function setup(
  overrides: Partial<React.ComponentProps<typeof EditTitleSubtitleDialog>> = {},
) {
  const onSave = vi.fn();
  const props = {
    videoSrc: "/test-mv.mp4",
    poster: "/test-cover.jpg",
    open: true,
    onClose: vi.fn(),
    onSave,
    selection: { titleEffect: TITLE_EFFECTS[0].id, subtitleStyle: SUBTITLE_STYLES[0].id },
    titleOn: true,
    subtitleOn: true,
    ...overrides,
  };
  const view = render(<EditTitleSubtitleDialog {...props} />);
  return { ...view, props, onSave };
}

describe("MV effects draft boundaries", () => {
  it("shows the current selection and video without text overlays or a default action", async () => {
    await setup();
    expect(screen.getByTestId("canvas-video")).toHaveAttribute("src", "/test-mv.mp4");
    expect(screen.queryByRole("button", { name: /Use default/i })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true"),
    ).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Live MV preview/)).not.toBeInTheDocument();
    expect(screen.queryByText("Your Title")).not.toBeInTheDocument();
    expect(document.querySelector(".fx-title")).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("keeps turn-on changes local until Save", async () => {
    const { onSave } = await setup({ titleOn: false });
    expect(screen.getByRole("radio", { name: "作者接標題" })).toBeDisabled();
    fireEvent.click(screen.getByRole("switch", { name: "Turn title on" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: "作者接標題" })).toBeEnabled());
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ titleOn: true }));
  });

  it("disables activation and sample subtitles when synchronized lyrics are absent", async () => {
    await setup({ subtitlesAvailable: false });
    fireEvent.click(screen.getByRole("tab", { name: "Subtitle" }));
    expect(screen.getByText("Synchronized lyrics are not available for this song.")).toBeVisible();
    expect(screen.getByRole("switch", { name: "Turn subtitles on" })).toBeDisabled();
    expect(screen.getAllByRole("radio").every((r) => (r as HTMLButtonElement).disabled)).toBe(true);
    expect(document.querySelector(".fx-sub")).toBeNull();
    // Eligibility does not silently change the saved switch or create a dirty draft.
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("retains tab drafts and disables Save when every choice is reverted", async () => {
    await setup();
    fireEvent.click(screen.getByRole("radio", { name: "作者接標題" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    fireEvent.click(screen.getByRole("tab", { name: "Subtitle" }));
    fireEvent.click(screen.getByRole("tab", { name: "Title" }));
    expect(screen.getByRole("radio", { name: "作者接標題" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("radio", { name: "置中靜態" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
  it("retains selection and falls back to a cover when the animated sample fails", async () => {
    await setup();
    const selected = screen.getByRole("radio", { name: "置中靜態" });
    intersect(selected.querySelector(".effects-dialog__sample-frame")!, 1);
    const img = selected.querySelector("img")!;
    expect(img.src).toContain("/assets/title_mv/title_effect_legacy_static.webp");
    fireEvent.error(img);
    expect(selected).toHaveAttribute("aria-checked", "true");
    expect(img.src).toContain("/covers/title_effect_legacy_static.png");
    expect(selected).toBeEnabled();
  });
  it("plays only half-visible frames without selecting them, and stops on background, tab switch and close", async () => {
    const { props, rerender } = await setup();
    const card = screen.getByRole("radio", { name: "作者接標題" });
    const frame = card.querySelector(".effects-dialog__sample-frame")!;
    const img = card.querySelector("img")!;
    intersect(frame, 0.49);
    expect(img.src).toContain("/covers/");
    intersect(frame, 0.5);
    expect(img.src).toContain("title_effect_author_title.webp");
    expect(card).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    act(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(img.src).toContain("/covers/");
    act(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(img.src).toContain("title_effect_author_title.webp");
    intersect(frame, 0.49);
    expect(img.src).toContain("/covers/");
    const titleObservers = [...observers];
    fireEvent.click(screen.getByRole("tab", { name: "Subtitle" }));
    expect(titleObservers.every((o) => o.disconnect.mock.calls.length > 0)).toBe(true);
    expect(document.querySelector('img[src$="title_effect_author_title.webp"]')).toBeNull();
    const subtitleFrame = screen
      .getAllByRole("radio")[0]
      .querySelector(".effects-dialog__sample-frame")!;
    intersect(subtitleFrame, 1);
    expect(subtitleFrame.querySelector("img")!.src).toContain(".webp");
    rerender(<EditTitleSubtitleDialog {...props} open={false} />);
    expect(observers.every((o) => o.disconnect.mock.calls.length > 0)).toBe(true);
    expect(document.querySelector('img[src$=".webp"]')).toBeNull();
  });
});
