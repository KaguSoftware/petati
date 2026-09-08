import type { NewsletterProps } from "../types";

export function NewsletterEditorial({ title, subtitle, formSlot }: NewsletterProps) {
  return (
    <section className="border-y border-foreground/15 bg-background">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-16 text-center @tablet:py-20">
        <h2 className="font-serif text-3xl font-medium tracking-tight @tablet:text-4xl">{title}</h2>
        <p className="font-serif text-lg italic text-muted-foreground">{subtitle}</p>
        <div className="w-full">{formSlot}</div>
      </div>
    </section>
  );
}
