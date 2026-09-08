import { getTranslations } from "next-intl/server";
import { adminContext } from "@/lib/admin/context";
import { AdminShell } from "./admin-shell";

/**
 * Resolves session, store and role (cookies → dynamic) and wraps children in the shell.
 * Rendered inside the admin layout's <Suspense> so the static shell can prerender.
 */
export async function AdminFrame({ locale, children }: { locale: string; children: React.ReactNode }) {
  const ctx = await adminContext(locale);
  if (!ctx.ok) {
    const t = await getTranslations("admin");
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center text-muted-foreground">
        {t("forbidden")}
      </main>
    );
  }
  const { user, role, store, stores, multiStore } = ctx;
  return (
    <AdminShell
      locale={locale}
      user={{ name: user.profile.full_name ?? "", email: user.email ?? "", avatarUrl: user.profile.avatar_url }}
      role={role}
      store={{ id: store.id, name: store.name, slug: store.slug, currency: store.currency }}
      stores={multiStore ? stores.map((s) => ({ id: s.id, name: s.name })) : []}
      multiStore={multiStore}
    >
      {children}
    </AdminShell>
  );
}
