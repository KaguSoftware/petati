import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ProductPageProps } from "../types";

/** Wide stage: one wide photo across the top with the thumbnails beside it, then details in two columns inside a dark band. */
export function ProductPageBold({ product, labels, purchasePanel, reviewsSection, wishlistSlot }: ProductPageProps) {
  const [main, ...rest] = product.images;
  return (
    <main className="pb-8">
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <nav className="mb-4 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          {product.categories.map((c, i) => (
            <span key={c.slug}>
              {i > 0 && <span className="mx-2 text-foreground">/</span>}
              <Link href={`/c/${c.slug}`} className="decoration-2 underline-offset-4 hover:text-foreground hover:underline">
                {c.name}
              </Link>
            </span>
          ))}
        </nav>
        <div className="grid gap-3 @tablet:grid-cols-[1fr_auto]">
          <div className="relative border-4 border-foreground">
            <ProductImage src={main?.url ?? null} alt={main?.alt ?? product.name} className="aspect-[4/3] @tablet:aspect-[16/9]" sizes="(min-width: 1280px) 1280px, 100vw" priority />
            {wishlistSlot && <div className="absolute end-3 top-3">{wishlistSlot}</div>}
          </div>
          {rest.length > 0 && (
            <ul className="flex gap-3 overflow-x-auto contain-inline-size @tablet:w-28 @tablet:flex-col @tablet:overflow-visible @tablet:contain-none">
              {rest.map((img) => (
                <li key={img.url} className="w-24 shrink-0 border-2 border-foreground @tablet:w-full">
                  <ProductImage src={img.url} alt={img.alt} className="aspect-square" sizes="112px" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-8 bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 @tablet:grid-cols-2 @tablet:gap-14 @tablet:py-14">
          <div className="flex flex-col gap-4">
            {product.brand && (
              <p className="text-xs font-bold tracking-widest text-background/70 uppercase">
                {product.brandSlug ? (
                  <Link href={`/b/${product.brandSlug}`} className="hover:underline">
                    {product.brand}
                  </Link>
                ) : (
                  product.brand
                )}
              </p>
            )}
            <h1 className="text-4xl leading-[0.95] font-extrabold tracking-tight text-balance uppercase @tablet:text-6xl">{product.name}</h1>
            {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size={18} className="[&_span:last-child]:text-background/70" />}
            {product.shortDescription && <p className="text-lg font-medium text-background/80">{product.shortDescription}</p>}
          </div>
          <div className="border-4 border-background bg-background p-5 text-foreground @tablet:p-6">{purchasePanel}</div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4">
        {product.description && (
          <section className="mx-auto max-w-3xl py-12">
            <h2 className="mb-3 text-sm font-extrabold tracking-widest uppercase">{labels.description}</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">{product.description}</div>
          </section>
        )}
        <section className="border-t-4 border-foreground pt-10">{reviewsSection}</section>
      </div>
    </main>
  );
}
