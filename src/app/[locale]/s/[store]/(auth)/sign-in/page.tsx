import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/storefront/auth/auth-card";
import { SignInForm } from "@/components/storefront/auth/auth-forms";

export default async function SignInPage({
  params,
  searchParams,
}: PageProps<"/[locale]/s/[store]/sign-in">) {
  const { locale } = await params;
  const { next } = await searchParams;
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("signIn")}>
      <SignInForm locale={locale} next={typeof next === "string" ? next : undefined} />
    </AuthCard>
  );
}
