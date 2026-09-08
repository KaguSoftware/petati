import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LogoUploader } from "@/components/admin/design/logo-uploader";
import { ThemeEditor } from "@/components/admin/design/theme-editor";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";
import { availableVariants } from "@/lib/theme/registry";
import { SECTION_KEYS, type SectionKey, type VariantKey } from "@/lib/theme/types";

export default async function DesignPage({ params }: PageProps<"/[locale]/admin/design">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader title={t("nav.design")} description={t("design.description")} />
      <Suspense fallback={<TableSkeleton />}>
        <Content locale={locale} />
      </Suspense>
    </>
  );
}

async function Content({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "store.design");
  const { store } = ctx;
  const available = Object.fromEntries(SECTION_KEYS.map((k) => [k, availableVariants(k)])) as Record<SectionKey, VariantKey[]>;
  // Dev-only harness (the route 404s in production); decided on the server so the client never checks NODE_ENV.
  const previewHref = process.env.NODE_ENV !== "production" ? `/${ctx.locale}/preview/minimal` : null;
  return (
    <div className="flex flex-col gap-6">
      <LogoUploader storeId={store.id} logoUrl={store.logo_url} faviconUrl={store.favicon_url} />
      <ThemeEditor
        storeId={store.id}
        storeName={store.name}
        locale={ctx.locale}
        theme={store.theme}
        enabledLocales={store.enabled_locales}
        available={available}
        previewHref={previewHref}
      />
    </div>
  );
}
