import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query: Record<string, string | undefined>;
  labels: { prev: string; next: string; summary?: string };
  className?: string;
}

/** Prev / next pagination that preserves the current query. Used by the storefront and admin. */
export function Pagination({ page, pageSize, total, basePath, query, labels, className }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) q.set(k, v);
    q.set("page", String(p));
    return `${basePath}?${q.toString()}`;
  };
  const cls = (disabled: boolean) => cn(buttonVariants({ variant: "outline", size: "sm" }), disabled && "pointer-events-none opacity-40");
  return (
    <nav className={cn("flex items-center justify-center gap-3 text-sm", className)}>
      <Link href={href(page - 1)} className={cls(page <= 1)} aria-disabled={page <= 1}>
        <ChevronLeft className="rtl:-scale-x-100" />
        {labels.prev}
      </Link>
      <span className="text-muted-foreground tabular-nums">{labels.summary ?? `${page} / ${pages}`}</span>
      <Link href={href(page + 1)} className={cls(page >= pages)} aria-disabled={page >= pages}>
        {labels.next}
        <ChevronRight className="rtl:-scale-x-100" />
      </Link>
    </nav>
  );
}
