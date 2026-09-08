"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { ADMIN_NAV } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

const NAV_KEYS = new Set(ADMIN_NAV.map((i) => i.key));
const SUB_KEYS = new Set(["new", "edit", "categories", "movements", "expenses", "commerce", "pages", "shipping"]);

/** Derives crumbs from the pathname: /admin/orders/abc → Admin › Orders › abc. */
export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  const crumbs = [{ href: "/admin", label: t("title") }];
  let href = "/admin";
  for (const seg of segments) {
    href += `/${seg}`;
    const label = NAV_KEYS.has(seg) ? t(`nav.${seg}`) : SUB_KEYS.has(seg) ? t(`crumbs.${seg}`) : seg.length > 12 ? `${seg.slice(0, 8)}…` : seg;
    crumbs.push({ href, label });
  }
  return (
    <nav aria-label={t("title")} className={cn("flex items-center gap-1 overflow-hidden text-sm text-muted-foreground", className)}>
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <Fragment key={c.href}>
            {i > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 rtl:-scale-x-100" />}
            {last ? (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="truncate hover:text-foreground">
                {c.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
