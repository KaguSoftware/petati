import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Props {
  label: React.ReactNode;
  sortKey: string;
  current: { sort: string; dir: "asc" | "desc" };
  basePath: string;
  query: Record<string, string | undefined>;
  className?: string;
}

/** Column header link that toggles `sort` / `dir` while preserving the other filters. */
export function SortHeader({ label, sortKey, current, basePath, query, className }: Props) {
  const active = current.sort === sortKey;
  const nextDir = active && current.dir === "desc" ? "asc" : "desc";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) q.set(k, v);
  q.set("sort", sortKey);
  q.set("dir", nextDir);
  q.delete("page");
  const Icon = active ? (current.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link href={`${basePath}?${q.toString()}`} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground", className)}>
      {label}
      <Icon className="size-3.5" />
    </Link>
  );
}
