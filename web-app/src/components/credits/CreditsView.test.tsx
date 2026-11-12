import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreditsView } from "./CreditsView";
import { demoStore } from "@/lib/demoStore";
import { CREDIT_EXPIRY_TRANSACTIONS, CREDIT_TRANSACTIONS, DEFAULT_CREDITS } from "@/lib/user";

vi.mock("@/components/providers/AuthProvider", () => ({ useAuth: () => ({ subscribed: false }) }));
vi.mock("@/components/providers/CreditsProvider", () => ({ useCredits: () => ({ credits: 10 }) }));
vi.mock("@/components/providers/LocaleProvider", () => ({ useLocale: () => ({ locale: "enu" }) }));
vi.mock("@/components/shell/DetailNavbar", () => ({ DetailNavbar: () => null }));
vi.mock("@/components/credits/BuyCreditsModal", () => ({ BuyCreditsModal: () => null }));

beforeEach(() => {
  localStorage.clear();
  demoStore.getSnapshot();
});
afterEach(cleanup);

describe("subscription expiry credit history", () => {
  it("shows the actual expired remainder as a negative row in All only", () => {
    demoStore.setFlag("creditsExpiryHistory", true);
    render(<CreditsView />);
    const expiry = screen
      .getByText("Subscription Credits Expired")
      .closest(".credits-page__entry")!;
    expect(within(expiry as HTMLElement).getByText("-700")).toBeInTheDocument();
    expect(within(expiry as HTMLElement).getByText("2026-11-12")).toBeInTheDocument();
    expect(screen.getByText("Subscription Credits", { exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Spend" }));
    expect(screen.getByText("MV - Create Video")).toBeInTheDocument();
    expect(screen.getByText("-300")).toBeInTheDocument();
    expect(screen.queryByText("Subscription Credits Expired")).not.toBeInTheDocument();
    expect(screen.queryByText("Subscription Credits", { exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Earn" }));
    expect(screen.getByText("Subscription Credits", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("Welcome bonus")).toBeInTheDocument();
    expect(screen.queryByText("Subscription Credits Expired")).not.toBeInTheDocument();
    expect(screen.queryByText("MV - Create Video")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Subscription Credits Expired")).toBeInTheDocument();
  });
  it("keeps the demo reversible without changing the new-account seed", () => {
    render(<CreditsView />);
    expect(screen.getByText("Welcome bonus")).toBeInTheDocument();
    expect(screen.queryByText("Subscription Credits Expired")).not.toBeInTheDocument();
    act(() => demoStore.setFlag("creditsExpiryHistory", true));
    expect(screen.getByText("Subscription Credits Expired")).toBeInTheDocument();
    act(() => demoStore.setFlag("creditsExpiryHistory", false));
    expect(screen.queryByText("Subscription Credits Expired")).not.toBeInTheDocument();
    expect(CREDIT_TRANSACTIONS).toHaveLength(1);
    expect(CREDIT_TRANSACTIONS[0].amount).toBe(DEFAULT_CREDITS);
    fireEvent.click(screen.getByRole("button", { name: "Spend" }));
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });
  it("lets the empty flag take precedence under all three filters", () => {
    demoStore.setFlag("creditsExpiryHistory", true);
    demoStore.setFlag("creditsEmpty", true);
    render(<CreditsView />);
    for (const tab of ["All", "Spend", "Earn"]) {
      fireEvent.click(screen.getByRole("button", { name: tab }));
      expect(screen.getByText("No activity yet")).toBeInTheDocument();
      expect(screen.queryByText("Subscription Credits Expired")).not.toBeInTheDocument();
    }
  });
  it("does not expire the already-used amount or unrelated welcome credits", () => {
    const expired = CREDIT_EXPIRY_TRANSACTIONS.find((t) => t.kind === "expiry")!;
    const grant = CREDIT_EXPIRY_TRANSACTIONS.find((t) => t.label === "Subscription Credits")!;
    const used = CREDIT_EXPIRY_TRANSACTIONS.find((t) => t.kind === "spend")!;
    expect(expired.amount).toBe(-(grant.amount + used.amount));
    expect(CREDIT_EXPIRY_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0)).toBe(DEFAULT_CREDITS);
  });
});
