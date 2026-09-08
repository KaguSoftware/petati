"use client";

import { StatusBadge, type StatusKind } from "./status-badge";
import { useOptimisticRow } from "./optimistic-store";

/** `StatusBadge` that reflects a pending optimistic `status` patch for its row id. */
export function OptimisticStatusBadge({ id, kind, value, className }: { id: string; kind: StatusKind; value: string; className?: string }) {
  const row = useOptimisticRow(id, { status: value });
  return <StatusBadge kind={kind} value={row.status} className={className} />;
}
