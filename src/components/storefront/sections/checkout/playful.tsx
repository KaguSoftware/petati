import type { CheckoutLayoutProps } from "../types";

/** Stepped cards: the form in a rounded card, the summary in a tinted card beside it (first on phones). */
export function CheckoutPlayful({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-gutter py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight @tablet:text-4xl">{title}</h1>
      <div className="grid gap-6 @desktop:grid-cols-[1fr_360px] @desktop:items-start">
        <div className="rounded-3xl bg-background p-5 shadow-lg shadow-primary/10 ring-1 ring-foreground/5 @tablet:p-8">{form}</div>
        <aside className="order-first rounded-3xl bg-accent/10 p-6 ring-1 ring-accent/30 @desktop:order-none @desktop:sticky @desktop:top-24">{summary}</aside>
      </div>
    </main>
  );
}
