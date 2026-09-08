import type { NewsletterProps } from "../types";

export function NewsletterPlayful({ title, subtitle, formSlot }: NewsletterProps) {
  return (
    <section className="mx-auto max-w-7xl px-gutter py-10">
      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <div aria-hidden className="pointer-events-none absolute -start-20 -top-20 size-64 rounded-full bg-accent/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -end-24 -bottom-24 size-80 rounded-full bg-primary-foreground/15 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 px-6 py-12 text-center @tablet:py-14">
          <h2 className="text-3xl font-bold tracking-tight @tablet:text-5xl">{title}</h2>
          <p className="max-w-md text-lg text-primary-foreground/80">{subtitle}</p>
          <div className="mt-1 w-full max-w-md rounded-full bg-background p-1.5 text-foreground shadow-lg shadow-black/10 [&_button]:rounded-full [&_input]:border-transparent [&_input]:bg-transparent">
            {formSlot}
          </div>
        </div>
      </div>
    </section>
  );
}
