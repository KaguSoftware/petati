"use client";

import { useState } from "react";
import { Camera, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { uploadProofAction } from "@/lib/courier/actions";

const MAX_EDGE = 1280;
const TARGET_BYTES = 900_000;

/**
 * Shrinks a phone photo in the browser before it ever leaves the doorstep: a modern camera file is
 * 4–8 MB, the courier is on mobile data, and the server caps the upload anyway.
 *
 * `createImageBitmap(..., { imageOrientation: "from-image" })` rather than an `Image` element —
 * without it every portrait photo arrives rotated, because the EXIF orientation flag is dropped the
 * moment it is drawn to a canvas.
 */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (let quality = 0.72; quality >= 0.4; quality -= 0.1) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && (blob.size <= TARGET_BYTES || quality <= 0.4)) return blob;
  }
  return file;
}

export function ProofPhotoField({ token, deliveryId, onUploaded }: { token: string; deliveryId: string; onUploaded: (path: string | null) => void }) {
  const t = useTranslations("courier");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  async function handle(file: File | undefined) {
    if (!file) return;
    setStatus("working");
    try {
      const blob = await downscale(file);
      const fd = new FormData();
      fd.set("token", token);
      fd.set("deliveryId", deliveryId);
      fd.set("photo", new File([blob], "proof.jpg", { type: "image/jpeg" }));
      const result = await uploadProofAction(fd);
      if (result.path) {
        onUploaded(result.path);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-medium">
        {status === "done" ? <Check className="size-4 text-primary" /> : <Camera className="size-4" />}
        {t(status === "done" ? "confirm.photoDone" : status === "working" ? "confirm.photoUploading" : "confirm.photo")}
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => handle(e.target.files?.[0])} />
      </label>
      {status === "error" && <p className="text-xs text-destructive">{t("errors.photoFailed")}</p>}
    </div>
  );
}
