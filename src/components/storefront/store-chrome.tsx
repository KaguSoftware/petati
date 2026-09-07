import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { renderSection } from "@/lib/theme/registry";
import { getCategories } from "@/lib/catalog/queries";
import type { StoreContext } from "@/lib/tenant/context";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AccountButton, AccountButtonFallback } from "./shared/account-button";
import { CartButton, CartButtonFallback } from "./shared/cart-button";

/** Announcement bar + navbar + footer around every storefront page, using the store's variants. */
export async function StoreChrome({ ctx, children }: { ctx: StoreContext; children: React.ReactNode }) {
  const { store, locale, fallback } = ctx;
  const [t, tf, categories] = await Promise.all([
    getTranslations("nav"),
    getTranslations("footer"),
    getCategories(store.id, locale, fallback),
  ]);
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <>
      {renderSection("announcementBar", store.theme.sections.announcementBar, {
        text: store.theme.announcement[locale] ?? store.theme.announcement[fallback] ?? "",
      })}
      {renderSection("navbar", store.theme.sections.navbar, {
        storeName: store.name,
        logoUrl: store.logo_url,
        categories: topLevel,
        labels: { home: t("home"), shop: t("shop"), search: t("search"), menu: t("menu") },
        localeSlot: <LocaleSwitcher enabled={store.enabled_locales} />,
        accountSlot: (
          <Suspense fallback={<AccountButtonFallback />}>
            <AccountButton />
          </Suspense>
        ),
        cartSlot: (
          <Suspense fallback={<CartButtonFallback />}>
            <CartButton store={store} locale={locale} />
          </Suspense>
        ),
      })}
      <div className="flex flex-1 flex-col">{children}</div>
      {renderSection("footer", store.theme.sections.footer, {
        storeName: store.name,
        tagline: store.tagline,
        categories: topLevel,
        contactEmail: store.contact_email,
        contactPhone: store.contact_phone,
        labels: {
          categories: t("categories"),
          contact: tf("contact"),
          rights: tf("rights"),
          about: tf("about"),
          privacy: tf("privacy"),
          terms: tf("terms"),
        },
        localeSlot: <LocaleSwitcher enabled={store.enabled_locales} />,
        year: new Date().getFullYear(),
      })}
    </>
  );
}
