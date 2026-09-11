"use client";

import { StatusBadge, type StatusKind } from "./status-badge";
import { useOptimisticRow } from "./optimistic-store";

/** `StatusBadge` that reflects a pending optimistic patch for its row id (`status` by default, `state` for deliveries). */
export function OptimisticStatusBadge({ id, kind, value, field = "status", className }: { id: string; kind: StatusKind; value: string; field?: string; className?: string }) {
  const row = useOptimisticRow(id, { [field]: value });
  return <StatusBadge kind={kind} value={String(row[field])} className={className} />;
}
