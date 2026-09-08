import type { AnnouncementBarProps } from "../types";

/** Ticker: a start-aligned line between hairlines, marked with an accent square. */
export function AnnouncementBarEditorial({ text }: AnnouncementBarProps) {
  if (!text) return null;
  return (
    <div className="border-y border-foreground/15 bg-background">
      <p className="mx-auto flex max-w-7xl items-center gap-3 px-gutter py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span aria-hidden className="size-2 shrink-0 bg-accent" />
        <span className="truncate">{text}</span>
      </p>
    </div>
  );
}
