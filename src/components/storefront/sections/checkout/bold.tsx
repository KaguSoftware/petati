import type { CheckoutLayoutProps } from "../types";

export function CheckoutBold({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <h1 className="mb-8 text-4xl font-extrabold tracking-tight uppercase md:text-6xl">{title}</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>{form}</div>
        <aside className="h-fit border-4 border-foreground bg-background p-6 lg:sticky lg:top-28">{summary}</aside>
      </div>
    </main>
  );
}
