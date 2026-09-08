import type { NewsletterProps } from "../types";

/** A soft band with centred copy and the form. */
export function NewsletterMinimal({ title, subtitle, formSlot }: NewsletterProps) {
  return (
    <section className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-gutter py-14 text-center @desktop:py-20">
        <h2 className="text-2xl font-semibold tracking-tight @tablet:text-3xl">{title}</h2>
        <p className="max-w-md text-muted-foreground">{subtitle}</p>
        <div className="mt-2 w-full max-w-md">{formSlot}</div>
      </div>
    </section>
  );
}
