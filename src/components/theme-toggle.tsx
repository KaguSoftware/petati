"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Light/dark toggle.
 *
 * Both the icon AND the accessible name are chosen by CSS (`dark:hidden` / `hidden dark:block`)
 * rather than by React state. That means the server and client render identical markup — no
 * hydration mismatch, no `mounted` guard, no icon pop-in — and the right label is present from the
 * first paint. `resolvedTheme` is only read inside the click handler, which by definition runs
 * after mount, so it never participates in rendering.
 *
 * Clicking commits an explicit choice and drops "system", which is what someone reaching for the
 * toggle is asking for.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={className}
    >
      <Sun aria-hidden className="size-5 dark:hidden" />
      <Moon aria-hidden className="hidden size-5 dark:block" />
      <span className="sr-only dark:hidden">{t("themeToDark")}</span>
      <span className="sr-only hidden dark:block">{t("themeToLight")}</span>
    </Button>
  );
}
