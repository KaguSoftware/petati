import { User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { AccountMenu } from "./account-menu";

const trigger = buttonVariants({ variant: "ghost", size: "icon-lg", className: "rounded-full" });

/**
 * The navbar's account control: one menu holding the account links, the colour scheme and the
 * language. Reads the session cookie, so it is dynamic — always render inside <Suspense>.
 *
 * This replaced a plain icon that linked to /account or /sign-in. Three separate navbar controls
 * (account, theme, language) collapsed into this one; the cart deliberately stayed separate.
 */
export async function AccountMenuSlot({ enabledLocales }: { enabledLocales?: readonly string[] }) {
  const user = await getSessionUser();
  return (
    <AccountMenu
      enabledLocales={enabledLocales}
      user={user ? { name: user.profile.full_name, email: user.email ?? "" } : null}
    />
  );
}

/** Same footprint as the menu trigger, so the header never shifts while the session loads. */
export function AccountMenuFallback() {
  return (
    <span aria-hidden className={trigger}>
      <User className="size-5" />
    </span>
  );
}
