import { ADMIN_PAGE_SIZE } from "./constants";

export type SearchParams = Record<string, string | string[] | undefined>;

export interface ListParams<Sort extends string> {
  q: string;
  page: number;
  pageSize: number;
  sort: Sort;
  dir: "asc" | "desc";
  /** Supabase `.range()` bounds. */
  from: number;
  to: number;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Read `q`, `page`, `sort`, `dir` from a page's searchParams with safe defaults. */
export function parseListParams<Sort extends string>(
  sp: SearchParams,
  opts: { sorts: readonly Sort[]; defaultSort?: Sort; defaultDir?: "asc" | "desc"; pageSize?: number },
): ListParams<Sort> {
  const pageSize = opts.pageSize ?? ADMIN_PAGE_SIZE;
  const rawPage = Number(first(sp.page) ?? "1");
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;
  const rawSort = first(sp.sort);
  const sort = (opts.sorts as readonly string[]).includes(rawSort ?? "") ? (rawSort as Sort) : (opts.defaultSort ?? opts.sorts[0]);
  const rawDir = first(sp.dir);
  const dir = rawDir === "asc" || rawDir === "desc" ? rawDir : (opts.defaultDir ?? "desc");
  return { q: (first(sp.q) ?? "").trim().slice(0, 100), page, pageSize, sort, dir, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

/** One named filter value from searchParams, constrained to an allow-list. */
export function pickParam<T extends string>(sp: SearchParams, key: string, allowed: readonly T[]): T | undefined {
  const v = first(sp[key]);
  return (allowed as readonly string[]).includes(v ?? "") ? (v as T) : undefined;
}

export function stringParam(sp: SearchParams, key: string, max = 100): string | undefined {
  const v = first(sp[key])?.trim();
  return v ? v.slice(0, max) : undefined;
}

/** Query object for building links that preserve the current filters. */
export function currentQuery(sp: SearchParams, keys: string[]): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const k of keys) out[k] = first(sp[k]);
  return out;
}
