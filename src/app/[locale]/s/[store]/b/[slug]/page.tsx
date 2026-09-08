import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { storeContext } from "@/lib/tenant/context";
import { getBrands } from "@/lib/catalog/queries";
import { BrandMark } from "@/components/storefront/shared/brand-mark";
import { Results } from "../../shop/page";

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
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-5">
        <BrandMark name={brand.name} logoUrl={brand.logoUrl} size={80} />
        <h1 className="text-3xl font-semibold tracking-tight">{brand.name}</h1>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <Results ctx={ctx} searchParams={searchParams} brandSlug={slug} />
      </Suspense>
    </main>
  );
}
