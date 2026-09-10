import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { CreatedToast } from "@/components/admin/stores/created-toast";
import { StoresTable } from "@/components/admin/stores/stores-table";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/admin/context";
import { listStoresWithDomains } from "@/lib/admin/stores/queries";

/**
 * The stores/layout.tsx gate 404s this page unless the user is a platform owner.
 */
export default async function StoresPage({ params }: PageProps<"/[locale]/admin/stores">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("stores");
  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Link href="/admin/stores/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" />
            {t("create")}
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <StoresList locale={locale} />
      </Suspense>
      <Suspense>
        <CreatedToast />
      </Suspense>
    </>
  );
}

async function StoresList({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "store.create");
  const rows = await listStoresWithDomains();
  return <StoresTable rows={rows} locale={ctx.locale} />;
}
