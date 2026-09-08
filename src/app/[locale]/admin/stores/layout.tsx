import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireMultiStore } from "@/lib/admin/stores/guard";

/**
 * SCOPE(multi-store, unpaid): the whole /admin/stores subtree 404s unless FEATURE_MULTI_STORE is
 * on AND the user is a platform owner. GROWS LATER → drop the flag once the client pays.
 */
export default async function StoresLayout({ children, params }: LayoutProps<"/[locale]/admin/stores">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  let allowed = false;
  try {
    await requireMultiStore("store.create");
    allowed = true;
  } catch {
    allowed = false;
  }
  if (!allowed) notFound();
  return <>{children}</>;
}
