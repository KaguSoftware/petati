import type { CheckoutLayoutProps } from "../types";

/** Stepped cards: the form in a rounded card, the summary in an accent card that overlaps on desktop. */
export function CheckoutPlayful({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight @tablet:text-4xl">{title}</h1>
      <div className="grid gap-6 @desktop:grid-cols-[1fr_360px] @desktop:items-start">
        <div className="rounded-3xl bg-background p-5 shadow-lg shadow-primary/10 ring-1 ring-foreground/5 @tablet:p-8">{form}</div>
        <aside className="rounded-3xl bg-accent/20 p-6 ring-1 ring-foreground/5 @desktop:sticky @desktop:top-24 @desktop:-ms-6 @desktop:mt-8">{summary}</aside>
      </div>
    </main>
  );
}
