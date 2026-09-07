/**
 * Central place for environment access. Import from here instead of touching process.env so the
 * list of variables the app relies on stays discoverable (see .env.example).
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  /** e.g. "petati.com" or "localhost:3000". Subdomains of this resolve to stores. */
  rootDomain: () => process.env.ROOT_DOMAIN ?? "localhost:3000",
  defaultStoreSlug: () => process.env.DEFAULT_STORE_SLUG ?? "default",
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  resendApiKey: () => process.env.RESEND_API_KEY,
  emailFromFallback: () => process.env.EMAIL_FROM_FALLBACK ?? "noreply@example.com",
};

export const features = {
  /**
   * SCOPE(multi-store, unpaid): the client has not paid for multi-store yet. Every UI trace of
   * creating/switching stores is gated here AND by Owner role. GROWS LATER → flip to true.
   */
  multiStore: () => process.env.FEATURE_MULTI_STORE === "true",
};
