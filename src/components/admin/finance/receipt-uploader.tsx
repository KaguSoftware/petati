"use client";

import { ExternalLink, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  storeId: string;
  /** Hidden input name carrying the public URL (or ""). */
  name?: string;
  defaultValue?: string | null;
}

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Receipt upload to the `store-media` bucket under `<storeId>/receipts/`; submits the public URL.
 * SCOPE(finance): uses its own uploader until the shared image-uploader lands. GROWS LATER → shared component.
 */
export function ReceiptUploader({ storeId, name = "receipt_url", defaultValue }: Props) {
  const t = useTranslations("admin.finance");
  const tc = useTranslations("admin.common");
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(t("errors.tooLarge"));
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
      const path = `${storeId}/receipts/${crypto.randomUUID()}.${ext}`;
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.storage.from("store-media").upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (error) throw error;
      setUrl(supabase.storage.from("store-media").getPublicUrl(path).data.publicUrl);
    } catch {
      toast.error(t("errors.uploadFailed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={url} />
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onChange} tabIndex={-1} aria-hidden />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload data-icon="inline-start" />
          {busy ? t("form.uploading") : url ? t("form.replaceReceipt") : t("form.uploadReceipt")}
        </Button>
        {url && (
          <>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline">
              <ExternalLink className="size-3.5" />
              {t("table.viewReceipt")}
            </a>
            <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
              <X data-icon="inline-start" />
              {tc("remove")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
