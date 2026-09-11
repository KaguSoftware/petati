import type { EffectiveRole } from "@/lib/db/types";

/**
 * THE permission matrix. Server actions and admin layouts check here before doing anything with
 * the service-role client. Mirror of the SQL helpers in supabase/migrations/*_platform.sql.
 *
 *  owner   → platform-wide super admin (all stores, billing, create store)
 *  manager → everything inside one store
 *  staff   → orders + stock only
 */
export const PERMISSIONS = {
  "store.create": ["owner"],
  "store.delete": ["owner"],
  "store.settings": ["owner", "manager"],
  "store.design": ["owner", "manager"],
  "store.domains": ["owner"],
  "staff.manage": ["owner", "manager"],
  "products.read": ["owner", "manager", "staff"],
  "products.write": ["owner", "manager"],
  "inventory.read": ["owner", "manager", "staff"],
  "inventory.adjust": ["owner", "manager", "staff"],
  "orders.read": ["owner", "manager", "staff"],
  "orders.update": ["owner", "manager", "staff"],
  "orders.refund": ["owner", "manager"],
  "delivery.read": ["owner", "manager", "staff"],
  "delivery.assign": ["owner", "manager", "staff"],
  // Couriers and their links are an access-control surface; settling cash moves money.
  "delivery.manage": ["owner", "manager"],
  "delivery.cash": ["owner", "manager"],
  "customers.read": ["owner", "manager", "staff"],
  "customers.write": ["owner", "manager"],
  "coupons.manage": ["owner", "manager"],
  "reviews.moderate": ["owner", "manager"],
  "finance.read": ["owner", "manager"],
  "finance.write": ["owner", "manager"],
  "finance.export": ["owner", "manager"],
} as const satisfies Record<string, readonly EffectiveRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: EffectiveRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly EffectiveRole[]).includes(role);
}

/** Admin navigation, filtered by permission at render time. */
export interface AdminNavItem {
  key: string;
  href: string;
  permission: Permission;
  icon: string;
  /** Hidden unless the matching feature flag is on (checked server-side). */
  gate?: "multiStore";
}

export const ADMIN_NAV: AdminNavItem[] = [
  { key: "dashboard", href: "/admin", permission: "orders.read", icon: "LayoutDashboard" },
  { key: "orders", href: "/admin/orders", permission: "orders.read", icon: "ShoppingBag" },
  { key: "delivery", href: "/admin/delivery", permission: "delivery.read", icon: "Truck" },
  { key: "products", href: "/admin/products", permission: "products.read", icon: "Package" },
  { key: "inventory", href: "/admin/inventory", permission: "inventory.read", icon: "Boxes" },
  { key: "customers", href: "/admin/customers", permission: "customers.read", icon: "Users" },
  { key: "coupons", href: "/admin/coupons", permission: "coupons.manage", icon: "Ticket" },
  { key: "reviews", href: "/admin/reviews", permission: "reviews.moderate", icon: "Star" },
  { key: "finance", href: "/admin/finance", permission: "finance.read", icon: "Wallet" },
  { key: "design", href: "/admin/design", permission: "store.design", icon: "Palette" },
  { key: "staff", href: "/admin/staff", permission: "staff.manage", icon: "UserCog" },
  { key: "settings", href: "/admin/settings", permission: "store.settings", icon: "Settings" },
  // Owner-only by permission; shown only when the admin context says multiStore.
  { key: "stores", href: "/admin/stores", permission: "store.create", icon: "Store", gate: "multiStore" },
];
