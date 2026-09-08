"use client";

import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg" };

interface Props {
  storeId: string;
  /** Sub-folder under `<storeId>/` in the `store-media` bucket (e.g. "products/<id>"). */
  folder: string;
  /** Called once per uploaded file with its public URL. */
  onUploaded: (url: string, file: File) => Promise<unknown> | unknown;
  multiple?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "secondary";
  className?: string;
}

/**
 * Styled upload button over a visually-hidden file input. Uploads straight from the browser
 * (storage RLS checks store membership on the `<storeId>/` prefix), then hands the public URL
 * to the caller's server action.
 */
export function ImageUploader({ storeId, folder, onUploaded, multiple = false, disabled, label, size = "sm", variant = "outline", className }: Props) {
  const t = useTranslations("admin.products.upload");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(t("errors.type", { name: f.name }));
        return false;
      }
      if (f.size > MAX_BYTES) {
        toast.error(t("errors.size", { name: f.name }));
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;
    setProgress({ done: 0, total: valid.length });
    const supabase = createSupabaseBrowserClient();
    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
    let done = 0;
    for (const file of valid) {
      const ext = EXT[file.type] ?? file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${storeId}/${cleanFolder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("store-media").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (error) {
        toast.error(t("errors.failed", { name: file.name }));
      } else {
        const { data } = supabase.storage.from("store-media").getPublicUrl(path);
        try {
          await onUploaded(data.publicUrl, file);
        } catch {
          toast.error(t("errors.failed", { name: file.name }));
        }
      }
      done += 1;
      setProgress({ done, total: valid.length });
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const busy = progress !== null;
  return (
    <div className={cn("inline-flex", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || busy}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <Button type="button" size={size} variant={variant} disabled={disabled || busy} onClick={() => inputRef.current?.click()} aria-busy={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {busy ? t("uploading", { done: progress.done, total: progress.total }) : (label ?? t("button"))}
      </Button>
    </div>
  );
}
