import type { AnnouncementBarProps } from "../types";

export function AnnouncementBarBold({ text }: AnnouncementBarProps) {
  if (!text) return null;
  return (
    <div className="bg-foreground px-4 py-2.5 text-center text-[11px] font-bold tracking-widest text-background uppercase">
      {text}
    </div>
  );
}
