import type { CheckoutLayoutProps } from "../types";

export function CheckoutPlayful({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight @tablet:text-4xl">{title}</h1>
      <div className="grid gap-8 @desktop:grid-cols-[1fr_380px]">
        <div>{form}</div>
        <aside className="h-fit rounded-3xl bg-muted p-6 ring-1 ring-foreground/5 @desktop:sticky @desktop:top-24">{summary}</aside>
      </div>
    </main>
  );
}
