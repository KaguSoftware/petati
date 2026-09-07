import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/storefront/shared/product-image";
import type { CategoryBannerProps } from "../types";

export function CategoryBannerMinimal({ title, categories }: CategoryBannerProps) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">{title}</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/c/${c.slug}`} className="group flex flex-col gap-2">
              <ProductImage src={c.imageUrl} alt={c.name} className="aspect-square rounded-lg" sizes="20vw" />
              <span className="text-sm font-medium group-hover:underline">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
