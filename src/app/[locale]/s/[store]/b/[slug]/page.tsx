import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { storeContext } from "@/lib/tenant/context";
import { getBrands } from "@/lib/catalog/queries";
import { BrandMark } from "@/components/storefront/shared/brand-mark";
import { PageShell } from "@/components/storefront/shared/page-shell";
import { Results, ResultsSkeleton } from "../../shop/page";

export async function generateMetadata({ params }: PageProps<"/[locale]/s/[store]/b/[slug]">): Promise<Metadata> {
  const ctx = await storeContext(params);
  const { slug } = await params;
  const brand = (await getBrands(ctx.store.id)).find((b) => b.slug === slug);
  return brand ? { title: brand.name } : {};
}

/** Brand listing: every active product of one brand, with the shop toolbar minus the brand select. */
export default async function BrandPage({ params, searchParams }: PageProps<"/[locale]/s/[store]/b/[slug]">) {
  const ctx = await storeContext(params);
  const { slug } = await params;
  const brand = (await getBrands(ctx.store.id)).find((b) => b.slug === slug);
  if (!brand) notFound();

  return (
    <PageShell>
      <div className="flex items-center gap-4 @tablet:gap-5">
        <BrandMark name={brand.name} logoUrl={brand.logoUrl} size={72} />
        <h1 className="bidi-auto text-3xl font-semibold tracking-tight @tablet:text-4xl">{brand.name}</h1>
      </div>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results ctx={ctx} searchParams={searchParams} brandSlug={slug} />
      </Suspense>
    </PageShell>
  );
}
