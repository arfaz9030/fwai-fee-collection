import { createClient } from "@supabase/supabase-js";

export const REQUIRED_SETTINGS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

let browserClient;
let browserClientSettings;

export function readSupabaseSettings() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  };
}

export function getMissingSettings(settings) {
  return REQUIRED_SETTINGS.filter((name) => !settings[name]?.trim());
}

export function createSupabaseClient(settings) {
  const missing = getMissingSettings(settings);
  if (missing.length) return { client: null, missing };

  const settingsKey = `${settings.NEXT_PUBLIC_SUPABASE_URL}\n${settings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`;
  if (typeof window !== "undefined" && browserClient && browserClientSettings === settingsKey) {
    return { client: browserClient, missing: [] };
  }

  const client = createClient(
    settings.NEXT_PUBLIC_SUPABASE_URL,
    settings.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (typeof window !== "undefined") {
    browserClient = client;
    browserClientSettings = settingsKey;
  }

  return {
    client,
    missing: [],
  };
}
