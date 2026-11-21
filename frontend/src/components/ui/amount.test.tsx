// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Amount } from "./amount";

describe("<Amount>", () => {
  it("writes the sign for credits and debits so colour is never the only signal", () => {
    render(
      <>
        <Amount value="500.00" direction="credit" data-testid="credit" />
        <Amount value={-500} direction="debit" data-testid="debit" />
      </>,
    );
    expect(screen.getByTestId("credit")).toHaveTextContent("+₹500.00");
    expect(screen.getByTestId("debit")).toHaveTextContent("−₹500.00");
  });

  it("keeps a normal debit neutral and a failed amount red", () => {
    render(
      <>
        <Amount value="10" direction="debit" data-testid="debit" />
        <Amount value="10" direction="failed" data-testid="failed" />
      </>,
    );
    expect(screen.getByTestId("debit")).toHaveClass("text-money-debit");
    expect(screen.getByTestId("failed")).toHaveClass(
      "text-money-failed",
      "line-through",
    );
  });
});
