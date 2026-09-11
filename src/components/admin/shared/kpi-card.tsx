import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "danger";
  /** When set the whole card is a link — a number you can click is a number you can act on. */
  href?: string;
  className?: string;
}

export function KpiCard({ label, value, hint, icon: Icon, tone = "default", href, className }: Props) {
  const classes = cn(
    "flex flex-col gap-2 rounded-xl border bg-card p-4",
    tone === "warning" && "border-amber-500/40",
    tone === "danger" && "border-destructive/40",
    href && "transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50",
    className,
  );
  const body = (
    <>
      <div className="flex items-start justify-between gap-2 text-sm leading-tight text-muted-foreground">
        <span className="line-clamp-2">{label}</span>
        {Icon && <Icon className="size-4 shrink-0" />}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        {href && <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground/60 rtl:-scale-x-100" />}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}
