"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import type { ReactNode } from "react";

/**
 * Colour-scheme provider.
 *
 * `next-themes` has been a dependency all along but was never mounted, so `useTheme()` in
 * `ui/sonner.tsx` fell through to next-themes' stub and returned `undefined` — which meant Sonner
 * resolved "system" itself and stamped its own dark styling onto toasts for anyone on a dark OS,
 * against a light surface. Mounting this fixes that as a side effect.
 *
 * `enableColorScheme` (on by default) writes `color-scheme` onto <html>, which is what the
 * storefront's `light-dark()` theme values key off, and what tells the browser to darken native
 * controls, date pickers, autofill and scrollbar tracks.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
