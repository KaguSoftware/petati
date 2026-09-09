import Image from "next/image";
import { PawPrint } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { HeroCarousel } from "@/components/storefront/shared/hero-carousel";
import type { HeroProps, HeroSlideProps } from "../types";

/** Rounded card with soft colour blobs and a tilted photo; slides cross-fade inside the card. */
export function HeroPlayful({ slides, labels, autoplay }: HeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-gutter py-8 @tablet:py-12">
      <div className="relative overflow-hidden rounded-3xl bg-muted ring-1 ring-foreground/5">
        <div aria-hidden className="pointer-events-none absolute -start-24 -top-24 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -end-16 -bottom-32 size-96 rounded-full bg-primary/15 blur-3xl" />
        <HeroCarousel
          slides={slides.map((s, i) => (
            <Slide key={i} {...s} first={i === 0} />
          ))}
          labels={labels}
          autoplay={autoplay}
          tone="page"
          controls="bar"
          barClassName="bottom-5"
          className="rounded-3xl"
        />
      </div>
    </section>
  );
}

function Slide({ title, subtitle, ctaLabel, ctaHref, imageUrl, first }: HeroSlideProps & { first: boolean }) {
  const Heading = first ? "h1" : "p";
  return (
    <div className="relative grid items-center gap-10 px-6 pt-12 pb-20 @tablet:grid-cols-2 @tablet:px-12 @tablet:pt-20 @tablet:pb-24">
      <div className="flex flex-col items-start gap-6">
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent/20 text-accent-foreground">
          <PawPrint className="size-6" />
        </span>
        {title && <Heading className="bidi-auto text-3xl font-bold tracking-tight @tablet:text-5xl">{title}</Heading>}
        {subtitle && <p className="bidi-auto max-w-prose text-lg text-muted-foreground">{subtitle}</p>}
        <Link href={ctaHref} className={buttonVariants({ size: "xl", className: "rounded-full shadow-lg shadow-primary/20" })}>
          <PawPrint data-icon="inline-start" />
          {ctaLabel}
        </Link>
      </div>
      <div className="relative aspect-[4/3] rotate-2 overflow-hidden rounded-3xl bg-background shadow-lg shadow-primary/10 ring-1 ring-foreground/5 transition-transform duration-300 hover:rotate-0 motion-reduce:transition-none rtl:-rotate-2 rtl:hover:rotate-0">
        {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority={first} />}
      </div>
    </div>
  );
}
