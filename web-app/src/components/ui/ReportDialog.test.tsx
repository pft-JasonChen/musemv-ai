import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReportContent, ALREADY_REPORTED, REPORT_FAILED, REPORT_LIMIT } from "./ReportDialog";
import { moderationStore } from "@/lib/contentModeration";
import { reportCount, resetReports, type ReportKind } from "@/lib/report";
const auth = vi.hoisted(() => ({ loggedIn: false }));
vi.mock("@/components/providers/AuthProvider", () => ({ useAuth: () => auth }));
vi.mock("@/components/providers/HistoryProvider", () => ({ useHistory: () => ({ history: [] }) }));
vi.mock("@/lib/ssr", () => ({ PHONE_QUERY: "(max-width: 767px)", useMediaQuery: () => false }));
function Entry({ id, kind = "mv" }: { id: string; kind?: ReportKind }) {
  const { canReport, openReport, reportNode } = useReportContent(kind, id);
  return (
    <>
      {canReport && <button onClick={openReport}>Open {id}</button>}
      {reportNode}
    </>
  );
}
async function send() {
  fireEvent.click(screen.getAllByRole("radio")[0]);
  fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));
  await screen.findByRole("button", { name: "Done" });
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}
beforeEach(() => {
  auth.loggedIn = false;
  resetReports();
  moderationStore.reset();
});
afterEach(cleanup);
describe("report decisions", () => {
  it("allows guests and counts five mixed-kind successes; duplicate takes priority over the cap", async () => {
    render(
      <>
        {["a", "b", "c", "d", "e", "f"].map((id, i) => (
          <Entry key={id} id={id} kind={i % 2 ? "song" : "mv"} />
        ))}
      </>,
    );
    for (const id of ["a", "b", "c", "d", "e"]) {
      fireEvent.click(screen.getByRole("button", { name: `Open ${id}` }));
      await send();
    }
    expect(reportCount()).toBe(5);
    fireEvent.click(screen.getByRole("button", { name: "Open a" }));
    expect(screen.getByText(ALREADY_REPORTED)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open f" }));
    expect(screen.getByText(REPORT_LIMIT)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("retains Details on failure, prevents double submission, and counts only the successful retry", async () => {
    moderationStore.setFailure(true);
    render(<Entry id="a" />);
    fireEvent.click(screen.getByRole("button", { name: "Open a" }));
    expect(screen.getByRole("button", { name: "Submit Report" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Something else" }));
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Submit Report" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "Review this title" } });
    const submit = screen.getByRole("button", { name: "Submit Report" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
    await screen.findByText(REPORT_FAILED);
    expect(reportCount()).toBe(0);
    expect(screen.getByLabelText("Details")).toHaveValue("Review this title");
    act(() => moderationStore.setFailure(false));
    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));
    await screen.findByRole("button", { name: "Done" });
    expect(reportCount()).toBe(1);
  });
  it("hides self-report after sign-in while allowing the same public content to guests", () => {
    const view = render(<Entry id="sp-neon-static" kind="song" />);
    expect(screen.getByRole("button", { name: "Open sp-neon-static" })).toBeInTheDocument();
    auth.loggedIn = true;
    view.rerender(<Entry id="sp-neon-static" kind="song" />);
    expect(screen.queryByRole("button", { name: "Open sp-neon-static" })).not.toBeInTheDocument();
  });
});
