import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/** Password-reset emails land here; the profile page hosts the form. */
export default async function PasswordRedirect({ params }: PageProps<"/[locale]/s/[store]/account/password">) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/account/profile`);
}
