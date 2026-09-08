import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CommerceForm } from "@/components/admin/settings/commerce-form";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";

export default async function CommerceSettingsPage({ params }: PageProps<"/[locale]/admin/settings/commerce">) {
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
  return (
    <div className="max-w-3xl">
      <CommerceForm
        locale={ctx.locale}
        store={{ id: store.id, currency: store.currency, tax_rate_bp: store.tax_rate_bp, prices_include_tax: store.prices_include_tax, low_stock_threshold: store.low_stock_threshold }}
      />
    </div>
  );
}
