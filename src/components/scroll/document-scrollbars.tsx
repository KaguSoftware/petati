"use client";

import { useEffect } from "react";
import { useOverlayScrollbars } from "overlayscrollbars-react";
import type { PartialOptions } from "overlayscrollbars";

const OPTIONS: PartialOptions = {
  scrollbars: { theme: "os-theme-petati", autoHide: "leave", autoHideDelay: 600, clickScroll: true },
  overflow: { x: "hidden", y: "scroll" },
};

/**
 * Replaces the document's native scrollbar with an overlay one (no layout shift when it appears).
 * `<html>` stays the scrolling element, so `position: sticky`, `window.scrollY` and Next's
 * scroll-to-top on navigation keep working. Base UI locks page scroll by flagging
 * `html[data-base-ui-scroll-locked]`; we mirror that into the overlay so the drawer still locks.
 */
export function DocumentScrollbars() {
  const [initialize, instance] = useOverlayScrollbars({ defer: true, options: OPTIONS });

  useEffect(() => {
    initialize({
      target: document.body,
      // Let the library bail out on browsers whose native bars are already overlays (iOS).
      cancel: { nativeScrollbarsOverlaid: false, body: null },
    });
    const html = document.documentElement;
    const sync = () =>
      instance()?.options({
        overflow: { y: html.hasAttribute("data-base-ui-scroll-locked") ? "hidden" : "scroll" },
      });
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ["data-base-ui-scroll-locked"] });
    return () => {
      observer.disconnect();
      instance()?.destroy();
    };
  }, [initialize, instance]);

  return null;
}
