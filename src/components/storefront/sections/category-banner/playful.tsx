import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { cn } from "@/lib/utils";
import type { CategoryBannerProps } from "../types";

const tiles = ["bg-primary/10", "bg-accent/20", "bg-muted"];

export function CategoryBannerPlayful({ title, categories }: CategoryBannerProps) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((c, i) => (
          <li key={c.id}>
            <Link
              href={`/c/${c.slug}`}
              className={cn(
                "group flex flex-col items-center gap-3 rounded-3xl p-4 ring-1 ring-foreground/5 transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10 focus-visible:scale-105 focus-visible:outline-none motion-reduce:transition-none",
                tiles[i % tiles.length],
              )}
            >
              <ProductImage src={c.imageUrl} alt={c.name} className="aspect-square w-full rounded-full ring-4 ring-background" sizes="20vw" />
              <span className="rounded-full bg-background px-3 py-1 text-center text-sm font-semibold shadow-sm">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
