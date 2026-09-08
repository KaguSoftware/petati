import { Link } from "@/i18n/navigation";
import { Price } from "@/components/storefront/shared/price";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import type { ProductCardProps } from "../types";

/** The photo is the whole card; name, brand and price sit on a scrim along the bottom edge. */
export function ProductCardMinimal({ product, currency, locale, labels, wishlistSlot }: ProductCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-xl bg-muted text-white">
      <Link href={`/p/${product.slug}`} className="block outline-none focus-visible:ring-4 focus-visible:ring-ring/50">
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt}
          className="aspect-[4/5] transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/80 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 @tablet:p-5">
          {product.brand && <p className="truncate text-[11px] font-medium tracking-wide text-white/75 uppercase">{product.brand}</p>}
          <h3 className="line-clamp-2 text-lg leading-snug font-semibold text-balance @tablet:text-xl">{product.name}</h3>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <Price amount={product.price} compareAt={product.compareAtPrice} currency={currency} locale={locale} className="text-base [&>span]:text-white [&_s]:text-white/60" />
            {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} className="[&_span:last-child]:text-white/70" />}
          </div>
        </div>
        <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNew && <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">{labels.new}</span>}
          {!product.inStock && <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-medium text-white">{labels.outOfStock}</span>}
        </div>
      </Link>
      {wishlistSlot && <div className="absolute end-3 top-3">{wishlistSlot}</div>}
    </article>
  );
}
