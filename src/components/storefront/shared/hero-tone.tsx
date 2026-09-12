"use client";

import { useEffect } from "react";

/**
 * Picks the overlay navbar's colours from the pixels actually behind it.
 *
 * A navbar sitting over a full-bleed hero went transparent-with-white-text at the top of the page.
 * Over a light photo that is white on white — the bar disappears. A fixed dark scrim would fix the
 * contrast but put an ugly veil over bright heroes, so instead we measure.
 *
 * Samples the strip of the hero image that the bar actually covers, computes WCAG relative
 * luminance, and stamps `data-hero-tone="light" | "dark"` on the storefront root. CSS then flips
 * the bar between white-on-dark-scrim and dark-on-light-scrim (see globals.css). A scrim is applied
 * either way, so the bar stays legible even when this never runs.
 *
 * Renders nothing. Safe by construction: any failure (image still loading, a tainted canvas, no
 * photo at all) leaves the default `dark` styling, which is the behaviour that shipped before.
 */

/** Height of the band we care about: the navbar, plus a little breathing room. */
const BAND_FALLBACK_PX = 72;

/** sRGB channel → linear, for WCAG relative luminance. */
function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Average relative luminance of the top band of `img` as it is actually displayed.
 * The image is `object-fit: cover`, so we map the element's box back onto the source crop rather
 * than sampling the whole file — the visible strip is often nothing like the full picture.
 */
function bandLuminance(img: HTMLImageElement, bandCssPx: number): number | null {
  const rect = img.getBoundingClientRect();
  const { naturalWidth: nw, naturalHeight: nh } = img;
  if (!nw || !nh || !rect.width || !rect.height) return null;

  const scale = Math.max(rect.width / nw, rect.height / nh);
  const srcW = rect.width / scale;
  const srcH = rect.height / scale;
  const srcX = (nw - srcW) / 2;
  const srcY = (nh - srcH) / 2;
  const bandSrcH = Math.min(bandCssPx / scale, srcH);

  const W = 32;
  const H = 8;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(img, srcX, srcY, srcW, bandSrcH, 0, 0, W, H);
    const { data } = ctx.getImageData(0, 0, W, H);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.2126 * linear(data[i]) + 0.7152 * linear(data[i + 1]) + 0.0722 * linear(data[i + 2]);
    }
    return sum / (data.length / 4);
  } catch {
    // Cross-origin image without CORS headers — the canvas is tainted and getImageData throws.
    return null;
  }
}

/**
 * Luminance at which black text beats white text on the same background.
 * From the WCAG contrast formula: white wins while (L + 0.05)² < 0.0525.
 */
const DARK_TEXT_ABOVE = 0.179;

export function HeroTone() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-storefront]");
    const hero = document.querySelector<HTMLElement>("[data-hero-overlay]");
    if (!root || !hero) return;

    // Measure the bar itself rather than parsing --navbar-h, which is in rem and varies by layout.
    const header = document.querySelector<HTMLElement>("header[data-navbar-overlay]");

    let frame = 0;
    const measure = () => {
      frame = 0;
      // The carousel marks every slide but the active one `inert`; a single-slide hero marks none.
      const images = [...hero.querySelectorAll("img")];
      const img = images.find((el) => !el.closest("[inert], [aria-hidden='true']")) ?? images[0];
      if (!img) return;
      const band = header?.getBoundingClientRect().height || BAND_FALLBACK_PX;
      if (!img.complete) {
        img.addEventListener("load", schedule, { once: true });
        return;
      }
      const lum = bandLuminance(img, band);
      if (lum === null) return;
      root.dataset.heroTone = lum > DARK_TEXT_ABOVE ? "light" : "dark";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    // Re-measure when the carousel advances (inert/aria-hidden flip) and when the box resizes.
    const mo = new MutationObserver(schedule);
    mo.observe(hero, { subtree: true, attributes: true, attributeFilter: ["inert", "aria-hidden", "src"] });
    const ro = new ResizeObserver(schedule);
    ro.observe(hero);

    return () => {
      mo.disconnect();
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
      delete root.dataset.heroTone;
    };
  }, []);

  return null;
}
