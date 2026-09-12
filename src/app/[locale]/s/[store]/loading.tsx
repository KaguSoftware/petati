import { PageSkeleton } from "@/components/storefront/shared/skeletons";

/** Route-transition fallback for every storefront page without a more specific one. */
export default function Loading() {
  return <PageSkeleton />;
}
