import "server-only";

import type { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Db = ReturnType<typeof createSupabaseAdminClient>;

export const PROOF_BUCKET = "delivery-proof";
/** Server-side ceiling. The browser downscales first; this is what stops a hostile client. */
export const PROOF_MAX_BYTES = 1_500_000;

const SIGNATURES: { ext: string; type: string; test: (b: Uint8Array) => boolean }[] = [
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", type: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    ext: "webp",
    type: "image/webp",
    test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

/**
 * Stores a doorstep photo in the private `delivery-proof` bucket with the service-role client — the
 * courier has no session, and the bucket has no insert policy, so this is the only way in.
 *
 * The file type is decided by sniffing the magic bytes, never by trusting `file.type`: that header
 * is attacker-controlled and the bucket's own MIME allow-list would happily take a mislabelled blob.
 */
export async function uploadProofPhoto(db: Db, storeId: string, deliveryId: string, file: File): Promise<{ path?: string; error?: string }> {
  if (file.size === 0 || file.size > PROOF_MAX_BYTES) return { error: "photoTooLarge" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const match = SIGNATURES.find((s) => s.test(bytes));
  if (!match) return { error: "photoBadType" };

  // The first path segment is what the storage read policy checks, so the store prefix is load-bearing.
  const path = `${storeId}/${deliveryId}/${crypto.randomUUID()}.${match.ext}`;
  const { error } = await db.storage.from(PROOF_BUCKET).upload(path, bytes, { contentType: match.type, upsert: false });
  if (error) return { error: "photoFailed" };
  return { path };
}

/** Short-lived link for the admin to look at a proof photo; the bucket itself stays private. */
export async function signedProofUrl(db: Db, path: string, seconds = 300): Promise<string | null> {
  const { data } = await db.storage.from(PROOF_BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
