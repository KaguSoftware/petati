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
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-gutter py-14 text-center @tablet:py-20">
        <div className="flex flex-col items-center gap-3">
          <p className="font-serif text-4xl font-medium tracking-tight @tablet:text-5xl">{storeName}</p>
          {tagline && <p className="max-w-md font-serif text-base italic text-muted-foreground">{tagline}</p>}
        </div>
        <nav aria-label={labels.categories} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={link}>
              {item.label}
            </Link>
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
              <a href={`tel:${contactPhone}`} className="hover:text-foreground">
              <bdi dir="ltr">{contactPhone}</bdi>
            </a>
            )}
          </p>
        )}
        <div className="flex flex-col items-center gap-3 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          {localeSlot}
          <span>
            <bdi dir="ltr">© {year} {storeName}.</bdi> {labels.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
