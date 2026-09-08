import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/** Settings became one tabbed page; keep the old deep-link working. */
export default async function Redirect({ params }: PageProps<"/[locale]/admin/settings/commerce">) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/admin/settings?tab=commerce`);
}
