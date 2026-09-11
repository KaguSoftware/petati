import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusKind = "order" | "delivery" | "payment" | "product" | "review" | "stock" | "coupon" | "store";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<StatusKind, Record<string, Tone>> = {
  order: { pending_payment: "warning", paid: "info", processing: "info", shipped: "info", delivered: "success", cancelled: "neutral", refunded: "danger" },
  delivery: { pending: "neutral", assigned: "info", out_for_delivery: "info", delivered: "success", failed: "danger", returned: "warning", cancelled: "neutral" },
  payment: { pending: "warning", authorized: "info", paid: "success", failed: "danger", refunded: "danger", partially_refunded: "warning" },
  product: { draft: "neutral", active: "success", archived: "neutral" },
  review: { pending: "warning", approved: "success", rejected: "neutral" },
  stock: { ok: "success", low: "warning", out: "danger" },
  coupon: { active: "success", inactive: "neutral", expired: "neutral" },
  store: { active: "success", inactive: "neutral" },
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-transparent bg-muted text-muted-foreground",
  info: "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-300",
  success: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
  danger: "border-transparent bg-destructive/10 text-destructive",
};

/** Translated, colour-coded status pill. Labels live under `admin.status.<kind>.<value>`. */
export function StatusBadge({ kind, value, className }: { kind: StatusKind; value: string; className?: string }) {
  const t = useTranslations(`admin.status.${kind}`);
  const tone = TONES[kind][value] ?? "neutral";
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", TONE_CLASS[tone], className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {t.has(value) ? t(value) : value}
    </Badge>
  );
}
