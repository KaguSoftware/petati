import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { HeroProps } from "../types";

export function HeroMinimal({ title, subtitle, ctaLabel, ctaHref, imageUrl }: HeroProps) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
      <div className="flex flex-col gap-5">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="max-w-prose text-lg text-muted-foreground">{subtitle}</p>
        <Link href={ctaHref} className={buttonVariants({ size: "lg", className: "self-start" })}>
          {ctaLabel}
        </Link>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {imageUrl && <Image src={imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority />}
      </div>
    </section>
  );
}
