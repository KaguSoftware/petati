import { PageHeaderSkeleton, TableSkeleton } from "@/components/admin/shared/table-skeleton";

export default function AdminLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <TableSkeleton />
    </>
  );
}
