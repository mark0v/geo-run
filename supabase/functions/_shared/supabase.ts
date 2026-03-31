import { createClient } from "jsr:@supabase/supabase-js@2";

export const DEMO_AUTH_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_SUPABASE_URL = "http://127.0.0.1:54321";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-local-anon-key.demo-local-anon-key";

export function getSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? DEFAULT_SUPABASE_URL;
  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY") ??
    DEFAULT_SUPABASE_ANON_KEY;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type SupabaseAdminClient = ReturnType<typeof getSupabaseAdminClient>;

export function getActingAuthUserId(request: Request): string {
  return request.headers.get("x-player-auth-user-id") ?? DEMO_AUTH_USER_ID;
}
