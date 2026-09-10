import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CommerceForm } from "@/components/admin/settings/commerce-form";
import { DomainsCard } from "@/components/admin/settings/domains-card";
import { FooterForm } from "@/components/admin/settings/footer-form";
import { GeneralForm } from "@/components/admin/settings/general-form";
import { PagesForm } from "@/components/admin/settings/pages-form";
import { PaymentsCard } from "@/components/admin/settings/payments-card";
import { ShippingRates } from "@/components/admin/settings/shipping-rates";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TabbedPanels } from "@/components/admin/shared/tabbed-panels";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";
import { listShippingRates } from "@/lib/admin/settings/queries";

/**
 * One page, four panels (general · commerce · pages · shipping). Everything is loaded in a single
 * wave and rendered up front, so switching tabs is instant; `?tab=` keeps deep-links working
 * (the old /settings/<tab> routes redirect here).
 */
export default async function SettingsPage({ params }: PageProps<"/[locale]/admin/settings">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader title={t("nav.settings")} description={t("settings.description")} />
      <Suspense fallback={<TableSkeleton />}>
        <Content locale={locale} />
      </Suspense>
    </>
  );
}

async function Content({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "store.settings");
  const { store } = ctx;
  const [rates, t] = await Promise.all([listShippingRates(store.id), getTranslations("admin.settings.nav")]);
  const pages = ((store.settings ?? {}).pages ?? {}) as Record<string, Record<string, string>>;

  const panels = [
    {
      value: "general",
      label: t("general"),
      content: (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <GeneralForm
            store={{
              id: store.id,
              name: store.name,
              tagline: store.tagline,
              contact_email: store.contact_email,
              contact_phone: store.contact_phone,
              email_from: store.email_from,
              timezone: store.timezone,
              default_locale: store.default_locale,
              enabled_locales: store.enabled_locales,
            }}
          />
          <div className="flex flex-col gap-6">
            <PaymentsCard />
            {/* Owner-only. */}
            {ctx.multiStore && <DomainsCard slug={store.slug} />}
          </div>
        </div>
      ),
    },
    {
      value: "commerce",
      label: t("commerce"),
      content: (
        <div className="max-w-3xl">
          <CommerceForm
            locale={ctx.locale}
            store={{ id: store.id, currency: store.currency, tax_rate_bp: store.tax_rate_bp, prices_include_tax: store.prices_include_tax, low_stock_threshold: store.low_stock_threshold }}
          />
        </div>
      ),
    },
    {
      value: "pages",
      label: t("pages"),
      content: (
        <div className="max-w-3xl">
          <PagesForm storeId={store.id} locale={ctx.locale} enabledLocales={store.enabled_locales} pages={pages} />
        </div>
      ),
    },
    {
      value: "footer",
      label: t("footer"),
      content: (
        <div className="max-w-3xl">
          <FooterForm storeId={store.id} locale={ctx.locale} enabledLocales={store.enabled_locales} footer={store.footer} />
        </div>
      ),
    },
    {
      value: "shipping",
      label: t("shipping"),
      content: <ShippingRates storeId={store.id} currency={store.currency} locale={ctx.locale} enabledLocales={store.enabled_locales} rates={rates} />,
    },
  ];

  return <TabbedPanels label={t("label")} panels={panels} />;
}
