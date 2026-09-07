"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export interface AuthState {
  error?: string;
  message?: string;
}

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
  locale: z.string().min(2).max(2),
});

/** Only allow same-site relative redirects. */
function safeNext(next: string | undefined, locale: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return `/${locale}`;
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { email, password, next, locale } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(safeNext(next, locale));
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials
    .extend({ full_name: z.string().min(1).max(120) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { email, password, full_name, next, locale } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${env.appUrl()}/auth/callback?next=${encodeURIComponent(safeNext(next, locale))}`,
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect(safeNext(next, locale));
  return { message: "checkEmail" };
}

export async function signOutAction(locale: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({ email: z.string().email(), locale: z.string() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.appUrl()}/auth/callback?next=${encodeURIComponent(`/${parsed.data.locale}/account/password`)}`,
  });
  // Always report success so the form cannot be used to probe which emails exist.
  return { message: "checkEmail" };
}

export async function signInWithGoogleAction(locale: string, next?: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.appUrl()}/auth/callback?next=${encodeURIComponent(safeNext(next, locale))}`,
    },
  });
  if (error || !data.url) redirect(`/${locale}/sign-in?error=oauth`);
  redirect(data.url);
}
