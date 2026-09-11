"use client";

import { useSyncExternalStore } from "react";

/**
 * Breadcrumbs are derived from the pathname, which only knows ids. Detail pages register a human
 * label for their id segment here (order number, customer name, courier name) and the crumb strip
 * picks it up. Same tiny external-store shape as `optimistic-store`.
 */
const labels = new Map<string, string>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

export function setCrumbLabel(segment: string, label: string) {
  if (labels.get(segment) === label) return;
  labels.set(segment, label);
  emit();
}

export function clearCrumbLabel(segment: string) {
  if (!labels.has(segment)) return;
  labels.delete(segment);
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const getVersion = () => version;
// The server (and the hydration pass) never has labels: both render the plain segment.
const getServerVersion = () => 0;

export function useCrumbLabel(segment: string): string | undefined {
  useSyncExternalStore(subscribe, getVersion, getServerVersion);
  return labels.get(segment);
}
