import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroProps } from "../types";

export function HeroBold({ title, subtitle, ctaLabel, ctaHref, imageUrl }: HeroProps) {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 @tablet:grid-cols-[1.1fr_1fr] @tablet:gap-14 @tablet:py-24">
        <div className="flex flex-col gap-6">
          <h1 className="text-5xl leading-[0.95] font-extrabold tracking-tight text-balance uppercase @tablet:text-7xl">{title}</h1>
          <p className="max-w-prose text-lg font-medium text-primary-foreground/80 @tablet:text-xl">{subtitle}</p>
          <Link
            href={ctaHref}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-14 self-start rounded-none bg-accent px-8 text-base font-extrabold tracking-wide text-accent-foreground uppercase hover:bg-accent/90",
            )}
          >
            {ctaLabel}
          </Link>
        </div>
        <div className="relative me-2 mb-2 aspect-[4/3] overflow-hidden rounded-none border-4 border-background bg-muted shadow-[8px_8px_0_0_var(--color-accent)] rtl:shadow-[-8px_8px_0_0_var(--color-accent)]">
          {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority />}
        </div>
      </div>
    </section>
  );
}
