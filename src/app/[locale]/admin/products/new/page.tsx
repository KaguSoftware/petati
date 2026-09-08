import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductForm } from "@/components/admin/products/product-form";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";
import { listCategoryOptions } from "@/lib/admin/products/queries";

type Props = PageProps<"/[locale]/admin/products/new">;

export default async function NewProductPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: t("nav.products") }} title={t("products.new")} description={t("products.newHint")} />
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <Content locale={locale} />
      </Suspense>
    </>
  );
}

async function Content({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "products.write");
  const categories = await listCategoryOptions(ctx.store.id, ctx.locale, ctx.store.default_locale);
  return (
    <ProductForm storeId={ctx.store.id} locale={ctx.locale} defaultLocale={ctx.store.default_locale} enabledLocales={ctx.store.enabled_locales} categories={categories} />
  );
}
