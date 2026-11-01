import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL is missing");
assert.ok(publishableKey, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing");

const supabase = createClient(supabaseUrl, publishableKey);
const testStudentName = `Browser Action ${Date.now()}`;
let browser;
let testStudentId;
let browserDiagnostics = { pageErrors: [], failedResponses: [], failedRequests: [] };

try {
  browser = await chromium.launch({
    executablePath:
      process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  const failedResponses = [];
  const failedRequests = [];
  browserDiagnostics = { pageErrors, failedResponses, failedRequests };
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(`${message.text()} ${JSON.stringify(message.location())}`);
  });
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText}`));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("http://127.0.0.1:3000", { waitUntil: "domcontentloaded" });
  await waitForStudent(page, "Aarav Mehta");
  await waitForAnimations(page);
  assert.equal(await page.locator(".student-row").count(), 4);
  assert.equal(await page.locator(".total-panel strong").textContent(), "₹15,150.00");

  const desktop = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    rows: document.querySelectorAll(".student-row").length,
  }));
  assert.ok(desktop.document <= desktop.viewport, `Desktop overflow: ${JSON.stringify(desktop)}`);
  await page.screenshot({ path: path.join(tmpdir(), "fee-board-1440.png"), fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForStudent(page, "Aarav Mehta");
  await waitForAnimations(page);
  const mobile = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll(".student-row .button")];
    return {
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      rows: document.querySelectorAll(".student-row").length,
      minActionHeight: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
      actionLabels: buttons.map((button) => button.textContent.trim()),
    };
  });
  assert.ok(mobile.document <= mobile.viewport, `Mobile overflow: ${JSON.stringify(mobile)}`);
  assert.equal(mobile.rows, 4);
  assert.ok(mobile.minActionHeight >= 44, `Short action target: ${mobile.minActionHeight}px`);
  assert.deepEqual(mobile.actionLabels, [
    "Log payment", "New promise",
    "Log payment", "New promise",
    "Log payment", "New promise",
    "Log payment", "New promise",
  ]);
  await page.screenshot({ path: path.join(tmpdir(), "fee-board-375.png"), fullPage: true });

  await page.getByRole("button", { name: "Add student" }).click();
  const addDialog = page.getByRole("dialog");
  await addDialog.getByLabel("Student name").fill(testStudentName);
  await addDialog.getByLabel("Grade").fill("Browser test");
  await addDialog.getByRole("spinbutton").fill("100");
  await addDialog.getByRole("button", { name: "Add student" }).click();
  await page.getByText("Student added to the demo board.").waitFor();

  const { data: createdStudent, error: createdStudentError } = await supabase
    .from("fee_followups")
    .select("id")
    .eq("student_name", testStudentName)
    .single();
  assert.ifError(createdStudentError);
  testStudentId = createdStudent.id;

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText(testStudentName).waitFor();

  const testRow = page.locator(".student-row").filter({ hasText: testStudentName });
  await testRow.getByRole("button", { name: "Log payment" }).click();
  await page.getByRole("spinbutton").fill("25");
  await page.getByRole("button", { name: "Save payment" }).click();
  await page.getByText("Saved. The board is up to date.").waitFor();
  await assertRowHas(testRow, "₹75.00", "Partially paid");
  assert.equal(await page.locator(".total-panel strong").textContent(), "₹15,225.00");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText(testStudentName).waitFor();
  const refreshedRow = page.locator(".student-row").filter({ hasText: testStudentName });
  await assertRowHas(refreshedRow, "₹75.00", "Partially paid");

  await refreshedRow.getByRole("button", { name: "New promise" }).click();
  await page.getByLabel("Promised date").fill("2026-11-12");
  await page.getByRole("button", { name: "Save promise" }).click();
  await page.getByText("Saved. The board is up to date.").waitFor();
  await assertRowHas(refreshedRow, "₹75.00", "Promise made");
  assert.equal(await page.locator(".total-panel strong").textContent(), "₹15,225.00");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText(testStudentName).waitFor();
  const { data: savedEvents, error: eventsError } = await supabase
    .from("fee_followup_events")
    .select("event_type")
    .eq("fee_followup_id", testStudentId);
  assert.ifError(eventsError);
  assert.deepEqual(savedEvents.map((event) => event.event_type).sort(), ["payment", "promise"]);
  assert.deepEqual(
    [...pageErrors, ...failedResponses, ...failedRequests],
    [],
    `Browser errors: ${pageErrors.join("; ")}; failed responses: ${failedResponses.join("; ")}; failed requests: ${failedRequests.join("; ")}`,
  );

  console.log(`Browser check passed: desktop ${desktop.viewport}px (${desktop.rows} demo rows, no overflow); phone ${mobile.viewport}px (${mobile.rows} demo rows, ${mobile.minActionHeight}px minimum action height, no overflow).`);
  console.log("Real-project browser flow passed: add, payment, and promise persisted after reload; totals and stages updated.");
  console.log(`Screenshots: ${path.join(tmpdir(), "fee-board-1440.png")} and ${path.join(tmpdir(), "fee-board-375.png")}`);
} finally {
  if (testStudentId) {
    await supabase.from("fee_followup_events").delete().eq("fee_followup_id", testStudentId);
    await supabase.from("fee_followups").delete().eq("id", testStudentId);
  }
  if (browser) await browser.close();
}

const { data: finalBoard, error: finalBoardError } = await supabase.rpc("get_demo_board_summary");
assert.ifError(finalBoardError);
assert.equal(finalBoard.students.length, 4);
assert.equal(Number(finalBoard.total_pending), 15150);
console.log("Browser test cleanup passed: 4 seeded demo rows and INR 15,150 remain.");

async function assertRowHas(row, balance, stage) {
  await row.getByText(balance).waitFor();
  await row.getByText(stage, { exact: true }).waitFor();
}

async function waitForAnimations(page) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  });
}

async function waitForStudent(page, studentName) {
  try {
    await page.getByText(studentName).waitFor({ timeout: 8000 });
  } catch (error) {
    const screenText = await page.locator("body").innerText();
    throw new Error(
      `${error.message}\nVisible screen:\n${screenText}\nBrowser errors: ${browserDiagnostics.pageErrors.join("; ")}\nFailed responses: ${browserDiagnostics.failedResponses.join("; ")}\nFailed requests: ${browserDiagnostics.failedRequests.join("; ")}`,
    );
  }
}
