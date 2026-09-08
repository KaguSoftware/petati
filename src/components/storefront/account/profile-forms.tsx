"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LatinInput } from "@/components/forms/latin-input";
import { updatePasswordAction, updateProfileAction, type SimpleState } from "@/lib/account/actions";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(updateProfileAction, {} as SimpleState);
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="full_name">{t("name")}</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="profile-email">{t("email")}</Label>
        <LatinInput kind="email" id="profile-email" value={email} disabled />
      </div>
      {state.ok && <p className="text-sm text-muted-foreground">{t("saved")}</p>}
      {state.error && <p className="text-sm text-destructive">{tc("error")}</p>}
      <Button type="submit" disabled={pending} className="self-start">{tc("save")}</Button>
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(updatePasswordAction, {} as SimpleState);
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <LatinInput kind="password" id="password" name="password" minLength={8} required autoComplete="new-password" />
      </div>
      {state.ok && <p className="text-sm text-muted-foreground">{t("saved")}</p>}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">{tc("save")}</Button>
    </form>
  );
}
