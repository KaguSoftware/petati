import { Link } from "@/i18n/navigation";
import type { FooterProps } from "../types";

const link = "text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground";

/** Everything centred: the wordmark, a dot-separated line of links, the contact line, hairlines between. */
export function FooterEditorial({ storeName, tagline, categories, contactEmail, contactPhone, labels, localeSlot, year }: FooterProps) {
  const items = [
    ...categories.map((c) => ({ href: `/c/${c.slug}`, label: c.name })),
    { href: "/privacy", label: labels.privacy },
    { href: "/terms", label: labels.terms },
  ];
  return (
    <footer className="border-t border-foreground/15 bg-background">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-14 text-center @tablet:py-20">
        <div className="flex flex-col items-center gap-3">
          <p className="font-serif text-4xl font-medium tracking-tight @tablet:text-5xl">{storeName}</p>
          {tagline && <p className="max-w-md font-serif text-base italic text-muted-foreground">{tagline}</p>}
        </div>
        <nav aria-label={labels.categories} className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {items.map((item, i) => (
            <span key={item.href} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden className="text-muted-foreground/60">
                  ·
                </span>
              )}
              <Link href={item.href} className={link}>
                {item.label}
              </Link>
            </span>
          ))}
        </nav>
        {(contactEmail || contactPhone) && (
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-y border-foreground/15 px-6 py-3 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-[0.18em]">{labels.contact}</span>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="hover:text-foreground">
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="hover:text-foreground" dir="ltr">
                {contactPhone}
              </a>
            )}
          </p>
        )}
        <div className="flex flex-col items-center gap-3 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          {localeSlot}
          <span>
            © {year} {storeName}. {labels.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
