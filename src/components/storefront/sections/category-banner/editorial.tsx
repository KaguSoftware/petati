import { Link } from "@/i18n/navigation";
import type { CategoryBannerProps } from "../types";

export function CategoryBannerEditorial({ title, categories }: CategoryBannerProps) {
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl border-t border-foreground/15 px-gutter py-12 @tablet:py-16">
      <div className="mb-8 flex items-baseline gap-4">
        <span aria-hidden className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
          02
        </span>
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</h2>
      </div>
      <ul className="flex flex-col divide-y divide-foreground/15 border-y border-foreground/15 @tablet:flex-row @tablet:flex-wrap @tablet:divide-x @tablet:divide-y-0">
        {categories.map((c) => (
          <li key={c.id} className="@tablet:flex-1">
            <Link
              href={`/c/${c.slug}`}
              className="flex h-full items-center py-4 font-serif text-2xl font-medium tracking-tight transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none @tablet:justify-center @tablet:px-6 @tablet:py-6 @tablet:text-center @tablet:text-3xl @desktop:text-4xl"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
