"use client";

import { useLinkStatus } from "next/link";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { AdminNavItem } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { navIcon } from "./admin-nav-icons";

interface Props {
  items: AdminNavItem[];
  /** Called after a link is chosen (mobile drawer closes itself). */
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebarNav({ items, onNavigate, className }: Props) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("openMenu")} className={cn("flex flex-col gap-0.5", className)}>
      {items.map((item) => {
        const Icon = navIcon(item.icon);
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{t(item.key)}</span>
            <PendingDot />
          </Link>
        );
      })}
    </nav>
  );
}

/** Subtle pulse at the end of a sidebar link while its navigation is pending (rare: pages are prefetched). */
function PendingDot() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={cn("ms-auto size-1.5 shrink-0 rounded-full bg-current", pending ? "animate-pulse opacity-70" : "opacity-0")} />;
}
