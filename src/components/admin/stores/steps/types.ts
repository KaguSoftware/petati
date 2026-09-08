import type { CreateStoreInput } from "@/lib/admin/stores/schema";

/** Shared contract for every wizard step. `errors` holds already-translated messages keyed by dotted field path. */
export interface StepProps {
  draft: CreateStoreInput;
  update: (patch: Partial<CreateStoreInput>) => void;
  errors: Record<string, string>;
}
