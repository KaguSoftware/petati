"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { NAVBAR_VARS, themeToCssVars, type StoreTheme } from "@/lib/theme/types";
import { cn } from "@/lib/utils";

export type PreviewDevice = "desktop" | "mobile";
export const DEVICE_WIDTH: Record<PreviewDevice, number> = { desktop: 1280, mobile: 390 };

interface Props {
  device: PreviewDevice;
  theme: StoreTheme;
  dir: "ltr" | "rtl";
  /** Locale the preview is drawn in (font stacks depend on the script). */
  locale?: string;
  children: ReactNode;
  /** Accessible name; the frame is inert, a picture of the layout. */
  label: string;
  className?: string;
  /** Height cap in frame pixels (before scaling) so long sections do not dominate the picker. */
  maxHeight?: number;
}

/**
 * A storefront section drawn at a real device width, then shrunk to fit its box with CSS `zoom`.
 * The inner box is `@container`, so the section's container-query variants lay out for the
 * device width, not the admin viewport; `zoom` keeps the height in flow, so nothing has to be
 * measured but the box width. Colours/fonts/radius come from the draft theme, so edits show live.
 */
export function PreviewFrame({ device, theme, dir, locale, children, label, className, maxHeight }: Props) {
  const width = DEVICE_WIDTH[device];
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      if (w > 0) setScale(w / width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const measured = scale !== null;
  return (
    <div
      ref={outer}
      role="img"
      aria-label={label}
      className={cn("isolate w-full max-w-full overflow-hidden bg-muted contain-inline-size", className)}
      style={{
        // Placeholder box until the first measurement, then the zoomed content sets the height.
        aspectRatio: measured ? undefined : `${width} / ${Math.round(width * (device === "mobile" ? 1.2 : 0.55))}`,
        maxHeight: measured && maxHeight ? maxHeight * scale : undefined,
      }}
    >
      <div
        inert
        dir={dir}
        className="@container pointer-events-none select-none bg-background font-sans text-foreground"
        style={{
          width,
          zoom: scale ?? 1,
          visibility: measured ? undefined : "hidden",
          ...(themeToCssVars(theme, locale ?? (dir === "rtl" ? "fa" : "en")) as CSSProperties),
        }}
      >
        {/* Same split as the storefront root: the navbar's `@tablet:` variables must live below the container. */}
        <div data-storefront className={cn("flex flex-col *:w-full", NAVBAR_VARS[theme.sections.navbar])}>
          {children}
        </div>
      </div>
    </div>
  );
}
