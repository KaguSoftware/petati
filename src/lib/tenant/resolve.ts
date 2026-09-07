/**
 * Pure tenant resolution: which store does a request belong to?
 *
 * Order of precedence (all supported by the same codebase):
 *  1. custom domain     shop.example.com          → store_domains lookup (done by caller)
 *  2. subdomain         petshop.<ROOT_DOMAIN>     → slug "petshop"
 *  3. path prefix       /<locale>/s/<slug>/...    → slug from path (dev + fallback mode)
 *  4. default           <ROOT_DOMAIN> or unknown  → DEFAULT_STORE_SLUG
 *
 * SCOPE(multi-store, unpaid): today only the default store exists, so every request resolves to
 * it. GROWS LATER → owner creates stores; subdomains/domains start resolving automatically.
 */

export const RESERVED_SUBDOMAINS = new Set(["www", "admin", "api", "app", "mail", "static"]);

export type TenantHint =
  | { kind: "custom-domain"; hostname: string }
  | { kind: "subdomain"; slug: string }
  | { kind: "default" };

function stripPort(host: string): string {
  return host.split(":")[0];
}

/** Decide, from the Host header alone, how to look the tenant up. */
export function tenantHintFromHost(hostHeader: string | null, rootDomain: string): TenantHint {
  if (!hostHeader) return { kind: "default" };
  const host = stripPort(hostHeader.toLowerCase());
  const root = stripPort(rootDomain.toLowerCase());

  if (host === root) return { kind: "default" };

  // Vercel preview URLs and localhost variants never carry a tenant subdomain.
  if (host.endsWith(".vercel.app")) return { kind: "default" };

  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1));
    if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return { kind: "default" };
    return { kind: "subdomain", slug: sub };
  }

  // e.g. petshop.localhost while ROOT_DOMAIN=localhost:3000 is handled above; anything else is a
  // custom domain candidate.
  return { kind: "custom-domain", hostname: host };
}

/** Extract a path-mode store slug: "/en/s/petshop/products" → { slug: "petshop", rest: "/products" } */
export function storeFromPath(pathAfterLocale: string): { slug: string; rest: string } | null {
  const m = /^\/s\/([a-z0-9-]+)(\/.*)?$/i.exec(pathAfterLocale);
  if (!m) return null;
  return { slug: m[1].toLowerCase(), rest: m[2] ?? "/" };
}
