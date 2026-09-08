import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/storefront/auth/auth-card";
import { SignUpForm } from "@/components/storefront/auth/auth-forms";

type Props = PageProps<"/[locale]/s/[store]/sign-up">;

export default async function SignUpPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("signUp")}>
      {/* searchParams is runtime data: read it inside Suspense so the shell still prerenders. */}
      <Suspense>
        <Form locale={locale} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Form({ locale, searchParams }: { locale: string; searchParams: Props["searchParams"] }) {
  const { next } = await searchParams;
  return <SignUpForm locale={locale} next={typeof next === "string" ? next : undefined} />;
}
