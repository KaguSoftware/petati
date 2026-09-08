import type { AnnouncementBarProps } from "../types";

/** Marquee: the message repeats and scrolls across the top (pauses on hover, static under reduced motion). */
export function AnnouncementBarBold({ text }: AnnouncementBarProps) {
  if (!text) return null;
  const repeats = Array.from({ length: 6 }, (_, i) => i);
  const track = (hidden: boolean) => (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {repeats.map((i) => (
        <span key={i} className="flex items-center">
          <span>{text}</span>
          <span aria-hidden className="mx-6 inline-block size-1.5 rounded-full bg-accent" />
        </span>
      ))}
    </span>
  );
  return (
    <div role="status" aria-label={text} className="group overflow-hidden bg-foreground py-2 text-[11px] font-bold tracking-widest text-background uppercase">
      <div className="flex w-max animate-marquee [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
