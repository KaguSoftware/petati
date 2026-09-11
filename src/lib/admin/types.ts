/** Shape returned by every admin server action used with `useActionState`. */
export interface ActionState {
  ok?: boolean;
  /** Message key under `admin.common.errors.*` or a module error key; shown as a toast. */
  error?: string;
  /** Field name → message key (`admin.common.required` etc.) or a raw zod message. */
  fieldErrors?: Record<string, string>;
  /** Id of the created row, when relevant. */
  id?: string;
  /** Bulk actions: rows that actually moved, and rows skipped because the move was not allowed. */
  changed?: number;
  skipped?: number;
}
