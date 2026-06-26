import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

if (!url || !key) {
  // Don't throw — a throw during module init crashes the entire app before React mounts.
  // The login page will render; sign-in will fail until real credentials are added.
  console.warn(
    "[mess-app] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.\n" +
    "Add them to frontend/.env and restart the dev server."
  );
}

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder-anon-key"
);
