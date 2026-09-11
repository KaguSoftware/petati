"use client";

import { useActionState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startRunAction, type CourierActionState } from "@/lib/courier/actions";

/** One tap at the depot: every stop assigned for today goes out, and its order is marked shipped. */
export function StartRunButton({ token, label }: { token: string; label: string }) {
  const [, action, pending] = useActionState(startRunAction, {} as CourierActionState);
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        <Truck data-icon="inline-start" />
        {label}
      </Button>
    </form>
  );
}
