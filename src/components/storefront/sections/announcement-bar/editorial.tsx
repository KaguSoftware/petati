import type { AnnouncementBarProps } from "../types";

export function AnnouncementBarEditorial({ text }: AnnouncementBarProps) {
  if (!text) return null;
  return (
    <div className="border-y border-foreground/15 bg-background px-4 py-2 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
      {text}
    </div>
  );
}
