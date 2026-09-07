import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/storefront/auth/auth-card";
import { SignUpForm } from "@/components/storefront/auth/auth-forms";

export default async function SignUpPage({
  params,
  searchParams,
}: PageProps<"/[locale]/s/[store]/sign-up">) {
  const { locale } = await params;
  const { next } = await searchParams;
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("signUp")}>
      <SignUpForm locale={locale} next={typeof next === "string" ? next : undefined} />
    </AuthCard>
  );
}
