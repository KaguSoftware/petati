import { User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";

/** Reads the session cookie: dynamic. Always render inside <Suspense>. */
export async function AccountButton() {
  const t = await getTranslations("nav");
  const user = await getSessionUser();
  return (
    <Link
      href={user ? "/account" : "/sign-in"}
      aria-label={user ? t("account") : t("signIn")}
      className="inline-flex size-10 items-center justify-center rounded-md hover:bg-muted"
    >
      <User className="size-5" />
    </Link>
  );
}

export function AccountButtonFallback() {
  return (
    <span className="inline-flex size-10 items-center justify-center">
      <User className="size-5" />
    </span>
  );
}
