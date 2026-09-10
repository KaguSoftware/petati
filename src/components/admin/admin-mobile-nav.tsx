"use client";

import { useState, type ReactNode } from "react";
import { Menu, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { OverlayScroll } from "@/components/ui/overlay-scroll";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AdminNavItem } from "@/lib/auth/permissions";
import { AdminSidebarNav } from "./admin-sidebar-nav";
import { StoreMark } from "./store-mark";

interface Props {
  items: AdminNavItem[];
  storeName: string;
  logoUrl: string | null;
  /** Store switcher (owner) rendered under the header. */
  switcher?: ReactNode;
}

export function AdminMobileNav({ items, storeName, logoUrl, switcher }: Props) {
  const t = useTranslations("admin.nav");
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label={t("openMenu")} />}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="start" showCloseButton={false} className="gap-0 p-0">
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <span className="flex min-w-0 items-center gap-2 font-semibold">
            <StoreMark logoUrl={logoUrl} />
            <span className="truncate">{storeName}</span>
          </span>
          <SheetClose render={<Button variant="ghost" size="icon" aria-label={t("closeMenu")} />}>
            <XIcon />
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">{t("openMenu")}</SheetTitle>
        {switcher && <div className="border-b p-3">{switcher}</div>}
        <OverlayScroll className="flex-1">
          <AdminSidebarNav items={items} onNavigate={() => setOpen(false)} className="p-2" />
        </OverlayScroll>
      </SheetContent>
    </Sheet>
  );
}
