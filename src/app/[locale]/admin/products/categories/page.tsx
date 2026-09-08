import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryDialog } from "@/components/admin/products/category-dialog";
import { CategoryList } from "@/components/admin/products/category-list";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin/context";
import { listCategoriesAdmin } from "@/lib/admin/products/queries";
import { can } from "@/lib/auth/permissions";

type Props = PageProps<"/[locale]/admin/products/categories">;

export default async function CategoriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <Suspense
      fallback={
        <>
          <PageHeader back={{ href: "/admin/products", label: t("nav.products") }} title={t("categories.title")} />
          <TableSkeleton />
        </>
      }
    >
      <Content locale={locale} />
    </Suspense>
  );
}

async function Content({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "products.read");
  const fallback = ctx.store.default_locale;
  const [rows, t] = await Promise.all([listCategoriesAdmin(ctx.store.id, ctx.locale, fallback), getTranslations("admin")]);
  const canWrite = can(ctx.role, "products.write");
  const parents = rows.map((r) => ({ id: r.id, name: r.name, parentId: r.parent_id }));
  return (
    <>
      <PageHeader
        back={{ href: "/admin/products", label: t("nav.products") }}
        title={t("categories.title")}
        description={t("categories.hint")}
        actions={
          canWrite ? (
            <CategoryDialog
              storeId={ctx.store.id}
              locale={ctx.locale}
              defaultLocale={fallback}
              enabledLocales={ctx.store.enabled_locales}
              parents={parents}
              trigger={<Button type="button">{t("categories.new")}</Button>}
            />
          ) : null
        }
      />
      <CategoryList rows={rows} storeId={ctx.store.id} locale={ctx.locale} defaultLocale={fallback} enabledLocales={ctx.store.enabled_locales} canWrite={canWrite} />
    </>
  );
}
