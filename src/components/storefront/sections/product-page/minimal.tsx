import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ProductPageProps } from "../types";

/** Gallery + panel: a big rounded photo with a thumbnail strip, the buy panel sticky beside it. */
export function ProductPageMinimal({ product, labels, purchasePanel, reviewsSection, wishlistSlot }: ProductPageProps) {
  const [main, ...rest] = product.images;
  return (
    <main className="mx-auto max-w-7xl px-gutter py-8 @desktop:py-12">
      <nav className="mb-5 text-sm text-muted-foreground">
        {product.categories.map((c, i) => (
          <span key={c.slug}>
            {i > 0 && " · "}
            <Link href={`/c/${c.slug}`} className="hover:underline">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>
      <div className="grid gap-10 @tablet:grid-cols-[1.15fr_1fr] @desktop:gap-14">
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-xl">
            <ProductImage src={main?.url ?? null} alt={main?.alt ?? product.name} className="aspect-square @tablet:aspect-[4/5]" sizes="(min-width: 768px) 55vw, 100vw" priority />
            {wishlistSlot && <div className="absolute end-3 top-3">{wishlistSlot}</div>}
          </div>
          {rest.length > 0 && (
            <ul className="flex gap-3 overflow-x-auto pb-1 contain-inline-size">
              {rest.map((img) => (
                <li key={img.url} className="w-20 shrink-0 @tablet:w-24">
                  <ProductImage src={img.url} alt={img.alt} className="aspect-square rounded-lg" sizes="96px" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-6 self-start @desktop:sticky @desktop:top-24">
          <div className="flex flex-col gap-2">
            {product.brand && (
              <p className="text-sm uppercase tracking-wide text-muted-foreground">
                {product.brandSlug ? (
                  <Link href={`/b/${product.brandSlug}`} className="hover:underline">
                    {product.brand}
                  </Link>
                ) : (
                  product.brand
                )}
              </p>
            )}
            <h1 className="bidi-auto text-3xl font-semibold tracking-tight text-balance @tablet:text-4xl">{product.name}</h1>
            {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size={16} />}
            {product.shortDescription && <p className="bidi-auto text-muted-foreground">{product.shortDescription}</p>}
          </div>
          <div className="rounded-xl border p-5 @tablet:p-6">{purchasePanel}</div>
          {product.description && (
            <section className="border-t pt-6">
              <h2 className="mb-2 font-medium">{labels.description}</h2>
              <div className="bidi-auto prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">{product.description}</div>
            </section>
          )}
        </div>
      </div>
      <section className="mt-14 border-t pt-8">{reviewsSection}</section>
    </main>
  );
}
