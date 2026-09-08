import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { HeroProps } from "../types";

/** Magazine opener: a very large headline first, then one wide photograph underneath. */
export function HeroEditorial({ title, subtitle, ctaLabel, ctaHref, imageUrl }: HeroProps) {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 @tablet:gap-12 @tablet:py-20">
      <div className="grid gap-6 @tablet:grid-cols-12 @tablet:items-end">
        <div className="flex flex-col gap-5 @tablet:col-span-8">
          <span aria-hidden className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
            01
          </span>
          <h1 className="font-serif text-5xl leading-[0.95] font-medium tracking-tight text-balance @tablet:text-7xl @desktop:text-8xl">{title}</h1>
        </div>
        <div className="flex flex-col gap-5 @tablet:col-span-4 @tablet:pb-2">
          <p className="max-w-prose font-serif text-lg italic text-muted-foreground @tablet:text-xl">{subtitle}</p>
          <Link
            href={ctaHref}
            className="group inline-flex items-center gap-2 self-start border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em] transition-colors hover:border-primary hover:text-primary focus-visible:text-primary focus-visible:outline-none"
          >
            {ctaLabel}
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </div>
      <figure className="flex flex-col gap-3">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted @tablet:aspect-[21/9]">
          {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover" priority />}
        </div>
        <figcaption aria-hidden className="flex items-center justify-between border-t border-foreground/15 pt-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
          <span>01</span>
          <span>—</span>
        </figcaption>
      </figure>
    </section>
  );
}
