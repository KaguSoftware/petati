import type { AnnouncementBarProps } from "../types";

export function AnnouncementBarMinimal({ text }: AnnouncementBarProps) {
  if (!text) return null;
  return (
    <div className="bg-foreground px-4 py-2 text-center text-xs font-medium tracking-wide text-background">
      {text}
    </div>
  );
}
