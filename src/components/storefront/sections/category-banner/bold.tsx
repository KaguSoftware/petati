import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import { cn } from "@/lib/utils";
import type { CategoryBannerProps } from "../types";

export function CategoryBannerBold({ title, categories }: CategoryBannerProps) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <h2 className="mb-6 text-3xl font-extrabold tracking-tight uppercase md:text-5xl">{title}</h2>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <li key={c.id}>
            <Link
              href={`/c/${c.slug}`}
              className={cn(
                "group relative flex aspect-[4/3] items-end overflow-hidden rounded-none p-4 outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
                i % 2 === 0 ? "bg-foreground text-background" : "bg-primary text-primary-foreground",
              )}
            >
              {c.imageUrl && (
                <ProductImage
                  src={c.imageUrl}
                  alt=""
                  className="absolute inset-0 opacity-40 transition duration-500 group-hover:scale-105 group-hover:opacity-60 motion-reduce:transition-none"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                />
              )}
              <span className="relative line-clamp-2 text-2xl leading-none font-extrabold tracking-tight uppercase md:text-3xl">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
