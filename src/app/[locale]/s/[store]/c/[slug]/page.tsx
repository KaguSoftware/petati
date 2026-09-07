import { Suspense } from "react";
import { notFound } from "next/navigation";
import { storeContext } from "@/lib/tenant/context";
import { getCategories } from "@/lib/catalog/queries";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { Results } from "../../shop/page";

export default async function CategoryPage({ params, searchParams }: PageProps<"/[locale]/s/[store]/c/[slug]">) {
  const ctx = await storeContext(params);
  const { slug } = await params;
  const categories = await getCategories(ctx.store.id, ctx.locale, ctx.fallback);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-5">
        <ProductImage src={category.imageUrl} alt={category.name} className="size-20 rounded-lg" sizes="80px" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
          {category.description && <p className="text-muted-foreground">{category.description}</p>}
        </div>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <Results ctx={ctx} searchParams={searchParams} categorySlug={slug} />
      </Suspense>
    </main>
  );
}
