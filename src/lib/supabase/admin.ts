import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role client. BYPASSES RLS. Only use after an explicit permission check
 * (see src/lib/auth/permissions.ts) or for tenant resolution / public catalog reads that are
 * scoped by store_id in the query itself. Never expose to the browser.
 */
export function createSupabaseAdminClient() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
