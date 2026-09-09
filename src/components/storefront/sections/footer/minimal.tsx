import { Link } from "@/i18n/navigation";
import { ContactBlock } from "@/components/storefront/shared/contact-block";
import { PaymentBadges } from "@/components/storefront/shared/payment-badges";
import { SocialLinks } from "@/components/storefront/shared/social-links";
import { StoreLogo } from "@/components/storefront/shared/store-logo";
import { TrustStrip } from "@/components/storefront/shared/trust-strip";
import type { FooterLink, FooterProps } from "../types";

const link = "w-fit text-muted-foreground transition-colors hover:text-foreground";

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2 text-sm">
      <p className="font-medium">{title}</p>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={link}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Four columns: brand + social, shop links, information links and the contact block; trust strip above, payment badges below. */
export function FooterMinimal({ storeName, logoUrl, tagline, shopLinks, infoLinks, contact, social, trustItems, payments, labels, localeSlot, year }: FooterProps) {
  return (
    <footer className="border-t">
      <TrustStrip items={trustItems} tone="line" />
      <div className="mx-auto grid max-w-7xl gap-10 px-gutter py-12 @phablet:grid-cols-2 @desktop:grid-cols-[1.4fr_1fr_1fr_1.3fr] @desktop:gap-8 @desktop:py-16">
        <div className="flex flex-col gap-4 @phablet:col-span-2 @desktop:col-span-1">
          <StoreLogo storeName={storeName} logoUrl={logoUrl} className="self-start" />
          {tagline && <p className="bidi-auto max-w-sm text-sm text-muted-foreground">{tagline}</p>}
          {social.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">{labels.followUs}</p>
              <SocialLinks links={social} variant="icon" className="-ms-2" />
            </div>
          )}
        </div>
        <Column title={labels.shop} links={shopLinks} />
        <Column title={labels.info} links={infoLinks} />
        <div className="flex flex-col gap-2 @phablet:col-span-2 @desktop:col-span-1">
          <p className="text-sm font-medium">{labels.contact}</p>
          <ContactBlock contact={contact} labels={labels} />
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-gutter py-5 text-xs text-muted-foreground @tablet:flex-row @tablet:items-center @tablet:justify-between">
          <span>
            <bdi dir="ltr">© {year} {storeName}.</bdi> {labels.rights}
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <PaymentBadges methods={payments} caption={labels.weAccept} />
            {localeSlot}
          </div>
        </div>
      </div>
    </footer>
  );
}
