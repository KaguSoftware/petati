"use client";

import { useSyncExternalStore } from "react";

/**
 * Row selection for server-rendered tables, built like `optimistic-store`: the checkbox cell, the
 * header checkbox and the bulk bar are three different subtrees of a server component, so plain
 * React state cannot reach across them.
 *
 * Selections are kept per SCOPE. The orders list renders page 1 of every status bucket at once
 * (`TabbedPanels` only hides the inactive ones), so each bucket owns its own scope and the eight
 * mounted tables never fight over one selection.
 */
const scopes = new Map<string, Set<string>>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const getVersion = () => version;
const getServerVersion = () => 0;

const EMPTY: ReadonlySet<string> = new Set();

export function toggleSelected(scope: string, id: string) {
  const set = scopes.get(scope) ?? new Set<string>();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  if (set.size === 0) scopes.delete(scope);
  else scopes.set(scope, set);
  emit();
}

/** Header checkbox: select every id on the page, or clear them all. */
export function setSelected(scope: string, ids: string[], selected: boolean) {
  if (!selected) {
    scopes.delete(scope);
  } else {
    scopes.set(scope, new Set(ids));
  }
  emit();
}

export function clearSelection(scope: string) {
  if (!scopes.has(scope)) return;
  scopes.delete(scope);
  emit();
}

export function useSelection(scope: string): ReadonlySet<string> {
  useSyncExternalStore(subscribe, getVersion, getServerVersion);
  return scopes.get(scope) ?? EMPTY;
}

export function useIsSelected(scope: string, id: string): boolean {
  useSyncExternalStore(subscribe, getVersion, getServerVersion);
  return scopes.get(scope)?.has(id) ?? false;
}
