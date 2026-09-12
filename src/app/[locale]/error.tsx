"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * Root error boundary. Everything under [locale] that has no closer boundary lands here — which
 * includes a storefront or admin LAYOUT failing, since a layout's own error.tsx sits inside it.
 * In practice that means "the database was unreachable" arrives here too.
 *
 * Next redacts server error messages in production on purpose, so this cannot name the cause there.
 * What it can do is stop being a dead end: say the one thing the visitor can actually check
 * (their own connection), offer a way out rather than only a retry, and surface the digest, which
 * is the id to search for in the hosting logs.
 */
function subscribeToConnection(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  // Subscribed rather than sampled once, so plugging the network back in updates the message.
  // The server snapshot is `true`: assume online until the browser says otherwise.
  const online = useSyncExternalStore(subscribeToConnection, () => navigator.onLine, () => true);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);

  const dbDown = /ECONNREFUSED|fetch failed/i.test(error.message);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t("error")}</h1>
      <p className="max-w-sm text-muted-foreground">{online ? t("errorBody") : t("errorOffline")}</p>

      {process.env.NODE_ENV === "development" && (
        <div className="max-w-xl rounded-md border bg-muted/50 p-4 text-start text-sm">
          {dbDown ? (
            <>
              <p className="font-medium">Supabase is not reachable.</p>
              <p className="mt-1 text-muted-foreground">
                Start the local stack (needs Docker Desktop): <code>npx supabase start</code>, then{" "}
                <code>npx supabase db reset</code> and copy the keys from <code>npx supabase status</code> into{" "}
                <code>.env.local</code>. No-database UI preview: <code>/en/preview/minimal</code>.
              </p>
            </>
          ) : (
            <pre className="whitespace-pre-wrap text-xs">{error.message}</pre>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>{t("retry")}</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("backHome")}
        </Link>
      </div>

      {/* The id to quote in a bug report and to search the hosting logs with. */}
      {error.digest && (
        <p className="text-caption text-muted-foreground">
          {t("errorRef")} <code dir="ltr">{error.digest}</code>
        </p>
      )}
    </main>
  );
}
