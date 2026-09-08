import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { cn } from "@/lib/utils";
import type { CategoryBannerProps } from "../types";

const tiles = ["bg-primary/10", "bg-accent/20", "bg-muted"];

/** A single row of round photos that scrolls sideways (snap), each on a tinted tile. */
export function CategoryBannerPlayful({ title, categories }: CategoryBannerProps) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 @tablet:py-14">
      <h2 className="mb-5 text-2xl font-bold tracking-tight @tablet:text-3xl">{title}</h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pt-2 pb-5 contain-inline-size [scrollbar-width:thin]">
        {categories.map((c, i) => (
          <li key={c.id} className="w-36 shrink-0 snap-start @tablet:w-44 @desktop:w-48">
            <Link
              href={`/c/${c.slug}`}
              className={cn(
                "group flex flex-col items-center gap-3 rounded-3xl p-4 ring-1 ring-foreground/5 transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10 focus-visible:scale-105 focus-visible:outline-none motion-reduce:transition-none",
                tiles[i % tiles.length],
              )}
            >
              <ProductImage src={c.imageUrl} alt={c.name} className="aspect-square w-full rounded-full ring-4 ring-background" sizes="12rem" />
              <span className="max-w-full truncate rounded-full bg-background px-3 py-1 text-center text-sm font-semibold shadow-sm">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
