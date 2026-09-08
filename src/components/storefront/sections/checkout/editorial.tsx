import type { CheckoutLayoutProps } from "../types";

export function CheckoutEditorial({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-10 border-b border-foreground/15 pb-4 font-serif text-4xl font-medium tracking-tight @tablet:text-5xl">{title}</h1>
      <div className="grid gap-12 @desktop:grid-cols-[1fr_380px] @desktop:gap-0">
        <div className="@desktop:pe-12">{form}</div>
        <aside className="h-fit border-t border-foreground/15 pt-8 @desktop:sticky @desktop:top-24 @desktop:border-s @desktop:border-t-0 @desktop:ps-10 @desktop:pt-0">{summary}</aside>
      </div>
    </main>
  );
}
