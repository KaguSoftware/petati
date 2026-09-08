import { Link } from "@/i18n/navigation";
import type { FooterProps } from "../types";

const pill = "-ms-3 w-fit rounded-full px-3 py-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm";

export function FooterPlayful({ storeName, tagline, categories, contactEmail, contactPhone, labels, localeSlot, year }: FooterProps) {
  return (
    <footer className="mt-8 rounded-t-[3rem] bg-muted ring-1 ring-foreground/5">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 pt-14 pb-10 @tablet:grid-cols-4 @tablet:px-8">
        <div className="flex flex-col gap-2 @tablet:col-span-2">
          <p className="text-2xl font-bold tracking-tight">{storeName}</p>
          {tagline && <p className="max-w-sm text-sm text-muted-foreground">{tagline}</p>}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <p className="mb-1 font-bold">{labels.categories}</p>
          {categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className={pill}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <p className="mb-1 font-bold">{labels.contact}</p>
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className={pill}>
              {contactEmail}
            </a>
          )}
          {contactPhone && (
            <a href={`tel:${contactPhone}`} className={pill} dir="ltr">
              {contactPhone}
            </a>
          )}
          <Link href="/privacy" className={pill}>
            {labels.privacy}
          </Link>
          <Link href="/terms" className={pill}>
            {labels.terms}
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 pb-6 text-xs text-muted-foreground @tablet:px-8">
        <span className="rounded-full bg-background/60 px-3 py-1">
          © {year} {storeName}. {labels.rights}
        </span>
        {localeSlot}
      </div>
    </footer>
  );
}
