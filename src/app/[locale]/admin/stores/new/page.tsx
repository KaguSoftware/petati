import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { CreateStoreWizard } from "@/components/admin/stores/create-store-wizard";
import { requireAdminPage } from "@/lib/admin/context";
import { env } from "@/lib/env";
import { buildSectionPreviews } from "@/lib/theme/preview";
import { composeHome } from "@/lib/theme/preview-compose";
import { availableVariants } from "@/lib/theme/registry";
import { SECTION_KEYS, VARIANT_KEYS, type SectionKey, type VariantKey } from "@/lib/theme/types";

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
  const t = await getTranslations("stores");
  // One home page per design language, drawn with sample data, for the preset cards of the design step.
  const previews = await buildSectionPreviews({ locale: ctx.locale, storeName: t("wizard.previewStoreName"), logoUrl: null, currency: "TRY", announcement: "" });
  const presetPreviews = Object.fromEntries(
    VARIANT_KEYS.map((v) => [v, composeHome(previews, Object.fromEntries(SECTION_KEYS.map((k) => [k, v])) as Record<SectionKey, VariantKey>)]),
  ) as Record<VariantKey, React.ReactNode[]>;
  return (
    <CreateStoreWizard
      presetPreviews={presetPreviews}
      locale={ctx.locale}
      rootDomain={env.rootDomain()}
      defaultStoreSlug={env.defaultStoreSlug()}
      showPreviewLinks={process.env.NODE_ENV !== "production"}
      variants={variants}
    />
  );
}
