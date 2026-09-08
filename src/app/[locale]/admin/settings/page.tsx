import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DomainsCard } from "@/components/admin/settings/domains-card";
import { GeneralForm } from "@/components/admin/settings/general-form";
import { PaymentsCard } from "@/components/admin/settings/payments-card";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";

export default async function SettingsPage({ params }: PageProps<"/[locale]/admin/settings">) {
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
        {/* SCOPE(multi-store, unpaid): never rendered for the client (flag off). */}
        {ctx.multiStore && <DomainsCard slug={store.slug} />}
      </div>
    </div>
  );
}
