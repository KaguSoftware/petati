"use client";

import * as Icons from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ADMIN_NAV, can } from "@/lib/auth/permissions";
import type { EffectiveRole } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { StoreSwitcher } from "./store-switcher";
import { LocaleSwitcher } from "@/components/locale-switcher";

interface Props {
  locale: string;
  user: { name: string; email: string };
  role: EffectiveRole;
  store: { id: string; name: string; slug: string; currency: string };
  /** Non-empty only for owners with FEATURE_MULTI_STORE on. */
  stores: { id: string; name: string }[];
  children: React.ReactNode;
}

export function AdminShell({ locale, user, role, store, stores, children }: Props) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const nav = ADMIN_NAV.filter((item) => can(role, item.permission));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-e bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
          <Icons.Store className="size-5" />
          <span className="truncate">{store.name}</span>
        </div>
        {stores.length > 0 && (
          <div className="border-b p-2">
            <StoreSwitcher current={store.id} stores={stores} />
          </div>
        )}
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {nav.map((item) => {
            const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[item.icon] ?? Icons.Circle;
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="size-4" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground">
          <div className="truncate font-medium text-foreground">{user.name}</div>
          <div className="truncate">{user.email}</div>
          <div className="mt-1 uppercase tracking-wide">{role}</div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-2 border-b px-4">
          <div className="text-sm text-muted-foreground md:hidden">{store.name}</div>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher />
            <form action={signOutAction.bind(null, locale)}>
              <Button variant="ghost" size="sm" type="submit">
                <Icons.LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
