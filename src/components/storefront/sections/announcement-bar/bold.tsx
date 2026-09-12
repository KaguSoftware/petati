import type { AnnouncementBarProps } from "../types";

/**
 * Marquee: the message repeats and scrolls across the top (pauses on hover, static under reduced motion).
 * The scrolling box is always LTR: under RTL a `w-max` track would overflow to the unreachable
 * side and the reversed animation would carry it out of view. Each text span keeps its own
 * direction (`dir="auto"`) so Persian still shapes correctly; `animate-marquee` reverses under RTL.
 */
export function AnnouncementBarBold({ text }: AnnouncementBarProps) {
  if (!text) return null;
  const repeats = Array.from({ length: 6 }, (_, i) => i);
  const track = (hidden: boolean) => (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {repeats.map((i) => (
        <span key={i} className="flex items-center">
          <span dir="auto" className="bidi-auto">
            {text}
          </span>
          <span aria-hidden className="mx-6 inline-block size-1.5 rounded-full bg-accent" />
        </span>
      ))}
    </span>
  );
  return (
    <div
      role="status"
      aria-label={text}
      dir="ltr"
      className="group overflow-hidden bg-foreground py-2 text-micro font-bold tracking-widest text-background uppercase [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
    >
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
