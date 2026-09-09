import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { HeroCarousel } from "@/components/storefront/shared/hero-carousel";
import { cn } from "@/lib/utils";
import type { HeroProps, HeroSlideProps } from "../types";

/** Colour block: text on the brand band with a framed photo beside it; slides cross-fade inside the band. */
export function HeroBold({ slides, labels, autoplay }: HeroProps) {
  return (
    <section className="bg-primary text-primary-foreground">
      <HeroCarousel
        slides={slides.map((s, i) => (
          <Slide key={i} {...s} first={i === 0} />
        ))}
        labels={labels}
        autoplay={autoplay}
        tone="brand"
        controls="bar"
        barClassName="bottom-5"
      />
    </section>
  );
}

function Slide({ title, subtitle, ctaLabel, ctaHref, imageUrl, first }: HeroSlideProps & { first: boolean }) {
  const Heading = first ? "h1" : "p";
  return (
    <div className="mx-auto grid max-w-7xl items-center gap-10 px-gutter pt-16 pb-20 @tablet:grid-cols-[1.1fr_1fr] @tablet:gap-14 @tablet:pt-24 @tablet:pb-28">
      <div className="flex flex-col gap-6">
        {title && <Heading className="bidi-auto text-5xl leading-[0.95] font-extrabold tracking-tight text-balance uppercase @tablet:text-7xl">{title}</Heading>}
        {subtitle && <p className="bidi-auto max-w-prose text-lg font-medium text-primary-foreground/80 @tablet:text-xl">{subtitle}</p>}
        <Link
          href={ctaHref}
          className={cn(
            buttonVariants({ size: "xl" }),
            "h-14 self-start rounded-none bg-accent px-8 text-base font-extrabold tracking-wide text-accent-foreground uppercase hover:bg-accent/90",
          )}
        >
          {ctaLabel}
        </Link>
      </div>
      <div className="relative me-2 mb-2 aspect-[4/3] overflow-hidden rounded-none border-4 border-background bg-muted shadow-[8px_8px_0_0_var(--color-accent)] rtl:shadow-[-8px_8px_0_0_var(--color-accent)]">
        {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority={first} />}
      </div>
    </div>
  );
}
