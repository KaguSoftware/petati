import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/storefront/auth/auth-card";
import { ForgotPasswordForm } from "@/components/storefront/auth/auth-forms";

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[locale]/s/[store]/forgot-password">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("resetPassword")}>
      <ForgotPasswordForm locale={locale} />
    </AuthCard>
  );
}
