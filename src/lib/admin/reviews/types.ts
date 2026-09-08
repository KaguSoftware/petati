import type { ReviewRow, ReviewStatus } from "@/lib/db/types";

export const REVIEW_STATUSES: readonly ReviewStatus[] = ["pending", "approved", "rejected"];

export interface ReviewListRow extends ReviewRow {
  product_name: string;
  product_slug: string | null;
  /** profiles.full_name → customers.full_name → null. */
  author_name: string | null;
  /** profiles.email → customers.email → null. */
  author_email: string | null;
}
