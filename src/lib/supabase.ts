import { createClient } from "@supabase/supabase-js";

// Both legacy anon keys and modern publishable keys are public client keys.
// Keep the project's original public configuration when deployment variables
// are absent. Never combine a custom URL with another project's fallback key.
const DEFAULT_URL = "https://coghwghshcjaaqrtyvlh.supabase.co";
const DEFAULT_KEY = "sb_publishable_wdUttDFRmzJzrFziI9rUzg_4fQCyXK7";
const configuredUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const configuredKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
let validUrl = false;
try {
  validUrl = ["https:", "http:"].includes(new URL(configuredUrl).protocol);
} catch { /* Missing or invalid configuration uses the original project. */ }
const useConfiguredProject = validUrl && Boolean(configuredKey);
const SUPABASE_URL = useConfiguredProject ? configuredUrl : DEFAULT_URL;
const SUPABASE_ANON_KEY = useConfiguredProject ? configuredKey : DEFAULT_KEY;
if (!useConfiguredProject && (configuredUrl || configuredKey)) {
  console.warn("[Supabase] Configuration incomplète : utilisation du projet Supabase d’origine.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
