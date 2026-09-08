import type { NewsletterProps } from "../types";

export function NewsletterBold({ title, subtitle, formSlot }: NewsletterProps) {
  return (
    <section className="border-t-4 border-foreground bg-accent text-accent-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl leading-[0.95] font-extrabold tracking-tight text-balance uppercase md:text-6xl">{title}</h2>
          <p className="max-w-md text-lg font-medium text-accent-foreground/80">{subtitle}</p>
        </div>
        <div className="md:w-full md:max-w-md md:justify-self-end">{formSlot}</div>
      </div>
    </section>
  );
}
