import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Cookie-bound Supabase client for Server Components, Server Actions and Route Handlers.
 * Runs as the signed-in user (or anon) so RLS applies. Reads cookies → dynamic; keep it out of
 * "use cache" scopes.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there. The proxy refreshes
          // sessions, so this is safe to ignore.
        }
      },
    },
  });
}
