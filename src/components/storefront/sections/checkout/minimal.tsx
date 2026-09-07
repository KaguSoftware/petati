import type { CheckoutLayoutProps } from "../types";

export function CheckoutMinimal({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>{form}</div>
        <aside className="h-fit rounded-lg border bg-muted/40 p-5 lg:sticky lg:top-24">{summary}</aside>
      </div>
    </main>
  );
}
