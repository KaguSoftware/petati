import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Brand slot: logo image when the store has one, otherwise a monogram tile + wordmark.
 * SCOPE(branding): the client's logo and colours arrive later; `logo_url` is set from admin → Design.
 * GROWS LATER → SVG logo with light/dark variants.
 */
export function StoreLogo({ storeName, logoUrl, className }: { storeName: string; logoUrl: string | null; className?: string }) {
  const initial = storeName.trim().charAt(0).toUpperCase() || "•";
  return (
    <Link href="/" aria-label={storeName} className={cn("flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt="" width={36} height={36} className="size-9 shrink-0 rounded-lg object-contain" />
      ) : (
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
          {initial}
        </span>
      )}
      <span className="truncate text-lg font-semibold tracking-tight">{storeName}</span>
    </Link>
  );
}
