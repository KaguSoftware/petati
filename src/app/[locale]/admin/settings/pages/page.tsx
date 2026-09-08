import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PagesForm } from "@/components/admin/settings/pages-form";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";

export default async function PagesSettingsPage({ params }: PageProps<"/[locale]/admin/settings/pages">) {
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
  const pages = ((store.settings ?? {}).pages ?? {}) as Record<string, Record<string, string>>;
  return (
    <div className="max-w-3xl">
      <PagesForm storeId={store.id} locale={ctx.locale} enabledLocales={store.enabled_locales} pages={pages} />
    </div>
  );
}
