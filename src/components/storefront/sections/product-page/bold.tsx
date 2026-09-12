import { Link } from "@/i18n/navigation";
import { ProductGallery } from "@/components/storefront/shared/product-gallery";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ProductPageProps } from "../types";

/** Wide stage: one wide photo across the top with the thumbnails beside it, then details in two columns inside a dark band. */
export function ProductPageBold({ product, labels, purchasePanel, reviewsSection, wishlistSlot }: ProductPageProps) {
  return (
    <main className="pb-8">
      <div className="mx-auto max-w-7xl px-gutter pt-6">
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
        <ProductGallery
          images={product.images}
          fallbackAlt={product.name}
          labels={{ previous: labels.previousImage, next: labels.nextImage, imageOf: labels.imageOf }}
          stageClassName="aspect-[4/3] border-4 border-foreground @tablet:aspect-[16/9]"
          sizes="(min-width: 1280px) 1280px, 100vw"
          thumbs="side"
          thumbClassName="border-2 border-foreground"
          activeThumbClassName="ring-2 ring-accent ring-offset-2 ring-offset-background"
          overlay={wishlistSlot && <div className="absolute end-3 top-3 z-10">{wishlistSlot}</div>}
        />
      </div>
      <div className="mt-8 bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-gutter py-10 @desktop:grid-cols-2 @desktop:gap-14 @tablet:py-14">
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
            <h1 className="bidi-auto text-4xl leading-none font-extrabold tracking-tight text-balance uppercase break-words @tablet:text-5xl @desktop:text-6xl">{product.name}</h1>
            {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} size={18} className="[&_span:last-child]:text-background/70" />}
            {product.shortDescription && <p className="bidi-auto text-lg font-medium text-background/80">{product.shortDescription}</p>}
          </div>
          <div className="border-4 border-background bg-background p-5 text-foreground @tablet:p-6">{purchasePanel}</div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-gutter">
        {product.description && (
          <section className="mx-auto max-w-3xl py-12">
            <h2 className="mb-3 text-sm font-extrabold tracking-widest uppercase">{labels.description}</h2>
            <div className="bidi-auto rich-text max-w-none whitespace-pre-line text-muted-foreground">{product.description}</div>
          </section>
        )}
        <section className="border-t-4 border-foreground pt-10">{reviewsSection}</section>
      </div>
    </main>
  );
}
