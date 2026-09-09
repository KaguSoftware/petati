import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import type { CategoryBannerProps } from "../types";

/** Compact tiles: a scroll rail of square photos with the name below on phones, one row of six on desktop. */
export function CategoryBannerMinimal({ title, categories }: CategoryBannerProps) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-gutter py-10 @desktop:py-14">
      <h2 className="bidi-auto mb-5 text-2xl font-semibold tracking-tight @tablet:text-3xl @desktop:mb-8">{title}</h2>
      <ul className="bleed-gutter flex snap-x gap-3 overflow-x-auto pb-2 contain-inline-size [scrollbar-width:none] @tablet:grid @tablet:grid-cols-3 @tablet:gap-5 @tablet:overflow-visible @tablet:pb-0 @tablet:contain-none @desktop:grid-cols-6">
        {categories.map((c) => (
          <li key={c.id} className="w-32 shrink-0 snap-start @tablet:w-auto">
            <Link href={`/c/${c.slug}`} className="group flex flex-col gap-2.5 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-ring/50">
              <ProductImage
                src={c.imageUrl}
                alt=""
                className="aspect-square rounded-xl bg-muted transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
                sizes="(min-width: 1024px) 200px, (min-width: 768px) 33vw, 128px"
              />
              <span className="bidi-auto line-clamp-2 text-center text-sm leading-snug font-medium transition-colors group-hover:text-primary @tablet:text-base">
                {c.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
