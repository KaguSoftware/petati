import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { CouriersTable } from "@/components/admin/delivery/couriers-table";
import { CourierDialog } from "@/components/admin/delivery/courier-dialog";
import { requireAdminPage } from "@/lib/admin/context";
import { listCouriers } from "@/lib/admin/delivery/queries";

type Props = PageProps<"/[locale]/admin/delivery/couriers">;

export default async function CouriersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader
        back={{ href: "/admin/delivery", label: t("nav.delivery") }}
        title={t("delivery.couriers.title")}
        actions={
          <Suspense fallback={null}>
            <NewCourier locale={locale} />
          </Suspense>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <List locale={locale} />
      </Suspense>
    </>
  );
}

async function NewCourier({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "delivery.manage");
  return <CourierDialog storeId={ctx.store.id} />;
}

async function List({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "delivery.manage");
  const [couriers, t] = await Promise.all([listCouriers(ctx.store.id), getTranslations("admin")]);
  // The token is deliberately absent from `listCouriers`; the link is composed from a second read
  // per row only when the admin asks to see it.
  return <CouriersTable storeId={ctx.store.id} rows={couriers} locale={ctx.locale} currency={ctx.store.currency} emptyTitle={t("delivery.couriers.none")} emptyHint={t("delivery.couriers.noneHint")} />;
}
