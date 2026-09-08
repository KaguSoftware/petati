import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import type { CategoryBannerProps } from "../types";

/** Large photo tiles, three across on desktop, with the name over a bottom scrim. */
export function CategoryBannerMinimal({ title, categories }: CategoryBannerProps) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-gutter py-12 @desktop:py-16">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight @tablet:text-3xl">{title}</h2>
      <ul className="grid grid-cols-1 gap-4 @phablet:grid-cols-2 @desktop:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/c/${c.slug}`}
              className="group relative block overflow-hidden rounded-xl bg-muted text-white outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
            >
              <ProductImage
                src={c.imageUrl}
                alt=""
                className="aspect-[4/3] transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none @desktop:aspect-[3/2]"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/85 via-black/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 [text-shadow:0_1px_2px_rgb(0_0_0/.45)] @tablet:p-5">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xl font-semibold @tablet:text-2xl">{c.name}</span>
                  {c.description && <span className="line-clamp-2 text-sm text-white/80">{c.description}</span>}
                </div>
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-white group-hover:text-foreground">
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
