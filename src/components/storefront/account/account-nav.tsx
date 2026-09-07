"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AccountNav({ labels }: { labels: { orders: string; addresses: string; wishlist: string; profile: string } }) {
  const pathname = usePathname();
  const items = [
    { href: "/account", label: labels.orders },
    { href: "/account/addresses", label: labels.addresses },
    { href: "/account/wishlist", label: labels.wishlist },
    { href: "/account/profile", label: labels.profile },
  ];
  return (
    <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
      {items.map((i) => {
        const active = i.href === "/account" ? pathname === "/account" : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={cn("rounded-md px-3 py-2 text-sm whitespace-nowrap", active ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60")}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
