import { PageShell } from "@/components/storefront/shared/page-shell";
import { ResultsSkeleton } from "@/components/storefront/shared/skeletons";

export default function Loading() {
  return (
    <PageShell>
      <ResultsSkeleton />
    </PageShell>
  );
}
