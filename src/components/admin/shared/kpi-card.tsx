import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "danger";
  href?: string;
  className?: string;
}

export function KpiCard({ label, value, hint, icon: Icon, tone = "default", className }: Props) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border bg-card p-4", tone === "warning" && "border-amber-500/40", tone === "danger" && "border-destructive/40", className)}>
      <div className="flex items-start justify-between gap-2 text-sm leading-tight text-muted-foreground">
        <span className="line-clamp-2">{label}</span>
        {Icon && <Icon className="size-4 shrink-0" />}
      </div>
      <div className="truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
