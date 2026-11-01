export async function loadBoard(client) {
  try {
    const { data, error } = await client.rpc("get_demo_board_summary");
    if (error) {
      return { status: "error", message: error.message || "Supabase request failed." };
    }
    if (!data || !Array.isArray(data.students)) {
      return { status: "error", message: "Supabase returned an unexpected board response." };
    }

    return {
      status: data.students.length ? "ready" : "empty",
      data,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Supabase request failed.",
    };
  }
}
