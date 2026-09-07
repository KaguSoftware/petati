import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MobileNav } from "@/components/storefront/shared/mobile-nav";
import { SearchForm } from "@/components/storefront/shared/search-form";
import type { NavbarProps } from "../types";

export function NavbarMinimal({ storeName, logoUrl, categories, labels, cartSlot, accountSlot, localeSlot }: NavbarProps) {
  const links = [
    { href: "/", label: labels.home },
    { href: "/shop", label: labels.shop },
    ...categories.map((c) => ({ href: `/c/${c.slug}`, label: c.name })),
  ];
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <MobileNav label={labels.menu} storeName={storeName} links={links} searchPlaceholder={labels.search} />
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {logoUrl ? <Image src={logoUrl} alt={storeName} width={32} height={32} className="size-8 rounded object-contain" /> : null}
          {storeName}
        </Link>
        <nav className="ms-6 hidden items-center gap-5 text-sm md:flex">
          {links.slice(1).map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground transition hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <SearchForm placeholder={labels.search} className="hidden w-56 lg:block" />
          {localeSlot}
          {accountSlot}
          {cartSlot}
        </div>
      </div>
    </header>
  );
}
