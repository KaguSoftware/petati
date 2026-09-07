"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);

  const dbDown = /ECONNREFUSED|fetch failed/i.test(error.message);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-2xl font-semibold">{t("error")}</p>
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
          {error.digest && <p className="mt-2 text-xs text-muted-foreground">digest {error.digest}</p>}
        </div>
      )}
      <Button onClick={reset} variant="outline">
        {t("back")}
      </Button>
    </main>
  );
}
