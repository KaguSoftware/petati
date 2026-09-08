import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { ShippingRates } from "@/components/admin/settings/shipping-rates";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";
import { listShippingRates } from "@/lib/admin/settings/queries";

export default async function ShippingSettingsPage({ params }: PageProps<"/[locale]/admin/settings/shipping">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader title={t("nav.settings")} description={t("settings.description")} />
      <SettingsNav />
      <Suspense fallback={<TableSkeleton />}>
        <Content locale={locale} />
      </Suspense>
    </>
  );
}

async function Content({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "store.settings");
  const { store } = ctx;
  const rates = await listShippingRates(store.id);
  return <ShippingRates storeId={store.id} currency={store.currency} locale={ctx.locale} enabledLocales={store.enabled_locales} rates={rates} />;
}
