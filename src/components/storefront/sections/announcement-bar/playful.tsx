import { Sparkles } from "lucide-react";
import type { AnnouncementBarProps } from "../types";

export function AnnouncementBarPlayful({ text }: AnnouncementBarProps) {
  if (!text) return null;
  return (
    <div className="bg-accent text-accent-foreground @tablet:mx-4 @tablet:rounded-b-3xl">
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold tracking-wide">
        <Sparkles aria-hidden className="size-3.5 shrink-0" />
        <span>{text}</span>
      </p>
    </div>
  );
}
