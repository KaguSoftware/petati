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
 * With a category photo the header is a wide banner with the name laid over it (the same language
 * as the overlay tiles on the home page); without one it is a plain heading.
 */
export default async function CategoryPage({ params, searchParams }: PageProps<"/[locale]/s/[store]/c/[slug]">) {
  const ctx = await storeContext(params);
  const { slug } = await params;
  const [categories, t] = await Promise.all([getCategories(ctx.store.id, ctx.locale, ctx.fallback), getTranslations("category")]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const parent = category.parentId ? categories.find((c) => c.id === category.parentId) : undefined;
  const children = categories.filter((c) => c.parentId === category.id);

  const breadcrumb = parent && (
    <nav className="flex items-center gap-1 text-sm">
      <Link href={`/c/${parent.slug}`} className="hover:underline">
        {parent.name}
      </Link>
      <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
      <span aria-current="page">{category.name}</span>
    </nav>
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-gutter pt-6 pb-16 md:pt-8 md:pb-24">
      {category.imageUrl ? (
        <header className="relative mb-6 overflow-hidden rounded-xl bg-muted text-white">
          <ProductImage src={category.imageUrl} alt="" className="aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1]" sizes="(min-width: 1280px) 1280px, 100vw" priority />
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 md:p-8">
            {breadcrumb && <div className="text-white/80">{breadcrumb}</div>}
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{category.name}</h1>
            {category.description && <p className="max-w-xl text-white/85">{category.description}</p>}
          </div>
        </header>
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {breadcrumb && <div className="text-muted-foreground [&_span]:text-foreground">{breadcrumb}</div>}
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{category.name}</h1>
          {category.description && <p className="max-w-xl text-muted-foreground">{category.description}</p>}
        </div>
      )}
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
