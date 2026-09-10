"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { buttonVariants } from "@/components/ui/button";
import { OverlayScroll } from "@/components/ui/overlay-scroll";
import { Link } from "@/i18n/navigation";
import { ADMIN_NAV, can } from "@/lib/auth/permissions";
import type { EffectiveRole } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminSidebarNav } from "./admin-sidebar-nav";
import { Breadcrumbs } from "./shared/breadcrumbs";
import { StoreMark } from "./store-mark";
import { StoreSwitcher } from "./store-switcher";
import { UserMenu } from "./user-menu";

export interface AdminShellProps {
  locale: string;
  user: { name: string; email: string; avatarUrl: string | null };
  role: EffectiveRole;
  store: { id: string; name: string; slug: string; currency: string; logoUrl: string | null };
  /** Non-empty only for platform owners. */
  stores: { id: string; name: string }[];
  /** Platform owner: shows the switcher, the Stores nav item and the create link. */
  multiStore: boolean;
  children: React.ReactNode;
}

export function AdminShell({ locale, user, role, store, stores, multiStore, children }: AdminShellProps) {
  const t = useTranslations("admin");
  const nav = ADMIN_NAV.filter((item) => can(role, item.permission) && (!item.gate || (item.gate === "multiStore" && multiStore)));
  const switcher = multiStore && stores.length > 0 ? (
    <div className="flex flex-col gap-1.5">
      <StoreSwitcher current={store.id} stores={stores} />
      <Link href="/admin/stores/new" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-start")}>
        {t("nav.createStore")}
      </Link>
    </div>
  ) : null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col self-start border-e bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4 font-semibold">
          <StoreMark logoUrl={store.logoUrl} />
          <span className="truncate">{store.name}</span>
        </div>
        {switcher && <div className="border-b p-2">{switcher}</div>}
        <OverlayScroll className="min-h-0 flex-1">
          <AdminSidebarNav items={nav} className="p-2" />
        </OverlayScroll>
        <div className="border-t p-2">
          <a
            href={`/${locale}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <ExternalLink className="size-4" />
            {t("nav.storefront")}
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur md:px-6">
          <AdminMobileNav items={nav} storeName={store.name} logoUrl={store.logoUrl} switcher={switcher} />
          <Breadcrumbs className="min-w-0 flex-1" />
          <div className="flex items-center gap-1">
            <LocaleSwitcher variant="compact" />
            <UserMenu locale={locale} user={user} role={role} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
