import { notFound } from "next/navigation";

/** Unknown routes may block (they always 404); keeps instant-navigation validation quiet. */
export const instant = false;

/** Anything not matched by a real route inside a locale renders the localized 404. */
export default function CatchAll() {
  notFound();
}
