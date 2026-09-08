"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverlayScroll } from "@/components/ui/overlay-scroll";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { SearchForm } from "./search-form";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  labels: { menu: string; closeMenu: string; categories: string; search: string };
  /** Brand element shown in the drawer header (same node as the navbar logo). */
  brand: ReactNode;
  primary: NavItem[];
  categories: NavItem[];
  /** Locale switcher + account button, rendered in the drawer footer. */
  footer: ReactNode;
}

const bar = "h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none";
const drawerLink = "stagger-in rounded-lg px-3 py-2.5 text-base transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

/**
 * Hamburger + full-height drawer from the inline-start edge (mirrors under RTL). Links close the
 * drawer on navigation via `SheetClose render={<Link/>}`, so no effects are needed; the staggered
 * reveal is driven by Base UI's `data-starting-style` on the popup (see `stagger-in` in globals.css).
 */
export function MobileNav({ labels, brand, primary, categories, footer }: Props) {
  const [open, setOpen] = useState(false);
  const renderLink = (item: NavItem, index: number) => (
    <SheetClose
      key={item.href}
      nativeButton={false}
      render={<Link href={item.href} />}
      className={drawerLink}
      style={{ "--stagger": index } as CSSProperties}
    >
      {item.label}
    </SheetClose>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon-lg" className="group/burger md:hidden" aria-label={open ? labels.closeMenu : labels.menu} />}
      >
        <span aria-hidden className="flex flex-col items-center justify-center gap-[5px]">
          <span className={`${bar} group-data-[popup-open]/burger:translate-y-[7px] group-data-[popup-open]/burger:rotate-45`} />
          <span className={`${bar} group-data-[popup-open]/burger:scale-x-0 group-data-[popup-open]/burger:opacity-0`} />
          <span className={`${bar} group-data-[popup-open]/burger:-translate-y-[7px] group-data-[popup-open]/burger:-rotate-45`} />
        </span>
      </SheetTrigger>

      <SheetContent side="start" showCloseButton={false} className="gap-0 p-0">
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          {brand}
          <SheetClose render={<Button variant="ghost" size="icon" aria-label={labels.closeMenu} />}>
            <XIcon />
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">{labels.menu}</SheetTitle>

        <div className="shrink-0 px-4 py-3">
          <SearchForm placeholder={labels.search} onSubmitted={() => setOpen(false)} />
        </div>

        <OverlayScroll className="flex-1">
          <nav aria-label={labels.menu} className="flex flex-col gap-0.5 px-2 pb-4">
            {primary.map(renderLink)}
            {categories.length > 0 && (
              <p
                className="stagger-in mt-4 mb-1 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                style={{ "--stagger": primary.length } as CSSProperties}
              >
                {labels.categories}
              </p>
            )}
            {categories.map((item, i) => renderLink(item, primary.length + 1 + i))}
          </nav>
        </OverlayScroll>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t p-3">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
