import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type EntityKind = "order" | "customer" | "courier" | "product" | "run";

const HREF: Record<EntityKind, (id: string) => string> = {
  order: (id) => `/admin/orders/${id}`,
  customer: (id) => `/admin/customers/${id}`,
  courier: (id) => `/admin/delivery/couriers/${id}`,
  product: (id) => `/admin/products/${id}`,
  run: (id) => `/admin/delivery/runs/${id}`,
};

interface Props {
  kind: EntityKind;
  id: string;
  label: React.ReactNode;
  /** Extra query string, e.g. `d=2026-09-11` for a run on a given day. */
  query?: string;
  muted?: boolean;
  className?: string;
}

/**
 * One look for every cross-reference in the admin: an order number, a customer, a courier, a
 * product or a courier's run. Every entity name that appears anywhere should be one of these, so
 * the admin reads as a network instead of a set of pages.
 */
export function EntityLink({ kind, id, label, query, muted, className }: Props) {
  const href = query ? `${HREF[kind](id)}?${query}` : HREF[kind](id);
  return (
    <Link
      href={href}
      dir={kind === "order" ? "ltr" : undefined}
      className={cn(
        "truncate underline-offset-4 hover:underline",
        kind === "order" && "font-medium tabular-nums",
        muted ? "text-muted-foreground hover:text-foreground" : "font-medium",
        className,
      )}
    >
      {label}
    </Link>
  );
}
