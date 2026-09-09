import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  /** Page heading; omit when the page draws its own header (banner, brand mark). */
  title?: ReactNode;
  /** Small text under the title. */
  description?: ReactNode;
  /** Right-aligned controls on the title row. */
  actions?: ReactNode;
  /** `wide` (catalog, cart, checkout, account) or `narrow` (order receipt, content pages). */
  width?: "wide" | "narrow";
  /** Render as `<main>` (default) or a plain `<div>` when the page already has a `<main>`. */
  as?: "main" | "div";
  className?: string;
  children: ReactNode;
}

/**
 * The single page container for every storefront route: one outer edge (`max-w-7xl` + gutter),
 * one vertical rhythm and one heading style, so titles line up with the navbar wordmark and the
 * footer columns on every page. Sections on the home page use the same edge on their own.
 */
export function PageShell({ title, description, actions, width = "wide", as: Tag = "main", className, children }: Props) {
  return (
    <Tag className={cn("mx-auto w-full max-w-7xl px-gutter py-8 @desktop:py-12", className)}>
      <div className={cn("flex flex-col gap-6 @desktop:gap-8", width === "narrow" && "mx-auto max-w-3xl")}>
        {(title || actions) && (
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              {title && <h1 className="bidi-auto text-3xl font-semibold tracking-tight text-balance @tablet:text-4xl">{title}</h1>}
              {description && <p className="bidi-auto max-w-xl text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
          </header>
        )}
        {children}
      </div>
    </Tag>
  );
}
