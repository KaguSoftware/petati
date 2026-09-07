import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser, getRoleForStore, getAdminStoreIds } from "@/lib/auth/session";
import { listStores } from "@/lib/tenant/store";
import { features } from "@/lib/env";
import { AdminShell } from "@/components/admin/admin-shell";

export const ADMIN_STORE_COOKIE = "admin_store";

/**
 * Admin root: authenticated, resolves the "active store" (cookie → first accessible store) and the
 * user's effective role on it. Managers/staff without any store get a forbidden screen.
 */
export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  const user = await requireUser(locale, `/${locale}/admin`);

  const accessible = await getAdminStoreIds();
  const allStores = await listStores();
  const stores = accessible === "all" ? allStores : allStores.filter((s) => accessible.includes(s.id));

  const t = await getTranslations("admin");
  if (stores.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
        {t("forbidden")}
      </main>
    );
  }

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ADMIN_STORE_COOKIE)?.value;
  const active = stores.find((s) => s.id === wanted) ?? stores[0];
  const role = await getRoleForStore(active.id);
  if (!role) redirect(`/${locale}`);

  // SCOPE(multi-store, unpaid): the switcher only exists when the flag is on AND user is owner.
  const showSwitcher = features.multiStore() && role === "owner";

  return (
    <AdminShell
      locale={locale}
      user={{ name: user.profile.full_name ?? user.email ?? "", email: user.email ?? "" }}
      role={role}
      store={{ id: active.id, name: active.name, slug: active.slug, currency: active.currency }}
      stores={showSwitcher ? stores.map((s) => ({ id: s.id, name: s.name })) : []}
    >
      {children}
    </AdminShell>
  );
}
