"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LatinInput } from "@/components/forms/latin-input";
import { PhoneField } from "@/components/forms/phone-field";
import { Link } from "@/i18n/navigation";
import {
  requestPasswordResetAction,
  signInAction,
  signInWithGoogleAction,
  signUpAction,
  type AuthState,
} from "@/lib/auth/actions";
import { defaultCountryForLocale } from "@/lib/phone/countries";

const initial: AuthState = {};

function Feedback({ state }: { state: AuthState }) {
  const t = useTranslations();
  if (state.error) {
    const text = state.error === "invalid" ? t("common.error") : t.has(`auth.errors.${state.error}`) ? t(`auth.errors.${state.error}`) : state.error;
    return (
      <p role="alert" className="text-sm text-destructive">
        {text}
      </p>
    );
  }
  if (state.message) return <p className="text-sm text-muted-foreground">{t(`auth.${state.message}`)}</p>;
  return null;
}

export function SignInForm({ locale, next }: { locale: string; next?: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(signInAction, initial);
  const google = signInWithGoogleAction.bind(null, locale, next);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <div className="grid gap-2">
          <Label htmlFor="email">{t("email")}</Label>
          <LatinInput kind="email" id="email" name="email" autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
          <LatinInput kind="password" id="password" name="password" autoComplete="current-password" required minLength={8} />
        </div>
        <Feedback state={state} />
        <Button type="submit" disabled={pending}>
          {t("signIn")}
        </Button>
      </form>
      <form action={google}>
        <Button type="submit" variant="outline" className="w-full">
          {t("continueWithGoogle")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"} className="text-foreground underline underline-offset-4">
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm({ locale, next }: { locale: string; next?: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(signUpAction, initial);
  const phoneError = state.fieldErrors?.phone;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <div className="grid gap-2">
          <Label htmlFor="full_name">{t("checkout.fullName")}</Label>
          <Input id="full_name" name="full_name" autoComplete="name" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <LatinInput kind="email" id="email" name="email" autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone-number">{t("auth.phone")}</Label>
          <PhoneField defaultCountry={defaultCountryForLocale(locale)} error={phoneError ? t(`auth.errors.${phoneError}`) : undefined} />
          <p className="text-xs text-muted-foreground">{t("auth.phoneHint")}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <LatinInput kind="password" id="password" name="password" autoComplete="new-password" required minLength={8} />
        </div>
        {!phoneError && <Feedback state={state} />}
        <Button type="submit" disabled={pending}>
          {t("auth.signUp")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link href="/sign-in" className="text-foreground underline underline-offset-4">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <LatinInput kind="email" id="email" name="email" autoComplete="email" required />
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {t("resetPassword")}
      </Button>
    </form>
  );
}
