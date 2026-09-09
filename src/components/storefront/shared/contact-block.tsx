import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  contact: { email: string | null; phone: string | null; address: string | null; hours: string | null };
  labels: { address: string; hours: string };
  /** `dark` = on the bold footer's dark band. */
  tone?: "default" | "dark";
  className?: string;
  /** Extra classes for the phone link (the bold footer shows it large). */
  phoneClassName?: string;
}

/** Address, phone, email and opening hours as icon rows; only the parts the store has. */
export function ContactBlock({ contact, labels, tone = "default", className, phoneClassName }: Props) {
  const muted = tone === "dark" ? "text-background/70" : "text-muted-foreground";
  const hover = tone === "dark" ? "hover:text-background" : "hover:text-foreground";
  const icon = cn("mt-0.5 size-4 shrink-0", tone === "dark" ? "text-accent" : "text-primary");
  const rows = [
    contact.phone && (
      <a key="phone" href={`tel:${contact.phone.replace(/\s/g, "")}`} className={cn("flex items-start gap-2.5 transition-colors", muted, hover, phoneClassName)}>
        <Phone aria-hidden className={icon} />
        <bdi dir="ltr">{contact.phone}</bdi>
      </a>
    ),
    contact.email && (
      <a key="email" href={`mailto:${contact.email}`} className={cn("flex items-start gap-2.5 break-all transition-colors", muted, hover)}>
        <Mail aria-hidden className={icon} />
        <bdi dir="ltr">{contact.email}</bdi>
      </a>
    ),
    contact.address && (
      <p key="address" className={cn("flex items-start gap-2.5", muted)}>
        <MapPin aria-hidden className={icon} />
        <span className="sr-only">{labels.address}: </span>
        <span className="bidi-auto whitespace-pre-line">{contact.address}</span>
      </p>
    ),
    contact.hours && (
      <p key="hours" className={cn("flex items-start gap-2.5", muted)}>
        <Clock aria-hidden className={icon} />
        <span className="sr-only">{labels.hours}: </span>
        <span className="bidi-auto whitespace-pre-line">{contact.hours}</span>
      </p>
    ),
  ].filter(Boolean);
  if (rows.length === 0) return null;
  return <div className={cn("flex flex-col gap-2.5 text-sm", className)}>{rows}</div>;
}
