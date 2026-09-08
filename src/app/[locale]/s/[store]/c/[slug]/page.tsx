import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";
import { getCategories } from "@/lib/catalog/queries";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { Results } from "../../shop/page";

const chip =
  "inline-flex items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

/**
 * Category listing. Categories form a tree: a parent page lists every product in its subtree
 * (see getProducts) and offers the children as chips; a child page links back to its parent.
 */
export default async function CategoryPage({ params, searchParams }: PageProps<"/[locale]/s/[store]/c/[slug]">) {
  const ctx = await storeContext(params);
  const { slug } = await params;
  const [categories, t] = await Promise.all([getCategories(ctx.store.id, ctx.locale, ctx.fallback), getTranslations("category")]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const parent = category.parentId ? categories.find((c) => c.id === category.parentId) : undefined;
  const children = categories.filter((c) => c.parentId === category.id);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      {parent && (
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href={`/c/${parent.slug}`} className="hover:text-foreground hover:underline">
            {parent.name}
          </Link>
          <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
          <span className="text-foreground" aria-current="page">
            {category.name}
          </span>
        </nav>
      )}
      <div className="mb-6 flex items-center gap-5">
        <ProductImage src={category.imageUrl} alt={category.name} className="size-20 rounded-lg" sizes="80px" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
          {category.description && <p className="text-muted-foreground">{category.description}</p>}
        </div>
      </div>
      {children.length > 0 && (
        <nav aria-label={t("subcategories")} className="mb-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <Link key={c.id} href={`/c/${c.slug}`} className={chip}>
              {c.name}
            </Link>
          ))}
        </nav>
      )}
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <Results ctx={ctx} searchParams={searchParams} categorySlug={slug} />
      </Suspense>
    </main>
  );
}
