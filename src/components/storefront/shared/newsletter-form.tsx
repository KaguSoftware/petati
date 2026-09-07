"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletterAction, type SimpleState } from "@/lib/account/actions";

export function NewsletterForm({ storeSlug }: { storeSlug: string }) {
  const t = useTranslations("footer");
  const [state, action, pending] = useActionState(subscribeNewsletterAction, {} as SimpleState);
  if (state.ok) return <p className="text-sm">{t("subscribed")}</p>;
  return (
    <form action={action} className="flex w-full max-w-md gap-2">
      <input type="hidden" name="storeSlug" value={storeSlug} />
      <Input name="email" type="email" required placeholder={t("emailPlaceholder")} aria-label={t("emailPlaceholder")} />
      <Button type="submit" disabled={pending}>
        {t("subscribe")}
      </Button>
    </form>
  );
}
