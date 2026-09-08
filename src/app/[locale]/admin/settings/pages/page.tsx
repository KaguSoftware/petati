import { redirect } from "next/navigation";

/** Settings became one tabbed page; keep the old deep-link working. */
export default async function Redirect({ params }: PageProps<"/[locale]/admin/settings/pages">) {
  const { locale } = await params;
  redirect(`/${locale}/admin/settings?tab=pages`);
}
