import type { CheckoutLayoutProps } from "../types";

export function CheckoutMinimal({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-gutter py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="grid gap-8 @desktop:grid-cols-[1fr_380px] @desktop:gap-10">
        <div>{form}</div>
        {/* On phones the summary comes first, so the total is seen before the form. */}
        <aside className="order-first h-fit rounded-xl border bg-muted/40 p-5 @desktop:order-none @desktop:sticky @desktop:top-24">{summary}</aside>
      </div>
    </main>
  );
}
