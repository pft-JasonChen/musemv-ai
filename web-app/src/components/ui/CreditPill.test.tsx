import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreditPill } from "./CreditPill";

describe("CreditPill", () => {
  it("renders the balance", () => {
    render(<CreditPill credits={390} />);
    expect(screen.getByText("390")).toBeInTheDocument();
  });
});
