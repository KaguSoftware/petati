import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Pagination({ page, pageSize, total, basePath, query, labels }: { page: number; pageSize: number; total: number; basePath: string; query: Record<string, string | undefined>; labels: { prev: string; next: string } }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) q.set(k, v);
    q.set("page", String(p));
    return `${basePath}?${q.toString()}`;
  };
  const cls = (disabled: boolean) => cn("rounded-md border px-3 py-1.5 text-sm", disabled ? "pointer-events-none opacity-40" : "hover:bg-muted");
  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
      <Link href={href(page - 1)} className={cls(page <= 1)} aria-disabled={page <= 1}>
        {labels.prev}
      </Link>
      <span className="text-muted-foreground">
        {page} / {pages}
      </span>
      <Link href={href(page + 1)} className={cls(page >= pages)} aria-disabled={page >= pages}>
        {labels.next}
      </Link>
    </nav>
  );
}
