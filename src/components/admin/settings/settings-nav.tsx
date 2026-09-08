"use client";

import { useTranslations } from "next-intl";
import { OverlayScroll } from "@/components/ui/overlay-scroll";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "general", href: "/admin/settings" },
  { key: "commerce", href: "/admin/settings/commerce" },
  { key: "pages", href: "/admin/settings/pages" },
  { key: "shipping", href: "/admin/settings/shipping" },
] as const;

/** Tabs-styled links shared by the four settings routes (each route is prefetchable). */
export function SettingsNav() {
  const t = useTranslations("admin.settings.nav");
  const pathname = usePathname();
  return (
    <OverlayScroll axis="x" className="-mx-1 px-1">
      <nav aria-label={t("label")} className="inline-flex h-8 w-max items-center gap-0.5 rounded-lg bg-muted p-[3px] text-muted-foreground">
        {ITEMS.map((item) => {
          const active = item.href === "/admin/settings" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-full items-center rounded-md border border-transparent px-3 text-sm font-medium whitespace-nowrap transition-colors",
                active ? "bg-background text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground",
              )}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </OverlayScroll>
  );
}
