"use client";

import { useEffect, useRef } from "react";

/**
 * Marks the enclosing <header> with data-at-top="true|false" from the window scroll position, so
 * CSS can render the bar transparent over a full-bleed hero and solid once the page scrolls.
 * Renders nothing; a passive, rAF-throttled listener.
 */
export function NavScrollState() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const header = ref.current?.closest("header");
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.dataset.atTop = window.scrollY < 8 ? "true" : "false";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return <span ref={ref} hidden />;
}
