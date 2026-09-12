import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";
import { getCategories } from "@/lib/catalog/queries";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/storefront/shared/page-shell";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { Results } from "../../shop/page";
import { ResultsSkeleton } from "@/components/storefront/shared/skeletons";

const chip =
  "inline-flex h-10 items-center rounded-full bg-muted px-4 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none";

/**
 * Category listing. Categories form a tree: a parent page lists every product in its subtree
 * (see getProducts) and offers the children as chips; a child page links back to its parent.
 * With a category photo the header is a wide banner with the name laid over it; without one it
 * is the standard page heading.
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

  const chips = children.length > 0 && (
    <nav aria-label={t("subcategories")} className="flex flex-wrap gap-2">
      {children.map((c) => (
        <Link key={c.id} href={`/c/${c.slug}`} className={chip}>
          {c.name}
        </Link>
      ))}
    </nav>
  );

  if (category.imageUrl) {
    return (
      <PageShell>
        <header className="relative overflow-hidden rounded-2xl bg-muted text-white">
          <ProductImage src={category.imageUrl} alt="" className="aspect-[16/9] @tablet:aspect-[21/9] @desktop:aspect-[3/1]" sizes="(min-width: 1280px) 1280px, 100vw" priority />
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 @tablet:p-8">
            {breadcrumb && <div className="text-white/80">{breadcrumb}</div>}
            <h1 className="bidi-auto text-3xl font-semibold tracking-tight @tablet:text-5xl">{category.name}</h1>
            {category.description && <p className="bidi-auto max-w-xl text-white/85">{category.description}</p>}
          </div>
        </header>
        {chips}
        <Suspense fallback={<ResultsSkeleton />}>
          <Results ctx={ctx} searchParams={searchParams} categorySlug={slug} />
        </Suspense>
      </PageShell>
    );
  }

  return (
    <PageShell title={category.name} description={category.description}>
      {breadcrumb && <div className="-mt-3 text-muted-foreground [&_span]:text-foreground">{breadcrumb}</div>}
      {chips}
      <Suspense fallback={<ResultsSkeleton />}>
        <Results ctx={ctx} searchParams={searchParams} categorySlug={slug} />
      </Suspense>
    </PageShell>
  );
}
