import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url, "NEXT_PUBLIC_SUPABASE_URL is missing");
assert.ok(key, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing");

const client = createClient(url, key);
let smokeId;

try {
  const { data: initial, error: initialError } = await client.rpc("get_demo_board_summary");
  assert.ifError(initialError);
  assert.equal(initial.students.length, 4);
  assert.equal(Number(initial.total_pending), 15150);

  const { data: created, error: createError } = await client.rpc("create_demo_followup", {
    p_student_name: "Smoke Test Student",
    p_grade_label: "Test record",
    p_amount_owed: 100,
    p_promised_date: null,
  });
  assert.ifError(createError);
  smokeId = created.student.id;
  assert.equal(created.student.stage, "Needs follow-up");
  assert.equal(Number(created.total_pending), 15250);

  const invalidCreates = [
    { p_student_name: " ", p_grade_label: "Test record", p_amount_owed: 100, p_promised_date: null },
    { p_student_name: "Invalid test", p_grade_label: " ", p_amount_owed: 100, p_promised_date: null },
    { p_student_name: "Invalid test", p_grade_label: "Test record", p_amount_owed: 0, p_promised_date: null },
    { p_student_name: "Invalid test", p_grade_label: "Test record", p_amount_owed: 1.234, p_promised_date: null },
  ];
  for (const invalidCreate of invalidCreates) {
    const { error } = await client.rpc("create_demo_followup", invalidCreate);
    assert.ok(error, "The database must reject invalid student data");
  }

  const { data: afterInvalidCreates, error: invalidCreateReadError } = await client.rpc("get_demo_board_summary");
  assert.ifError(invalidCreateReadError);
  assert.equal(afterInvalidCreates.students.length, 5, "Rejected student records must save nothing");
  assert.equal(Number(afterInvalidCreates.total_pending), 15250);

  const { error: zeroPaymentError } = await client.rpc("log_demo_outcome", {
    p_fee_followup_id: smokeId,
    p_event_type: "payment",
    p_payment_amount: 0,
    p_promised_date: null,
    p_note: null,
  });
  assert.ok(zeroPaymentError, "The database must reject a zero payment");

  const { error: missingPromiseDateError } = await client.rpc("log_demo_outcome", {
    p_fee_followup_id: smokeId,
    p_event_type: "promise",
    p_payment_amount: null,
    p_promised_date: null,
    p_note: null,
  });
  assert.ok(missingPromiseDateError, "The database must reject a promise without a date");

  const { data: noInvalidEvents, error: invalidEventReadError } = await client
    .from("fee_followup_events")
    .select("id")
    .eq("fee_followup_id", smokeId);
  assert.ifError(invalidEventReadError);
  assert.equal(noInvalidEvents.length, 0, "Rejected outcomes must save nothing");

  const { data: updated, error: updateError } = await client
    .from("fee_followups")
    .update({ grade_label: "Updated test record" })
    .eq("id", smokeId)
    .select("grade_label")
    .single();
  assert.ifError(updateError);
  assert.equal(updated.grade_label, "Updated test record");

  const { data: payment, error: paymentError } = await client.rpc("log_demo_outcome", {
    p_fee_followup_id: smokeId,
    p_event_type: "payment",
    p_payment_amount: 25,
    p_promised_date: null,
    p_note: "Synthetic access test",
  });
  assert.ifError(paymentError);
  assert.equal(Number(payment.total_pending), 15225);
  assert.equal(payment.student.stage, "Partially paid");

  const { data: promise, error: promiseError } = await client.rpc("log_demo_outcome", {
    p_fee_followup_id: smokeId,
    p_event_type: "promise",
    p_payment_amount: null,
    p_promised_date: "2026-11-12",
    p_note: "Synthetic promise test",
  });
  assert.ifError(promiseError);
  assert.equal(Number(promise.total_pending), 15225);
  assert.equal(promise.student.stage, "Promise made");

  const { data: events, error: eventReadError } = await client
    .from("fee_followup_events")
    .select("id,event_type")
    .eq("fee_followup_id", smokeId);
  assert.ifError(eventReadError);
  assert.equal(events.length, 2);

  const { data: changedEvent, error: eventUpdateError } = await client
    .from("fee_followup_events")
    .update({ note: "Updated synthetic note" })
    .eq("fee_followup_id", smokeId)
    .eq("event_type", "payment")
    .select("id");
  assert.ifError(eventUpdateError);
  assert.equal(changedEvent.length, 1);

  const { data: deletedEvent, error: eventDeleteError } = await client
    .from("fee_followup_events")
    .delete()
    .eq("fee_followup_id", smokeId)
    .eq("event_type", "payment")
    .select("id");
  assert.ifError(eventDeleteError);
  assert.equal(deletedEvent.length, 1);

  const { error: privateInsertError } = await client.from("fee_followups").insert({
    institution_id: "private-test",
    student_name: "Must Not Be Public",
    grade_label: "Test record",
    amount_owed: 1,
    currency_code: "INR",
    stage: "Needs follow-up",
    is_demo: false,
  });
  assert.ok(privateInsertError, "RLS should reject inserts that are not marked as demo");

  const { data: deletedStudent, error: studentDeleteError } = await client
    .from("fee_followups")
    .delete()
    .eq("id", smokeId)
    .select("id")
    .single();
  assert.ifError(studentDeleteError);
  assert.equal(deletedStudent.id, smokeId);
  smokeId = null;

  console.log("Supabase anon smoke: validated demo-student creation, demo CRUD, invalid-input rejection, payment, promise, event CRUD, and private-row denial passed.");
} finally {
  if (smokeId) {
    await client.from("fee_followup_events").delete().eq("fee_followup_id", smokeId);
    await client.from("fee_followups").delete().eq("id", smokeId);
  }
}

const { data: final, error: finalError } = await client.rpc("get_demo_board_summary");
assert.ifError(finalError);
assert.equal(final.students.length, 4);
assert.equal(Number(final.total_pending), 15150);
console.log(`Cleanup verified: ${final.students.length} demo students, total INR ${Number(final.total_pending).toFixed(2)}.`);
