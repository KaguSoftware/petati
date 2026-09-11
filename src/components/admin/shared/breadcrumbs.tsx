"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { ADMIN_NAV } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { useCrumbLabel } from "./crumb-labels";

const NAV_KEYS = new Set(ADMIN_NAV.map((i) => i.key));
const SUB_KEYS = new Set(["new", "edit", "categories", "brands", "movements", "couriers", "runs", "cash", "log", "expenses", "commerce", "pages", "shipping"]);

/** Derives crumbs from the pathname: /admin/orders/abc → Admin › Orders › 2609-01003 (when the page named it). */
export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  const crumbs: { href: string; seg: string | null }[] = [{ href: "/admin", seg: null }];
  let href = "/admin";
  for (const seg of segments) {
    href += `/${seg}`;
    crumbs.push({ href, seg });
  }
  return (
    <nav aria-label={t("title")} className={cn("flex items-center gap-1 overflow-hidden text-sm text-muted-foreground", className)}>
      {crumbs.map((c, i) => {
        // Phones keep only the parent and the page: four two-letter stubs say nothing.
        const phoneHidden = crumbs.length > 2 && i < crumbs.length - 2;
        return (
          <Fragment key={c.href}>
            {i > 0 && <ChevronRight aria-hidden className={cn("size-3.5 shrink-0 rtl:-scale-x-100", phoneHidden && "hidden md:block")} />}
            <span className={cn("contents", phoneHidden && "max-md:hidden")}>
              <Crumb href={c.href} seg={c.seg} last={i === crumbs.length - 1} />
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}

function Crumb({ href, seg, last }: { href: string; seg: string | null; last: boolean }) {
  const t = useTranslations("admin");
  const named = useCrumbLabel(seg ?? "");
  const label =
    seg === null ? t("title") : (named ?? (NAV_KEYS.has(seg) ? t(`nav.${seg}`) : SUB_KEYS.has(seg) ? t(`crumbs.${seg}`) : seg.length > 12 ? `${seg.slice(0, 8)}…` : seg));
  if (last) {
    return (
      <span className="truncate font-medium text-foreground" aria-current="page">
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className="truncate hover:text-foreground">
      {label}
    </Link>
  );
}
