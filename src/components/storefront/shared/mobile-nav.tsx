"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { SearchForm } from "./search-form";

export function MobileNav({
  label,
  storeName,
  links,
  searchPlaceholder,
}: {
  label: string;
  storeName: string;
  links: { href: string; label: string }[];
  searchPlaceholder: string;
}) {
  return (
    <Sheet>
      <SheetTrigger className="inline-flex size-10 items-center justify-center rounded-md hover:bg-muted md:hidden" aria-label={label}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetTitle className="px-4 pt-4 text-lg">{storeName}</SheetTitle>
        <div className="px-4 pt-3">
          <SearchForm placeholder={searchPlaceholder} />
        </div>
        <nav className="flex flex-col p-2 pt-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 hover:bg-muted">
              {l.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
