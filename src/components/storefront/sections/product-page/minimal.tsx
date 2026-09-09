import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/storefront/shared/page-shell";
import { ProductGallery } from "@/components/storefront/shared/product-gallery";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ProductPageProps } from "../types";

/** Gallery + panel: a square photo with a thumbnail strip, the buy panel sticky beside it, reviews below. */
export function ProductPageMinimal({ product, labels, purchasePanel, reviewsSection, wishlistSlot }: ProductPageProps) {
  return (
    <PageShell>
      {product.categories.length > 0 && (
        <nav className="-mb-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {product.categories.map((c, i) => (
            <span key={c.slug} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight aria-hidden className="size-3.5 rtl:-scale-x-100" />}
              <Link href={`/c/${c.slug}`} className="transition-colors hover:text-primary">
                {c.name}
              </Link>
            </span>
          ))}
        </nav>
      )}
      <div className="grid gap-8 @tablet:grid-cols-2 @tablet:gap-10 @desktop:grid-cols-[1.1fr_1fr] @desktop:gap-14">
        <ProductGallery
          images={product.images}
          fallbackAlt={product.name}
          labels={{ previous: labels.previousImage, next: labels.nextImage, imageOf: labels.imageOf }}
          stageClassName="aspect-square rounded-2xl"
          sizes="(min-width: 768px) 50vw, 100vw"
          thumbs="row"
          thumbClassName="rounded-lg"
          overlay={wishlistSlot && <div className="absolute end-3 top-3 z-10">{wishlistSlot}</div>}
        />
        <div className="flex flex-col gap-6 self-start @desktop:sticky @desktop:top-24">
          <div className="flex flex-col gap-2.5">
            {product.brand && (
              <p className="text-sm font-medium text-primary">
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
          <div className="rounded-2xl bg-muted/60 p-5 @tablet:p-6">{purchasePanel}</div>
          {product.description && (
            <section className="flex flex-col gap-2 border-t pt-6">
              <h2 className="font-semibold">{labels.description}</h2>
              <div className="bidi-auto prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">{product.description}</div>
            </section>
          )}
        </div>
      </div>
      <section className="mt-6 border-t pt-10 @desktop:mt-10">{reviewsSection}</section>
    </PageShell>
  );
}
