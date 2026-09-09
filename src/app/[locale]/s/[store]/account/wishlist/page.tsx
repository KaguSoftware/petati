import { setRequestLocale } from "next-intl/server";

/** Deep-link target only: the account layout renders every section and switches locally. */
export default async function AccountSectionPage({ params }: PageProps<"/[locale]/s/[store]/account/wishlist">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return null;
}
