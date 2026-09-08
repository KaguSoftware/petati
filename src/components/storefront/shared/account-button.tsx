import { User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";

const iconButton = buttonVariants({ variant: "ghost", size: "icon-lg" });

/** Reads the session cookie: dynamic. Always render inside <Suspense>. */
export async function AccountButton() {
  const t = await getTranslations("nav");
  const user = await getSessionUser();
  return (
    <Link href={user ? "/account" : "/sign-in"} aria-label={user ? t("account") : t("signIn")} className={iconButton}>
      <User className="size-5" />
    </Link>
  );
}

/** Same footprint as the real button so the header never shifts while the session loads. */
export function AccountButtonFallback() {
  return (
    <span aria-hidden className={iconButton}>
      <User className="size-5" />
    </span>
  );
}
