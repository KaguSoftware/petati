"use client";

import { Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LatinInput } from "@/components/forms/latin-input";
import type { Locale } from "@/i18n/config";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/admin/products/actions";
import type { CategoryAdminRow, CategoryOption } from "@/lib/admin/products/types";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { FormField } from "../shared/form-field";
import { ImageUploader } from "../shared/image-uploader";
import { LocaleTabs } from "../shared/locale-tabs";
import { NumberInput } from "../shared/number-input";
import { useActionToast } from "../shared/use-action-toast";
import { slugify, useProductFieldErrors } from "./product-form";

interface Props {
  storeId: string;
  locale: Locale;
  defaultLocale: Locale;
  enabledLocales: Locale[];
  /** Existing category to edit; omit for "new". */
  category?: CategoryAdminRow;
  /** Candidate parents (the category itself is filtered out). */
  parents: CategoryOption[];
  trigger: React.ReactElement;
}

const NONE = "__none";

export function CategoryDialog({ storeId, locale, defaultLocale, enabledLocales, category, parents, trigger }: Props) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {open && (
          <CategoryForm
            storeId={storeId}
            locale={locale}
            defaultLocale={defaultLocale}
            enabledLocales={enabledLocales}
            category={category}
            parents={parents.filter((p) => p.id !== category?.id)}
            title={category ? t("categories.edit") : t("categories.new")}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ storeId, locale, defaultLocale, enabledLocales, category, parents, title, onDone }: Omit<Props, "trigger"> & { title: string; onDone: () => void }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionToast(saveCategoryAction, { errorNamespace: "admin.products", onSuccess: onDone });
  const errors = useProductFieldErrors(state.fieldErrors);
  const [translations, setTranslations] = useState<Partial<Record<Locale, { name: string; description: string }>>>(() =>
    Object.fromEntries(
      enabledLocales.map((l) => {
        const row = category?.translations.find((r) => r.locale === l);
        return [l, { name: row?.name ?? "", description: row?.description ?? "" }];
      }),
    ),
  );
  const [active, setActive] = useState<Locale>(enabledLocales.includes(locale) ? locale : defaultLocale);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    const wanted = state.fieldErrors?.translations as Locale | undefined;
    if (wanted && enabledLocales.includes(wanted)) setActive(wanted);
  }
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [parentId, setParentId] = useState(category?.parent_id ?? NONE);
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");

  const current = translations[active] ?? { name: "", description: "" };
  const missing = enabledLocales.filter((l) => !translations[l]?.name.trim());
  const parentItems = [{ value: NONE, label: t("categories.noParent") }, ...parents.map((p) => ({ value: p.id, label: p.name }))];
  const nameError = errors?.name && (state.fieldErrors?.translations ?? defaultLocale) === active ? { name: errors.name } : undefined;

  function patch(field: "name" | "description", value: string) {
    setTranslations((prev) => ({ ...prev, [active]: { ...(prev[active] ?? { name: "", description: "" }), [field]: value } }));
    if (field === "name" && active === defaultLocale && !slugTouched) setSlug(slugify(value));
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="categoryId" value={category?.id ?? ""} />
      <input type="hidden" name="translations" value={JSON.stringify(translations)} />
      <input type="hidden" name="parent_id" value={parentId === NONE ? "" : parentId} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{t("categories.dialogHint")}</DialogDescription>
      </DialogHeader>

      <LocaleTabs locales={enabledLocales} value={active} onValueChange={setActive} missing={missing} required={defaultLocale} />
      <div key={active} className="flex flex-col gap-4" lang={active} dir={active === "fa" ? "rtl" : "ltr"}>
        <FormField name="name" label={t("categories.name")} errors={nameError} required={active === defaultLocale}>
          <Input id="name" value={current.name} onChange={(e) => patch("name", e.target.value)} autoComplete="off" />
        </FormField>
        <FormField name="description" label={t("categories.description")}>
          <Textarea id="description" rows={2} value={current.description} onChange={(e) => patch("description", e.target.value)} />
        </FormField>
      </div>

      <FormField name="slug" label={t("categories.slug")} errors={errors} required>
        <LatinInput
          kind="code"
          id="slug"
          name="slug"
          value={slug}
          className="normal-case tracking-normal"
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="parent_id" label={t("categories.parent")} errors={errors}>
          <Select items={parentItems} value={parentId} onValueChange={(v) => v && setParentId(String(v))} modal={false}>
            <SelectTrigger id="parent_id" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {parentItems.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField name="sort_order" label={t("categories.sortOrder")} errors={errors}>
          <NumberInput id="sort_order" name="sort_order" defaultValue={category?.sort_order ?? 0} min={0} />
        </FormField>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("categories.image")}</span>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- storage host is user-configurable */}
              <img src={imageUrl} alt="" className="size-16 rounded-md border object-cover" />
              <Button type="button" variant="outline" size="icon-xs" className="absolute -end-2 -top-2 rounded-full" aria-label={t("common.remove")} onClick={() => setImageUrl("")}>
                <X />
              </Button>
            </span>
          ) : null}
          <ImageUploader storeId={storeId} folder="categories" onUploaded={(url) => setImageUrl(url)} label={imageUrl ? t("categories.replaceImage") : undefined} />
        </div>
      </div>

      <Label className="flex items-center justify-between gap-3">
        <span>{t("categories.active")}</span>
        <Switch name="is_active" defaultChecked={category?.is_active ?? true} />
      </Label>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : category ? t("common.save") : t("common.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Delete with confirmation; lives here so the server-rendered list can pass plain props. */
export function CategoryDeleteButton({ storeId, categoryId, productCount }: { storeId: string; categoryId: string; productCount: number }) {
  const t = useTranslations("admin");
  return (
    <ConfirmDialog
      trigger={
        <Button type="button" variant="ghost" size="icon-sm" aria-label={t("common.delete")} className="text-muted-foreground hover:text-destructive">
          <Trash2 />
        </Button>
      }
      title={t("categories.delete.title")}
      description={t("categories.delete.description", { count: productCount })}
      confirmLabel={t("common.delete")}
      destructive
      action={() => {
        const fd = new FormData();
        fd.set("storeId", storeId);
        fd.set("categoryId", categoryId);
        return deleteCategoryAction({}, fd);
      }}
    />
  );
}
