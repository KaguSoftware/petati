import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireCompleteProfile } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { AccountNav } from "@/components/storefront/account/account-nav";
import { Button } from "@/components/ui/button";

export default async function AccountLayout({ children, params }: LayoutProps<"/[locale]/s/[store]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCompleteProfile(locale, `/${locale}/account`);
  const [t, tn] = await Promise.all([getTranslations("account"), getTranslations("nav")]);
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <AccountNav labels={{ orders: t("orders"), addresses: t("addresses"), wishlist: t("wishlist"), profile: t("profile") }} />
        <form action={signOutAction.bind(null, locale)}>
          <Button variant="outline" size="sm" type="submit">
            {tn("signOut")}
          </Button>
        </form>
      </aside>
      <section className="min-w-0">{children}</section>
    </main>
  );
}
