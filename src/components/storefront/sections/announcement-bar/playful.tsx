import { Sparkles } from "lucide-react";
import type { AnnouncementBarProps } from "../types";

/** A rounded pill floating just under the top edge. */
export function AnnouncementBarPlayful({ text }: AnnouncementBarProps) {
  if (!text) return null;
  return (
    <div className="flex justify-center px-4 pt-3">
      <p className="inline-flex max-w-full items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold tracking-wide text-accent-foreground shadow-md shadow-accent/30">
        <Sparkles aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">{text}</span>
      </p>
    </div>
  );
}
