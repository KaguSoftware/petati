import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ProductPageProps } from "../types";

export function ProductPageMinimal({ product, labels, purchasePanel, reviewsSection, wishlistSlot }: ProductPageProps) {
  const [main, ...rest] = product.images;
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        {product.categories.map((c, i) => (
          <span key={c.slug}>
            {i > 0 && " · "}
            <Link href={`/c/${c.slug}`} className="hover:underline">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <ProductImage src={main?.url ?? null} alt={main?.alt ?? product.name} className="aspect-square rounded-lg" sizes="(min-width: 768px) 50vw, 100vw" priority />
            {wishlistSlot && <div className="absolute end-3 top-3">{wishlistSlot}</div>}
          </div>
          {rest.length > 0 && (
            <ul className="grid grid-cols-4 gap-3">
              {rest.map((img) => (
                <li key={img.url}>
                  <ProductImage src={img.url} alt={img.alt} className="aspect-square rounded-md" sizes="12vw" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-6">
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
            <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
            {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size={16} />}
            {product.shortDescription && <p className="text-muted-foreground">{product.shortDescription}</p>}
          </div>
          {purchasePanel}
          {product.description && (
            <section className="border-t pt-6">
              <h2 className="mb-2 font-medium">{labels.description}</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">{product.description}</div>
            </section>
          )}
        </div>
      </div>
      <section className="mt-14 border-t pt-8">{reviewsSection}</section>
    </main>
  );
}
