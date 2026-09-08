import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { CreateStoreWizard } from "@/components/admin/stores/create-store-wizard";
import { requireAdminPage } from "@/lib/admin/context";
import { env } from "@/lib/env";
import { availableVariants } from "@/lib/theme/registry";
import { SECTION_KEYS, type SectionKey, type VariantKey } from "@/lib/theme/types";

/** SCOPE(multi-store, unpaid): gated by stores/layout.tsx. */
export default async function NewStorePage({ params }: PageProps<"/[locale]/admin/stores/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("stores");
  return (
    <>
      <PageHeader title={t("wizard.title")} description={t("wizard.subtitle")} back={{ href: "/admin/stores", label: t("title") }} />
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <Wizard locale={locale} />
      </Suspense>
    </>
  );
}

async function Wizard({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "store.create");
  const variants = Object.fromEntries(SECTION_KEYS.map((k) => [k, availableVariants(k)])) as Record<SectionKey, VariantKey[]>;
  return (
    <CreateStoreWizard
      locale={ctx.locale}
      rootDomain={env.rootDomain()}
      defaultStoreSlug={env.defaultStoreSlug()}
      showPreviewLinks={process.env.NODE_ENV !== "production"}
      variants={variants}
    />
  );
}
