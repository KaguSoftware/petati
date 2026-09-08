import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import { formatMoney } from "@/lib/money";
import type { ProductCardProps } from "../types";

/** Horizontal card: square photo on one side, details and a pill price on the other. */
export function ProductCardPlayful({ product, currency, locale, labels, wishlistSlot }: ProductCardProps) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  return (
    <article className="group relative flex gap-3 rounded-3xl bg-background p-3 shadow-lg shadow-primary/10 ring-1 ring-foreground/5 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none">
      <Link href={`/p/${product.slug}`} className="relative block w-2/5 shrink-0 overflow-hidden rounded-2xl">
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt}
          className="aspect-square rounded-2xl transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          sizes="(min-width: 1024px) 14vw, (min-width: 640px) 20vw, 40vw"
        />
        {product.isNew && (
          <span className="absolute start-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground shadow-sm">{labels.new}</span>
        )}
        {!product.inStock && (
          <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-foreground/80 py-0.5 text-center text-[10px] font-semibold text-background">{labels.outOfStock}</span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-1 pe-6">
        {product.brand && <p className="truncate text-xs font-medium text-muted-foreground">{product.brand}</p>}
        <Link href={`/p/${product.slug}`} className="line-clamp-2 text-sm leading-snug font-semibold hover:underline @tablet:text-base">
          {product.name}
        </Link>
        {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} />}
        <p className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground tabular-nums">{formatMoney(product.price, currency, locale)}</span>
          {onSale && product.compareAtPrice !== null && <s className="text-xs text-muted-foreground tabular-nums">{formatMoney(product.compareAtPrice, currency, locale)}</s>}
        </p>
      </div>
      {wishlistSlot && <div className="absolute end-3 top-3">{wishlistSlot}</div>}
    </article>
  );
}
