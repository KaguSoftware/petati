import type { NewsletterProps } from "../types";

export function NewsletterMinimal({ title, subtitle, formSlot }: NewsletterProps) {
  return (
    <section className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-14 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-md text-muted-foreground">{subtitle}</p>
        {formSlot}
      </div>
    </section>
  );
}
