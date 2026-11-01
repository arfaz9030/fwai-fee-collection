import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BoardState } from "./BoardState";

describe("distinct board states", () => {
  it("names each missing setting", () => {
    render(
      <BoardState
        state={{
          status: "missing",
          missing: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
        }}
      />,
    );

    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_URL")).toBeTruthy();
    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")).toBeTruthy();
  });

  it("shows a connection failure and retries without looking empty", () => {
    const onRetry = vi.fn();
    render(<BoardState onRetry={onRetry} state={{ status: "error", message: "Permission denied." }} />);

    expect(screen.getByText("Supabase could not load the board")).toBeTruthy();
    expect(screen.queryByText("No pending demo fees")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows an empty table as a successful connection", () => {
    render(<BoardState state={{ status: "empty" }} />);

    expect(screen.getByText("No pending demo fees")).toBeTruthy();
    expect(screen.getByText("Connected")).toBeTruthy();
  });
});
