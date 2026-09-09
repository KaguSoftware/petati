"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

const SWIPE_PX = 40;

interface Options {
  count: number;
  /** Auto-advance every `interval` ms (off when false, when there is one slide, or under reduced motion). */
  autoplay?: boolean;
  interval?: number;
}

/**
 * The behaviour shared by the hero carousel and the product gallery: an active index with
 * wrap-around, horizontal swipe (RTL-aware, vertical scrolling untouched), arrow keys, and an
 * optional auto-advance that pauses while hovered or focused. Rendering is the caller's job.
 */
export function useCarousel({ count, autoplay = false, interval = 6000 }: Options) {
  const [index, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  // Clamped, so the index stays valid when the slide list shrinks (admin editor removes a slide).
  const active = count > 0 ? Math.min(index, count - 1) : 0;

  const go = useCallback(
    (i: number) => {
      if (count < 1) return;
      setActive(((i % count) + count) % count);
    },
    [count],
  );
  const next = useCallback(() => go(active + 1), [go, active]);
  const prev = useCallback(() => go(active - 1), [go, active]);

  const running = autoplay && count > 1 && !paused;
  useEffect(() => {
    if (!running) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), interval);
    return () => window.clearInterval(id);
    // `active` restarts the timer after manual navigation so the next auto step is a full interval away.
  }, [running, count, interval, active]);

  const isRtl = () => (rootRef.current ? getComputedStyle(rootRef.current).direction === "rtl" : false);

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || count < 2) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    swiped.current = true;
    const forward = isRtl() ? dx > 0 : dx < 0;
    go(active + (forward ? 1 : -1));
  };
  const onPointerCancel = () => {
    start.current = null;
  };
  /** A drag that changed the slide must not also follow the link under the pointer. */
  const onClickCapture = (e: MouseEvent) => {
    if (!swiped.current) return;
    swiped.current = false;
    e.preventDefault();
    e.stopPropagation();
  };
  /** Native image/link dragging would swallow the pointer-up that ends a swipe. */
  const onDragStart = (e: DragEvent) => {
    if (count > 1) e.preventDefault();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (count < 2 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    if ((e.target as HTMLElement).closest("input, textarea, select")) return;
    e.preventDefault();
    const forward = (e.key === "ArrowRight") !== isRtl();
    go(active + (forward ? 1 : -1));
  };
  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setPaused(true);
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && !rootRef.current?.contains(document.activeElement)) setPaused(false);
  };
  const onFocus = () => setPaused(true);
  const onBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null) && !rootRef.current?.matches(":hover")) setPaused(false);
  };

  return {
    active,
    go,
    next,
    prev,
    running,
    rootRef,
    /** Spread on the carousel root: swipe, keys and autoplay pausing. */
    rootProps: {
      ref: rootRef,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onClickCapture,
      onDragStart,
      onKeyDown,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      style: { touchAction: "pan-y" } as const,
    },
  };
}

/** Fill a "{n} of {total}" template. */
export function ofLabel(template: string, n: number, total: number): string {
  return template.replace("{n}", String(n)).replace("{total}", String(total));
}
