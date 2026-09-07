import { redirect } from "next/navigation";

/** Password-reset emails land here; the profile page hosts the form. */
export default async function PasswordRedirect({ params }: PageProps<"/[locale]/s/[store]/account/password">) {
  const { locale } = await params;
  redirect(`/${locale}/account/profile`);
}
