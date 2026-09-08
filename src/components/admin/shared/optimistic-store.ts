"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny cross-cell optimistic store for server-rendered tables.
 *
 * Row action menus live in one cell and the status badge in another, so a plain `useOptimistic`
 * cannot reach across. Actions call `setOptimistic(id, patch)` before firing; subscribers
 * (`useOptimisticRow`) render the patch until the server refresh hands them matching props, at
 * which point the entry is cleared. On failure the action calls `clearOptimistic(id)` to roll back.
 */
type Patch = Record<string, unknown>;
const entries = new Map<string, Patch>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

export function setOptimistic(id: string, patch: Patch) {
  entries.set(id, { ...(entries.get(id) ?? {}), ...patch });
  emit();
}

export function clearOptimistic(id: string, keys?: string[]) {
  const cur = entries.get(id);
  if (!cur) return;
  if (!keys) entries.delete(id);
  else {
    for (const k of keys) delete cur[k];
    if (Object.keys(cur).length === 0) entries.delete(id);
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const getVersion = () => version;
const getServerVersion = () => 0;

/**
 * Returns `server` overlaid with any pending optimistic patch. Once the server value catches up
 * with the patch (the refresh landed), the patch is dropped so later server changes win again.
 */
export function useOptimisticRow<T extends Patch>(id: string, server: T): T {
  useSyncExternalStore(subscribe, getVersion, getServerVersion);
  const patch = entries.get(id);
  if (!patch) return server;
  const settled = Object.keys(patch).filter((k) => patch[k] === server[k]);
  if (settled.length) {
    // Reconciled by the server: drop those keys (outside render's own state, so no re-render loop).
    queueMicrotask(() => clearOptimistic(id, settled));
  }
  return { ...server, ...patch };
}
