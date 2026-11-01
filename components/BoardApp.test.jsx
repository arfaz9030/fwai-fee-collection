import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BoardApp } from "./BoardApp";
import { demoBoard } from "../lib/demo-fixtures";

function clientReturning(result) {
  return { rpc: vi.fn().mockResolvedValue(result) };
}

describe("fee follow-up board", () => {
  it("names missing settings in the visible screen", () => {
    render(
      <BoardApp
        client={null}
        settings={{ NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }}
      />,
    );

    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_URL")).toBeTruthy();
    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")).toBeTruthy();
  });

  it("shows a failed Supabase request as a connection problem", async () => {
    const client = clientReturning({ data: null, error: { message: "relation does not exist" } });
    render(<BoardApp client={client} />);

    expect(await screen.findByText("Supabase could not load the board")).toBeTruthy();
    expect(screen.getByText("relation does not exist")).toBeTruthy();
    expect(screen.queryByText("No pending demo fees")).toBeNull();
  });

  it("shows a successful empty response differently from a failed request", async () => {
    const client = clientReturning({
      data: { students: [], total_pending: 0, currency_code: "INR" },
      error: null,
    });
    render(<BoardApp client={client} />);

    expect(await screen.findByText("No pending demo fees")).toBeTruthy();
    expect(screen.getByText("Connected")).toBeTruthy();
    expect(screen.queryByText("Supabase could not load the board")).toBeNull();
  });

  it("opens an action form and updates the board after a saved payment", async () => {
    const updatedBoard = {
      ...demoBoard,
      total_pending: 14150,
      students: demoBoard.students.map((row) =>
        row.id === "demo-1" ? { ...row, amount_owed: 2200, stage: "Partially paid" } : row,
      ),
    };
    const client = {
      rpc: vi
        .fn()
        .mockResolvedValueOnce({ data: demoBoard, error: null })
        .mockResolvedValueOnce({ data: { ok: true }, error: null })
        .mockResolvedValueOnce({ data: updatedBoard, error: null }),
    };
    render(<BoardApp client={client} />);

    await screen.findByText("Aarav Mehta");
    fireEvent.click(screen.getAllByRole("button", { name: "Log payment" })[0]);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save payment" }));

    await waitFor(() => expect(client.rpc).toHaveBeenCalledTimes(3));
    expect(client.rpc.mock.calls[1][0]).toBe("log_demo_outcome");
    expect(client.rpc.mock.calls[1][1]).toMatchObject({
      p_fee_followup_id: "demo-1",
      p_event_type: "payment",
      p_payment_amount: 1000,
    });
    expect(await screen.findByText("Saved. The board is up to date.")).toBeTruthy();
    expect(within(screen.getByText("Aarav Mehta").closest("article")).getByText("Partially paid")).toBeTruthy();
  });

  it("logs a new promise without changing the balance", async () => {
    const updatedBoard = {
      ...demoBoard,
      students: demoBoard.students.map((row) =>
        row.id === "demo-2"
          ? { ...row, promised_date: "2026-11-09", stage: "Promise made" }
          : row,
      ),
    };
    const client = {
      rpc: vi
        .fn()
        .mockResolvedValueOnce({ data: demoBoard, error: null })
        .mockResolvedValueOnce({ data: { ok: true }, error: null })
        .mockResolvedValueOnce({ data: updatedBoard, error: null }),
    };
    render(<BoardApp client={client} />);

    await screen.findByText("Ananya Shah");
    fireEvent.click(screen.getAllByRole("button", { name: "New promise" })[1]);
    fireEvent.change(screen.getByLabelText("Promised date"), { target: { value: "2026-11-09" } });
    fireEvent.click(screen.getByRole("button", { name: "Save promise" }));

    await waitFor(() => expect(client.rpc).toHaveBeenCalledTimes(3));
    expect(client.rpc.mock.calls[1][1]).toMatchObject({
      p_fee_followup_id: "demo-2",
      p_event_type: "promise",
      p_promised_date: "2026-11-09",
    });
    expect(await screen.findByText("Saved. The board is up to date.")).toBeTruthy();
    expect(screen.getByText("₹15,150.00")).toBeTruthy();
    expect(within(screen.getByText("Ananya Shah").closest("article")).getByText("9 Nov 2026")).toBeTruthy();
  });

  it("adds a student through the demo-create RPC and refreshes the board", async () => {
    const newStudent = {
      id: "demo-new",
      student_name: "Nila Kapoor",
      grade_label: "Grade 6",
      amount_owed: 1750,
      currency_code: "INR",
      promised_date: "2026-11-19",
      stage: "Promise made",
      is_demo: true,
    };
    const updatedBoard = {
      ...demoBoard,
      total_pending: 16900,
      students: [...demoBoard.students, newStudent],
    };
    const client = {
      rpc: vi
        .fn()
        .mockResolvedValueOnce({ data: demoBoard, error: null })
        .mockResolvedValueOnce({ data: { student: newStudent, total_pending: 16900 }, error: null })
        .mockResolvedValueOnce({ data: updatedBoard, error: null }),
    };
    render(<BoardApp client={client} />);

    await screen.findByText("Aarav Mehta");
    fireEvent.click(screen.getByRole("button", { name: "Add student" }));
    fireEvent.change(screen.getByLabelText("Student name"), { target: { value: "Nila Kapoor" } });
    fireEvent.change(screen.getByLabelText("Grade"), { target: { value: "Grade 6" } });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1750" } });
    fireEvent.change(screen.getByLabelText(/Promised date/), { target: { value: "2026-11-19" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add student" }));

    await waitFor(() => expect(client.rpc).toHaveBeenCalledTimes(3));
    expect(client.rpc.mock.calls[1][0]).toBe("create_demo_followup");
    expect(client.rpc.mock.calls[1][1]).toEqual({
      p_student_name: "Nila Kapoor",
      p_grade_label: "Grade 6",
      p_amount_owed: 1750,
      p_promised_date: "2026-11-19",
    });
    expect(await screen.findByText("Student added to the demo board.")).toBeTruthy();
    expect(screen.getByText("₹16,900.00")).toBeTruthy();
    expect(within(screen.getByText("Nila Kapoor").closest("article")).getByText("Promise made")).toBeTruthy();
  });

  it("rejects an incomplete student form without making a database call", async () => {
    const client = clientReturning({ data: demoBoard, error: null });
    render(<BoardApp client={client} />);

    await screen.findByText("Aarav Mehta");
    fireEvent.click(screen.getByRole("button", { name: "Add student" }));
    fireEvent.submit(screen.getByRole("dialog").querySelector("form"));

    expect(await screen.findByText("Enter both the student name and grade.")).toBeTruthy();
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });
});
