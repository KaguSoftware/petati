import { Link } from "@/i18n/navigation";
import type { FooterProps } from "../types";

const link = "text-xs font-bold tracking-widest whitespace-nowrap uppercase text-background/70 decoration-2 underline-offset-4 transition-colors hover:text-background hover:underline";

/** A giant wordmark across a dark footer, one row of links underneath. */
export function FooterBold({ storeName, tagline, categories, contactEmail, contactPhone, labels, localeSlot, year }: FooterProps) {
  return (
    <footer className="overflow-hidden bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-gutter pt-14 pb-8 @tablet:pt-20">
        <p aria-hidden className="-mb-2 -ms-[0.05em] truncate text-[21cqw] leading-[0.8] font-extrabold tracking-tighter uppercase @tablet:text-[14cqw] @wide:text-[12rem]">
          {storeName}
        </p>
        {tagline && <p className="max-w-md text-sm font-medium text-background/70">{tagline}</p>}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t-2 border-background/20 pt-6">
          {categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className={link}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/privacy" className={link}>
            {labels.privacy}
          </Link>
          <Link href="/terms" className={link}>
            {labels.terms}
          </Link>
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className={link}>
              {contactEmail}
            </a>
          )}
          {contactPhone && (
            <a href={`tel:${contactPhone}`} className={link}>
              <bdi dir="ltr">{contactPhone}</bdi>
            </a>
          )}
        </div>
        <div className="flex flex-col gap-4 pb-2 text-[11px] font-bold tracking-widest text-background/60 uppercase @phablet:flex-row @phablet:items-center @phablet:justify-between">
          <span>
            © {year} {storeName}. {labels.rights}
          </span>
          {localeSlot}
        </div>
      </div>
    </footer>
  );
}
