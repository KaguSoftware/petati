import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ProductPageProps } from "../types";

export function ProductPageBold({ product, labels, purchasePanel, reviewsSection, wishlistSlot }: ProductPageProps) {
  const [main, ...rest] = product.images;
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 @tablet:py-12">
      <nav className="mb-6 text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {product.categories.map((c, i) => (
          <span key={c.slug}>
            {i > 0 && <span className="mx-2 text-foreground">/</span>}
            <Link href={`/c/${c.slug}`} className="decoration-2 underline-offset-4 hover:text-foreground hover:underline">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>
      <div className="grid gap-10 @tablet:grid-cols-2 @tablet:gap-14">
        <div className="flex flex-col gap-3">
          <div className="relative border-4 border-foreground">
            <ProductImage src={main?.url ?? null} alt={main?.alt ?? product.name} className="aspect-square" sizes="(min-width: 768px) 50vw, 100vw" priority />
            {wishlistSlot && <div className="absolute end-3 top-3">{wishlistSlot}</div>}
          </div>
          {rest.length > 0 && (
            <ul className="grid grid-cols-4 gap-3">
              {rest.map((img) => (
                <li key={img.url} className="border-2 border-foreground">
                  <ProductImage src={img.url} alt={img.alt} className="aspect-square" sizes="12vw" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            {product.brand && (
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
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
            {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size={18} />}
            {product.shortDescription && <p className="text-lg font-medium text-muted-foreground">{product.shortDescription}</p>}
          </div>
          <div className="border-4 border-foreground p-5 @tablet:p-6">{purchasePanel}</div>
          {product.description && (
            <section className="border-t-4 border-foreground pt-6">
              <h2 className="mb-3 text-sm font-extrabold tracking-widest uppercase">{labels.description}</h2>
              <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">{product.description}</div>
            </section>
          )}
        </div>
      </div>
      <section className="mt-16 border-t-4 border-foreground pt-10">{reviewsSection}</section>
    </main>
  );
}
