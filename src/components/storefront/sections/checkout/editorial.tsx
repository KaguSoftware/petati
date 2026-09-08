import type { CheckoutLayoutProps } from "../types";

export function CheckoutEditorial({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-10 border-b border-foreground/15 pb-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">{title}</h1>
      <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-0">
        <div className="lg:pe-12">{form}</div>
        <aside className="h-fit border-t border-foreground/15 pt-8 lg:sticky lg:top-24 lg:border-s lg:border-t-0 lg:ps-10 lg:pt-0">{summary}</aside>
      </div>
    </main>
  );
}
