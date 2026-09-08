import { LogOut } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireCompleteProfile } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { AccountNav } from "@/components/storefront/account/account-nav";
import { Button } from "@/components/ui/button";

/**
 * Account shell: a card with the signed-in person, the section list and sign-out on desktop; a
 * title plus a segmented section row on phones (sign-out moves under the content there).
 */
export default async function AccountLayout({ children, params }: LayoutProps<"/[locale]/s/[store]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireCompleteProfile(locale, `/${locale}/account`);
  const [t, tn] = await Promise.all([getTranslations("account"), getTranslations("nav")]);
  const name = user.profile.full_name?.trim() || null;
  const initial = (name ?? user.email ?? "•").trim().charAt(0).toUpperCase();
  const labels = { orders: t("orders"), addresses: t("addresses"), wishlist: t("wishlist"), profile: t("profile") };
  const signOut = (
    <form action={signOutAction.bind(null, locale)}>
      <Button variant="ghost" size="lg" type="submit">
        <LogOut data-icon="inline-start" />
        {tn("signOut")}
      </Button>
    </form>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-gutter pt-6 pb-16 md:pt-10 md:pb-24">
      <h1 className="mb-5 text-3xl font-semibold tracking-tight md:mb-8 md:text-4xl">{t("title")}</h1>
      <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10">
        <aside className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
          <div className="hidden items-center gap-3 rounded-xl border p-3 md:flex">
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
              {initial}
            </span>
            <span className="flex min-w-0 flex-col">
              {name && <span className="truncate text-sm font-medium">{name}</span>}
              {user.email && (
                <span className="truncate text-xs text-muted-foreground" dir="ltr">
                  {user.email}
                </span>
              )}
            </span>
          </div>
          <div className="md:rounded-xl md:border md:p-2">
            <AccountNav labels={labels} signOut={signOut} />
          </div>
        </aside>
        <section className="min-w-0">
          {children}
          <div className="mt-10 border-t pt-6 md:hidden">{signOut}</div>
        </section>
      </div>
    </main>
  );
}
