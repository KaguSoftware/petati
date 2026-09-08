import Image from "next/image";
import { PawPrint } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroProps } from "../types";

/** Full-bleed photo with the copy laid over a bottom scrim; a brand gradient stands in when there is no photo. */
export function HeroMinimal({ title, subtitle, ctaLabel, ctaHref, imageUrl }: HeroProps) {
  return (
    <section data-hero-overlay className="relative isolate overflow-hidden bg-foreground text-white" style={{ marginTop: "calc(var(--hero-pull, 0px) * -1)" }}>
      <div className="relative aspect-[4/5] max-h-[46rem] w-full @tablet:aspect-[16/7]">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="100vw" priority className="object-cover" />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))]">
            <PawPrint className="absolute -end-10 -top-10 size-64 rotate-12 opacity-15" />
            <PawPrint className="absolute start-1/3 top-1/4 size-24 -rotate-12 opacity-10" />
            <PawPrint className="absolute -bottom-8 end-1/4 size-40 rotate-45 opacity-10" />
          </div>
        )}
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-gutter pb-10 @tablet:gap-5 @tablet:pb-16 @desktop:pb-20">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance [text-shadow:0_2px_12px_rgb(0_0_0/.35)] @tablet:text-6xl">{title}</h1>
            <p className="max-w-xl text-base text-white/90 [text-shadow:0_1px_6px_rgb(0_0_0/.4)] @tablet:text-lg">{subtitle}</p>
            <Link href={ctaHref} className={cn(buttonVariants({ size: "xl" }), "bg-white text-foreground hover:bg-white/90")}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
