import Image from "next/image";
import { PawPrint } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { HeroProps } from "../types";

export function HeroPlayful({ title, subtitle, ctaLabel, ctaHref, imageUrl }: HeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-gutter py-8 @tablet:py-12">
      <div className="relative overflow-hidden rounded-3xl bg-muted ring-1 ring-foreground/5">
        <div aria-hidden className="pointer-events-none absolute -start-24 -top-24 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -end-16 -bottom-32 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative grid items-center gap-10 px-6 py-12 @tablet:grid-cols-2 @tablet:px-12 @tablet:py-20">
          <div className="flex flex-col items-start gap-6">
            <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent/20 text-accent-foreground">
              <PawPrint className="size-6" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight @tablet:text-5xl">{title}</h1>
            <p className="max-w-prose text-lg text-muted-foreground">{subtitle}</p>
            <Link href={ctaHref} className={buttonVariants({ size: "xl", className: "rounded-full shadow-lg shadow-primary/20" })}>
              <PawPrint data-icon="inline-start" />
              {ctaLabel}
            </Link>
          </div>
          <div className="relative aspect-[4/3] rotate-2 overflow-hidden rounded-3xl bg-background shadow-lg shadow-primary/10 ring-1 ring-foreground/5 transition-transform duration-300 hover:rotate-0 motion-reduce:transition-none rtl:-rotate-2 rtl:hover:rotate-0">
            {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority />}
          </div>
        </div>
      </div>
    </section>
  );
}
