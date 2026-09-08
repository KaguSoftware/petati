import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/storefront/auth/auth-card";
import { SignInForm } from "@/components/storefront/auth/auth-forms";

type Props = PageProps<"/[locale]/s/[store]/sign-in">;

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("signIn")}>
      {/* searchParams is runtime data: read it inside Suspense so the shell still prerenders. */}
      <Suspense>
        <Form locale={locale} searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Form({ locale, searchParams }: { locale: string; searchParams: Props["searchParams"] }) {
  const { next } = await searchParams;
  return <SignInForm locale={locale} next={typeof next === "string" ? next : undefined} />;
}
