import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";

// SCOPE(admin): placeholder until the coupons module lands in this build. GROWS LATER → full module.
export default async function CouponsPage({ params }: PageProps<"/[locale]/admin/coupons">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader title={t("nav.coupons")} />
      <Suspense fallback={<TableSkeleton />}>
        <Content locale={locale} />
      </Suspense>
    </>
  );
}

async function Content({ locale }: { locale: string }) {
  await requireAdminPage(locale, "coupons.manage");
  const t = await getTranslations("admin.common");
  return <EmptyState title={t("comingSoon")} description={t("comingSoonHint")} />;
}
