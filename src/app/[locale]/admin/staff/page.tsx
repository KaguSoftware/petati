import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { InviteDialog } from "@/components/admin/staff/invite-dialog";
import { OwnersList } from "@/components/admin/staff/owners-list";
import { StaffTable } from "@/components/admin/staff/staff-table";
import { requireAdminPage } from "@/lib/admin/context";
import { listOwners, listStaff } from "@/lib/admin/staff/queries";

export default async function StaffPage({ params }: PageProps<"/[locale]/admin/staff">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <Suspense fallback={<PageHeader title={t("nav.staff")} description={t("staff.description")} />}>
        <Header locale={locale} />
      </Suspense>
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <Content locale={locale} />
      </Suspense>
    </>
  );
}

async function Header({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "staff.manage");
  const t = await getTranslations("admin");
  return <PageHeader title={t("nav.staff")} description={t("staff.description")} actions={<InviteDialog storeId={ctx.store.id} locale={ctx.locale} />} />;
}

async function Content({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "staff.manage");
  const isOwner = ctx.role === "owner";
  const [rows, owners] = await Promise.all([listStaff(ctx.store.id), isOwner ? listOwners() : Promise.resolve([])]);
  return (
    <div className="flex flex-col gap-6">
      <StaffTable
        storeId={ctx.store.id}
        locale={ctx.locale}
        rows={rows}
        actor={{ id: ctx.user.id, role: ctx.role }}
        inviteButton={<InviteDialog storeId={ctx.store.id} locale={ctx.locale} size="sm" />}
      />
      {/* Only platform owners see who else has platform-wide access. */}
      {isOwner && owners.length > 0 && <OwnersList owners={owners} />}
    </div>
  );
}
