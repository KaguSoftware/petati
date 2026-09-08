"use client";

import { ArrowDown, ArrowUp, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localeNames, type Locale } from "@/i18n/config";
import { addProductImageAction, deleteProductImageAction, reorderImagesAction, updateProductImageAction } from "@/lib/admin/products/actions";
import { pickJson } from "@/lib/catalog/types";
import type { ProductImageRow } from "@/lib/db/types";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { FormField } from "../shared/form-field";
import { ImageUploader } from "../shared/image-uploader";
import { useActionToast } from "../shared/use-action-toast";

interface Props {
  storeId: string;
  productId: string;
  locale: Locale;
  defaultLocale: Locale;
  enabledLocales: Locale[];
  images: ProductImageRow[];
  /** Variant ids + labels computed on the server (functions cannot cross the RSC boundary). */
  variantOptions: { value: string; label: string }[];
}

const ANY = "__any";

export function ProductImages({ storeId, productId, locale, defaultLocale, enabledLocales, images, variantOptions }: Props) {
  const t = useTranslations("admin.products.images");
  const tc = useTranslations("admin.common");
  const [, addAction] = useActionToast(addProductImageAction, { errorNamespace: "admin.products", successMessage: t("added") });
  const [, reorderAction, reordering] = useActionToast(reorderImagesAction, { errorNamespace: "admin.products" });
  const [editing, setEditing] = useState<ProductImageRow | null>(null);

  function base(fd: FormData) {
    fd.set("storeId", storeId);
    fd.set("productId", productId);
    return fd;
  }
  function move(index: number, dir: -1 | 1) {
    const order = images.map((i) => i.id);
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    const fd = base(new FormData());
    fd.set("order", JSON.stringify(order));
    startTransition(() => reorderAction(fd));
  }

  const variantItems = [{ value: ANY, label: t("anyVariant") }, ...variantOptions];

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
        </div>
        <ImageUploader
          storeId={storeId}
          folder={`products/${productId}`}
          multiple
          onUploaded={(url) => {
            const fd = base(new FormData());
            fd.set("url", url);
            startTransition(() => addAction(fd));
          }}
        />
      </div>
      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          <ImageIcon className="size-5" />
          {t("empty")}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => {
            const alt = pickJson(img.alt, locale, defaultLocale);
            const variant = img.variant_id ? variantOptions.find((v) => v.value === img.variant_id) : null;
            return (
              <li key={img.id} className="group relative flex flex-col gap-2 rounded-lg border p-2">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- storage host is user-configurable */}
                  <img src={img.url} alt={alt} className="size-full object-cover" loading="lazy" />
                  {i === 0 && <span className="absolute start-1.5 top-1.5 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">{t("primary")}</span>}
                </div>
                <div className="flex min-w-0 flex-col text-xs text-muted-foreground">
                  <span className="truncate">{alt || t("noAlt")}</span>
                  {variant && <span className="truncate">{variant.label}</span>}
                </div>
                <div className="flex items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon-xs" aria-label={t("moveUp")} disabled={i === 0 || reordering} onClick={() => move(i, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label={t("moveDown")} disabled={i === images.length - 1 || reordering} onClick={() => move(i, 1)}>
                    <ArrowDown />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label={t("editAlt")} className="ms-auto" onClick={() => setEditing(img)}>
                    <Pencil />
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button type="button" variant="ghost" size="icon-xs" aria-label={tc("delete")} className="text-destructive">
                        <Trash2 />
                      </Button>
                    }
                    title={t("delete.title")}
                    description={t("delete.description")}
                    confirmLabel={tc("delete")}
                    destructive
                    action={() => {
                      const fd = base(new FormData());
                      fd.set("imageId", img.id);
                      return deleteProductImageAction({}, fd);
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <EditImageForm
              key={editing.id}
              storeId={storeId}
              productId={productId}
              image={editing}
              enabledLocales={enabledLocales}
              variantItems={variantItems}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EditImageForm({
  storeId,
  productId,
  image,
  enabledLocales,
  variantItems,
  onDone,
}: {
  storeId: string;
  productId: string;
  image: ProductImageRow;
  enabledLocales: Locale[];
  variantItems: { value: string; label: string }[];
  onDone: () => void;
}) {
  const t = useTranslations("admin.products.images");
  const tc = useTranslations("admin.common");
  const [, action, pending] = useActionToast(updateProductImageAction, { errorNamespace: "admin.products", onSuccess: onDone });
  const [alt, setAlt] = useState<Record<string, string>>(() => Object.fromEntries(enabledLocales.map((l) => [l, image.alt[l] ?? ""])));
  const [variantId, setVariantId] = useState(image.variant_id ?? ANY);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="imageId" value={image.id} />
      <input type="hidden" name="alt" value={JSON.stringify(alt)} />
      <input type="hidden" name="variantId" value={variantId === ANY ? "" : variantId} />
      <DialogHeader>
        <DialogTitle>{t("editAlt")}</DialogTitle>
        <DialogDescription>{t("altHint")}</DialogDescription>
      </DialogHeader>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- storage host is user-configurable */}
        <img src={image.url} alt="" className="size-20 shrink-0 rounded-md border object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {enabledLocales.map((l) => (
            <FormField key={l} name={`alt-${l}`} label={`${t("alt")} · ${localeNames[l]}`}>
              <Input id={`alt-${l}`} lang={l} dir={l === "fa" ? "rtl" : "ltr"} value={alt[l] ?? ""} onChange={(e) => setAlt((prev) => ({ ...prev, [l]: e.target.value }))} />
            </FormField>
          ))}
        </div>
      </div>
      {variantItems.length > 1 && (
        <FormField name="variant" label={t("variant")}>
          <Select items={variantItems} value={variantId} onValueChange={(v) => v && setVariantId(String(v))} modal={false}>
            <SelectTrigger id="variant" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {variantItems.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {tc("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
