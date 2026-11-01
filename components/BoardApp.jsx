"use client";

import { useEffect, useState } from "react";
import { loadBoard } from "../lib/board-api";
import { createSupabaseClient, getMissingSettings, readSupabaseSettings } from "../lib/supabase-client";
import { BoardState } from "./BoardState";

export function formatMoney(amount, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString("en-IN")}`;
  }
}

function formatDate(value) {
  if (!value) return "No promise logged";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StudentRow({ student, onAction }) {
  const hasPromise = Boolean(student.promised_date);

  return (
    <article className="student-row">
      <div className="student-identity">
        <span className="avatar" aria-hidden="true">
          {initials(student.student_name)}
        </span>
        <div>
          <h3>{student.student_name}</h3>
          <p>{student.grade_label || "Student"}</p>
        </div>
      </div>
      <div className="row-field row-balance">
        <span className="mobile-label">Amount owed</span>
        <strong>{formatMoney(student.amount_owed, student.currency_code)}</strong>
      </div>
      <div className="row-field row-promise">
        <span className="mobile-label">Promised date</span>
        <span className={hasPromise ? "promise-date" : "promise-date promise-date--muted"}>
          {formatDate(student.promised_date)}
        </span>
      </div>
      <div className="row-field row-stage">
        <span className="mobile-label">Stage</span>
        <span className={`stage-pill ${stageClass(student.stage)}`}>{student.stage}</span>
      </div>
      <div className="row-actions">
        <button className="button button--primary" onClick={() => onAction(student, "payment")} type="button">
          Log payment
        </button>
        <button className="button button--outline" onClick={() => onAction(student, "promise")} type="button">
          New promise
        </button>
      </div>
    </article>
  );
}

function stageClass(stage = "") {
  const normalized = stage.toLowerCase();
  if (normalized.includes("promise")) return "stage-pill--promise";
  if (normalized.includes("partial")) return "stage-pill--partial";
  return "stage-pill--followup";
}

function OutcomeDialog({ action, student, client, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!action || !student) return null;

  async function submitOutcome(event) {
    event.preventDefault();
    if (saving) return;

    const formData = new FormData(event.currentTarget);
    const paymentAmount = Number(formData.get("amount"));
    const promisedDate = String(formData.get("promisedDate") || "");

    if (action === "payment" && (!Number.isFinite(paymentAmount) || paymentAmount <= 0)) {
      setError("Enter a payment amount greater than zero.");
      return;
    }
    if (action === "promise" && !promisedDate) {
      setError("Choose the promised date.");
      return;
    }

    setSaving(true);
    setError("");
    const { error: saveError } = await client.rpc("log_demo_outcome", {
      p_fee_followup_id: student.id,
      p_event_type: action,
      p_payment_amount: action === "payment" ? paymentAmount : null,
      p_promised_date: action === "promise" ? promisedDate : null,
      p_note: String(formData.get("note") || "").trim() || null,
    });

    if (saveError) {
      setError(saveError.message || "The outcome could not be saved.");
      setSaving(false);
      return;
    }

    await onSaved();
  }

  const isPayment = action === "payment";
  const title = isPayment ? "Log a payment" : "Log a new promise";

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="dialog-title" aria-modal="true" className="outcome-dialog" role="dialog">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">{student.student_name}</span>
            <h2 id="dialog-title">{title}</h2>
          </div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
              <path d="m4 4 10 10M14 4 4 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
        <p className="dialog-balance">
          Current balance <strong>{formatMoney(student.amount_owed, student.currency_code)}</strong>
        </p>
        <form className="outcome-form" onSubmit={submitOutcome}>
          {isPayment ? (
            <label>
              Payment amount
              <span className="input-with-currency">
                <span>₹</span>
                <input autoFocus min="0.01" name="amount" placeholder="0.00" required step="0.01" type="number" />
              </span>
            </label>
          ) : (
            <label>
              Promised date
              <input autoFocus name="promisedDate" required type="date" />
            </label>
          )}
          <label>
            Note <span className="optional-label">Optional</span>
            <textarea maxLength={240} name="note" placeholder="Add a short note for the team" rows={3} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="button button--quiet" disabled={saving} onClick={onClose} type="button">
              Cancel
            </button>
            <button className="button button--primary" disabled={saving} type="submit">
              {saving ? "Saving…" : isPayment ? "Save payment" : "Save promise"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AddStudentDialog({ client, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submitStudent(event) {
    event.preventDefault();
    if (saving) return;

    const formData = new FormData(event.currentTarget);
    const studentName = String(formData.get("studentName") || "").trim();
    const gradeLabel = String(formData.get("gradeLabel") || "").trim();
    const amountText = String(formData.get("amount") || "").trim();
    const amount = Number(amountText);
    const promisedDate = String(formData.get("promisedDate") || "") || null;

    if (!studentName || !gradeLabel) {
      setError("Enter both the student name and grade.");
      return;
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero with no more than two decimal places.");
      return;
    }

    setSaving(true);
    setError("");
    const { error: saveError } = await client.rpc("create_demo_followup", {
      p_student_name: studentName,
      p_grade_label: gradeLabel,
      p_amount_owed: amount,
      p_promised_date: promisedDate,
    });

    if (saveError) {
      setError(saveError.message || "The student could not be added.");
      setSaving(false);
      return;
    }

    await onSaved("Student added to the demo board.");
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="add-student-title" aria-modal="true" className="outcome-dialog" role="dialog">
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">NEW DEMO STUDENT</span>
            <h2 id="add-student-title">Add a student</h2>
          </div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
              <path d="m4 4 10 10M14 4 4 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
        <p className="demo-form-note">Creates a synthetic INR demo row. Do not enter real student information.</p>
        <form className="outcome-form" onSubmit={submitStudent}>
          <label>
            Student name
            <input autoFocus autoComplete="off" maxLength={120} name="studentName" required />
          </label>
          <label>
            Grade
            <input autoComplete="off" maxLength={40} name="gradeLabel" placeholder="For example, Grade 8" required />
          </label>
          <label>
            Amount owed
            <span className="input-with-currency">
              <span>₹</span>
              <input min="0.01" name="amount" placeholder="0.00" required step="0.01" type="number" />
            </span>
          </label>
          <label>
            Promised date <span className="optional-label">Optional</span>
            <input name="promisedDate" type="date" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="button button--quiet" disabled={saving} onClick={onClose} type="button">
              Cancel
            </button>
            <button className="button button--primary" disabled={saving} type="submit">
              {saving ? "Adding..." : "Add student"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function BoardApp({ settings: settingsOverride, client: clientOverride }) {
  const [settings] = useState(() => settingsOverride ?? readSupabaseSettings());
  const [usesInjectedClient] = useState(() => Boolean(clientOverride));
  const [clientInfo] = useState(() =>
    clientOverride
      ? { client: clientOverride, missing: [] }
      : createSupabaseClient(settings),
  );
  const [state, setState] = useState({ status: "loading" });
  const [activeAction, setActiveAction] = useState(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const missing = usesInjectedClient ? [] : getMissingSettings(settings);
    if (missing.length) {
      setState({ status: "missing", missing });
      return undefined;
    }
    if (!clientInfo.client) {
      setState({ status: "missing", missing: clientInfo.missing });
      return undefined;
    }

    let current = true;
    setState({ status: "loading" });
    loadBoard(clientInfo.client).then((result) => {
      if (current) setState(result);
    });

    return () => {
      current = false;
    };
  }, [clientInfo, retryCount, settings, usesInjectedClient]);

  async function refreshBoard(message = "Saved. The board is up to date.") {
    const result = await loadBoard(clientInfo.client);
    setState(result);
    setNotice(message);
    setActiveAction(null);
    setAddingStudent(false);
  }

  const students = state.data?.students ?? [];
  const currency = state.data?.currency_code ?? students[0]?.currency_code ?? "INR";
  const totalPending = state.data?.total_pending ?? 0;

  return (
    <main className="app-shell">
      <header className="hero-band">
        <div className="hero-inner">
          <div className="brand-line">
            <span aria-hidden="true" className="brand-mark">
              <span />
              <span />
              <span />
            </span>
            <span>Fee follow-up</span>
            <span className="demo-tag">Synthetic demo</span>
          </div>
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow eyebrow--light">STUDENT ACCOUNTS</p>
              <h1>Every follow-up,<br />in one clear view.</h1>
              <p className="hero-subtitle">A calm, current picture of fees still to come in.</p>
            </div>
            <section aria-label="Total pending" className="total-panel">
              <span className="total-label">Total pending</span>
              <strong>{formatMoney(totalPending, currency)}</strong>
              <span className="total-footnote">
                {state.status === "ready" ? `${students.length} students with a balance` : "Across the demo board"}
              </span>
            </section>
          </div>
          <div className="hero-foot">
            <span className="sync-indicator" />
            <span>Demo data only | Do not enter real student information</span>
            <span className="hero-foot-right">One shared board</span>
          </div>
        </div>
      </header>

      <section aria-labelledby="board-title" className="board-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FOLLOW-UP QUEUE</p>
            <h2 id="board-title">Pending fees</h2>
          </div>
          <div className="section-actions">
            {(state.status === "ready" || state.status === "empty") && (
              <span className="queue-count">{students.length} {students.length === 1 ? "student" : "students"}</span>
            )}
            {(state.status === "ready" || state.status === "empty") && (
              <button className="button button--primary add-student-button" onClick={() => setAddingStudent(true)} type="button">
                <span aria-hidden="true">+</span> Add student
              </button>
            )}
          </div>
        </div>

        {state.status === "ready" ? (
          <div className="student-list">
            <div aria-hidden="true" className="list-labels">
              <span>Student</span>
              <span>Amount owed</span>
              <span>Promised date</span>
              <span>Stage</span>
              <span>Log outcome</span>
            </div>
            {students.map((student) => (
              <StudentRow key={student.id} onAction={(row, action) => setActiveAction({ row, action })} student={student} />
            ))}
          </div>
        ) : (
          <BoardState onRetry={() => setRetryCount((count) => count + 1)} state={state} />
        )}

        {notice && <p className="save-notice" role="status">{notice}</p>}
        <p className="scope-note">
          <span aria-hidden="true">i</span>
          The names, amounts, currency, and stages shown here are fictional examples. The demo is publicly accessible.
        </p>
      </section>

      <footer className="app-footer">
        <span>Fee follow-up board</span>
        <span>Demo workspace | No real student records</span>
      </footer>

      <OutcomeDialog
        action={activeAction?.action}
        client={clientInfo.client}
        onClose={() => setActiveAction(null)}
        onSaved={refreshBoard}
        student={activeAction?.row}
      />
      {addingStudent && (
        <AddStudentDialog
          client={clientInfo.client}
          onClose={() => setAddingStudent(false)}
          onSaved={refreshBoard}
        />
      )}
    </main>
  );
}
