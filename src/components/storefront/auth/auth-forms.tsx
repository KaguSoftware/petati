"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  requestPasswordResetAction,
  signInAction,
  signInWithGoogleAction,
  signUpAction,
  type AuthState,
} from "@/lib/auth/actions";

const initial: AuthState = {};

function Feedback({ state }: { state: AuthState }) {
  const t = useTranslations();
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error === "invalid" ? t("common.error") : state.error}
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
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
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
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </div>
        <Feedback state={state} />
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
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {t("resetPassword")}
      </Button>
    </form>
  );
}
