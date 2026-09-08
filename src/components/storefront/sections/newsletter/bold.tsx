import type { NewsletterProps } from "../types";

export function NewsletterBold({ title, subtitle, formSlot }: NewsletterProps) {
  return (
    <section className="border-t-4 border-foreground bg-accent text-accent-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-gutter py-16 @desktop:grid-cols-2 @desktop:py-24">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl leading-[0.95] font-extrabold tracking-tight text-balance uppercase @tablet:text-6xl">{title}</h2>
          <p className="max-w-md text-lg font-medium text-accent-foreground/80">{subtitle}</p>
        </div>
        <div className="w-full max-w-md [&_input]:border-transparent [&_input]:bg-background @desktop:justify-self-end">{formSlot}</div>
      </div>
    </section>
  );
}
