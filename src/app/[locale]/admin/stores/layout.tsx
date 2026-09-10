import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireMultiStore } from "@/lib/admin/stores/guard";

/** The whole /admin/stores subtree 404s unless the user is a platform owner. */
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
