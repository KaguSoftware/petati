"use client";

import { Heart, MapPin, Package, User } from "lucide-react";
import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Labels {
  orders: string;
  addresses: string;
  wishlist: string;
  profile: string;
}

const ITEMS = [
  { href: "/account", key: "orders", Icon: Package },
  { href: "/account/addresses", key: "addresses", Icon: MapPin },
  { href: "/account/wishlist", key: "wishlist", Icon: Heart },
  { href: "/account/profile", key: "profile", Icon: User },
] as const;

/**
 * Account sections. Desktop: a vertical list inside the account card with an icon, a filled
 * active row and an accent bar. Phone/tablet: a segmented control (rounded track, raised active
 * pill) that scrolls sideways. `signOut` renders as the last row of the desktop list.
 */
export function AccountNav({ labels, signOut }: { labels: Labels; signOut?: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/account" ? pathname === "/account" : pathname.startsWith(href));

  return (
    <>
      {/* Phone / tablet */}
      <nav aria-label={labels.orders} className="-mx-1 overflow-x-auto px-1 pb-1 md:hidden [scrollbar-width:none]">
        <div className="inline-flex w-max min-w-full items-center gap-1 rounded-xl bg-muted/70 p-1">
          {ITEMS.map(({ href, key, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 text-sm whitespace-nowrap transition-colors outline-none select-none",
                  active ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {labels[key]}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop */}
      <nav aria-label={labels.orders} className="hidden flex-col gap-0.5 md:flex">
        {ITEMS.map(({ href, key, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors outline-none",
                active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              {active && <span aria-hidden className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary" />}
              <Icon aria-hidden className="size-4 shrink-0" />
              {labels[key]}
            </Link>
          );
        })}
        {signOut && (
          <div className="mt-2 border-t pt-2 [&_button]:h-11 [&_button]:w-full [&_button]:justify-start [&_button]:gap-3 [&_button]:px-3 [&_button]:text-muted-foreground [&_button]:hover:text-foreground">
            {signOut}
          </div>
        )}
      </nav>
    </>
  );
}
