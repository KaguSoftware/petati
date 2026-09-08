import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { defaultLocale, isLocale } from "@/i18n/config";

/** OAuth / magic-link / password-reset landing. Exchanges the code for a session, then redirects. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const firstSegment = next.split("/")[1] ?? "";
  const locale = isLocale(firstSegment) ? firstSegment : defaultLocale;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google sign-ins arrive without a phone: send them through the one-time completion screen.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle<{ phone: string | null }>();
        if (!profile?.phone && !next.includes("/complete-profile")) {
          return NextResponse.redirect(new URL(`/${locale}/complete-profile?next=${encodeURIComponent(next)}`, url.origin));
        }
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL(`/${locale}/sign-in?error=oauth`, url.origin));
}
