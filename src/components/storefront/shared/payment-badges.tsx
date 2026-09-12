import type { PaymentMethod } from "@/lib/theme/footer";
import { cn } from "@/lib/utils";

interface Props {
  methods: { id: PaymentMethod; label: string }[];
  /** Small caption in front of the badges ("We accept"). */
  caption?: string;
  tone?: "light" | "dark";
  className?: string;
}

/** Mastercard's two circles, drawn in currentColor so it matches every tone. */
function Mastercard() {
  return (
    <svg viewBox="0 0 24 16" aria-hidden className="h-3.5 w-auto">
      <circle cx="9" cy="8" r="6.5" fill="currentColor" opacity="0.9" />
      <circle cx="15" cy="8" r="6.5" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

const WORDMARK: Partial<Record<PaymentMethod, string>> = { visa: "VISA", troy: "troy", iyzico: "iyzico" };

/** Accepted payment methods as small monochrome pills (no external assets). */
export function PaymentBadges({ methods, caption, tone = "light", className }: Props) {
  if (methods.length === 0) return null;
  const pill = cn(
    "inline-flex h-6 items-center gap-1 rounded border px-1.5 text-micro font-bold uppercase tracking-wide whitespace-nowrap",
    tone === "dark" ? "border-background/30 text-background/80" : "border-border text-muted-foreground",
  );
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {caption && <span className={cn("text-xs", tone === "dark" ? "text-background/60" : "text-muted-foreground")}>{caption}</span>}
      <ul dir="ltr" className="flex flex-wrap items-center gap-1.5">
        {methods.map((m) => (
          <li key={m.id} className={pill} title={m.label} aria-label={m.label}>
            {m.id === "mastercard" ? <Mastercard /> : <span className={cn(WORDMARK[m.id] && "italic tracking-tight")}>{WORDMARK[m.id] ?? m.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
