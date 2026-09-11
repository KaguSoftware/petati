"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LatinInput } from "@/components/forms/latin-input";
import { saveCourierAction } from "@/lib/admin/delivery/actions";
import { COURIER_VEHICLES } from "@/lib/admin/delivery/types";
import { FormField } from "../shared/form-field";
import { useActionToast } from "../shared/use-action-toast";

export interface CourierDraft {
  id?: string;
  name: string;
  phone: string | null;
  vehicle: string | null;
  note: string | null;
  is_active: boolean;
}

interface Props {
  storeId: string;
  courier?: CourierDraft;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Create or edit a courier. Controlled when editing a row, self-contained for "New courier". */
export function CourierDialog({ storeId, courier, open, onOpenChange }: Props) {
  const t = useTranslations("admin.delivery.couriers");
  const tc = useTranslations("admin.common");
  const tv = useTranslations("admin.delivery.vehicle");
  const [selfOpen, setSelfOpen] = useState(false);
  const isOpen = open ?? selfOpen;
  const setOpen = onOpenChange ?? setSelfOpen;
  const [vehicle, setVehicle] = useState(courier?.vehicle ?? "");
  const [state, action, pending] = useActionToast(saveCourierAction, { errorNamespace: "admin.delivery", onSuccess: () => setOpen(false) });

  const body = (
    <DialogContent>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="storeId" value={storeId} />
        {courier?.id && <input type="hidden" name="courierId" value={courier.id} />}
        {vehicle && <input type="hidden" name="vehicle" value={vehicle} />}
        <DialogHeader>
          <DialogTitle>{courier?.id ? courier.name : t("new")}</DialogTitle>
        </DialogHeader>

        <FormField name="name" label={t("name")} errors={state.fieldErrors} required>
          <Input id="name" name="name" required maxLength={120} defaultValue={courier?.name ?? ""} />
        </FormField>

        <FormField name="phone" label={t("phone")} errors={state.fieldErrors}>
          <LatinInput kind="tel" id="phone" name="phone" defaultValue={courier?.phone ?? ""} />
        </FormField>

        <div className="flex flex-col gap-2">
          <Label htmlFor="vehicle-trigger">{t("vehicle")}</Label>
          <Select value={vehicle} onValueChange={(v) => setVehicle(v ?? "")}>
            <SelectTrigger id="vehicle-trigger">
              <SelectValue>{vehicle ? tv(vehicle) : ""}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COURIER_VEHICLES.map((v) => (
                <SelectItem key={v} value={v}>
                  {tv(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField name="note" label={t("note")} errors={state.fieldErrors}>
          <Textarea id="note" name="note" rows={2} maxLength={300} defaultValue={courier?.note ?? ""} />
        </FormField>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="isActive" defaultChecked={courier?.is_active ?? true} />
          {t("active")}
        </label>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {tc("save")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (courier?.id) {
    return (
      <Dialog open={isOpen} onOpenChange={setOpen}>
        {body}
      </Dialog>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus data-icon="inline-start" />
        {t("new")}
      </DialogTrigger>
      {body}
    </Dialog>
  );
}
