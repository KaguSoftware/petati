import { Link } from "@/i18n/navigation";
import { Price } from "@/components/storefront/shared/price";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { RatingStars } from "@/components/storefront/shared/rating-stars";
import { cn } from "@/lib/utils";
import type { ProductCardProps } from "../types";

export function ProductCardEditorial({ product, currency, locale, labels, wishlistSlot }: ProductCardProps) {
  const eyebrow = product.isNew ? labels.new : !product.inStock ? labels.outOfStock : null;
  return (
    <article className="group relative flex flex-col gap-3">
      <Link href={`/p/${product.slug}`} className="block">
        <ProductImage
          src={product.imageUrl}
          alt={product.imageAlt}
          className={cn("aspect-[4/5] rounded-none transition-opacity group-hover:opacity-90", !product.inStock && "opacity-60")}
        />
      </Link>
      {wishlistSlot && <div className="absolute end-2 top-2">{wishlistSlot}</div>}
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <p className={cn("text-[10px] uppercase tracking-[0.2em]", product.inStock ? "text-primary" : "text-muted-foreground")}>{eyebrow}</p>
        )}
        {product.brand && <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{product.brand}</p>}
        <Link href={`/p/${product.slug}`} className="line-clamp-2 font-serif text-base font-medium leading-snug transition-colors hover:text-primary md:text-lg">
          {product.name}
        </Link>
        {product.ratingCount > 0 && <RatingStars value={product.ratingAvg} count={product.ratingCount} className="opacity-70" />}
        <Price
          amount={product.price}
          compareAt={product.compareAtPrice}
          currency={currency}
          locale={locale}
          className="text-xs uppercase tracking-[0.15em] text-muted-foreground [&>span]:font-normal"
        />
      </div>
    </article>
  );
}
