import type { CheckoutLayoutProps } from "../types";

/** Summary first: the order summary as a dark band across the top, the form full-width below. */
export function CheckoutBold({ title, form, summary }: CheckoutLayoutProps) {
  return (
    <main className="py-10 @tablet:py-14">
      <div className="bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-6 px-gutter py-8 @tablet:grid-cols-[auto_1fr] @tablet:items-start @tablet:gap-12 @tablet:py-10">
          <h1 className="text-4xl font-extrabold tracking-tight uppercase @tablet:text-6xl">{title}</h1>
          <div className="text-background [&_*]:border-background/20 [&_.text-muted-foreground]:text-background/70 [&_h2]:text-background">{summary}</div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-gutter pt-10">
        <div className="mx-auto max-w-2xl border-4 border-foreground p-5 @tablet:p-8">{form}</div>
      </div>
    </main>
  );
}
