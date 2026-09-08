import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import { cn } from "@/lib/utils";
import type { ProductPageProps } from "../types";

export function ProductPagePlayful({ product, labels, purchasePanel, reviewsSection, wishlistSlot }: ProductPageProps) {
  const [main, ...rest] = product.images;
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        {product.categories.map((c) => (
          <Link key={c.slug} href={`/c/${c.slug}`} className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground transition-colors hover:bg-accent/20 hover:text-accent-foreground">
            {c.name}
          </Link>
        ))}
      </nav>
      <div className="grid gap-10 @tablet:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl shadow-lg shadow-primary/10 ring-1 ring-foreground/5">
            <ProductImage src={main?.url ?? null} alt={main?.alt ?? product.name} className="aspect-square" sizes="(min-width: 768px) 50vw, 100vw" priority />
            {wishlistSlot && <div className="absolute end-4 top-4">{wishlistSlot}</div>}
          </div>
          {rest.length > 0 && (
            <ul className="grid grid-cols-4 gap-3">
              {rest.map((img) => (
                <li key={img.url}>
                  <ProductImage src={img.url} alt={img.alt} className="aspect-square rounded-2xl ring-1 ring-foreground/5" sizes="12vw" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <p className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {product.brandSlug ? (
                    <Link href={`/b/${product.brandSlug}`} className="hover:underline">
                      {product.brand}
                    </Link>
                  ) : (
                    product.brand
                  )}
                </p>
              )}
              <p
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  product.inStock ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {product.inStock ? labels.inStock : labels.outOfStock}
              </p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight @tablet:text-4xl">{product.name}</h1>
            {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size={16} />}
            {product.shortDescription && <p className="text-lg text-muted-foreground">{product.shortDescription}</p>}
          </div>
          <div className="rounded-3xl bg-muted p-6 ring-1 ring-foreground/5">{purchasePanel}</div>
          {product.description && (
            <section className="rounded-3xl bg-background p-6 ring-1 ring-foreground/5">
              <h2 className="mb-2 text-lg font-bold">{labels.description}</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">{product.description}</div>
            </section>
          )}
        </div>
      </div>
      <section className="mt-14 rounded-3xl bg-muted/40 p-6 ring-1 ring-foreground/5 @tablet:p-8">{reviewsSection}</section>
    </main>
  );
}
