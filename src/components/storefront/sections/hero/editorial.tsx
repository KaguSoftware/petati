import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { HeroProps } from "../types";

export function HeroEditorial({ title, subtitle, ctaLabel, ctaHref, imageUrl }: HeroProps) {
  return (
    <section className="mx-auto grid max-w-7xl items-end gap-10 px-4 py-16 md:grid-cols-12 md:gap-12 md:py-24">
      <div className="flex flex-col gap-6 md:col-span-5">
        <span aria-hidden className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
          01
        </span>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-balance md:text-5xl lg:text-6xl">{title}</h1>
        <p className="max-w-prose font-serif text-lg italic text-muted-foreground md:text-xl">{subtitle}</p>
        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-2 self-start border-b border-foreground pb-1 text-xs uppercase tracking-[0.2em] transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:text-primary"
        >
          {ctaLabel}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>
      </div>
      <figure className="flex flex-col gap-3 md:col-span-7">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" priority />}
        </div>
        <figcaption aria-hidden className="flex items-center justify-between border-t border-foreground/15 pt-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
          <span>01</span>
          <span>—</span>
        </figcaption>
      </figure>
    </section>
  );
}
