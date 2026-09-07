import { notFound } from "next/navigation";

/** Anything not matched by a real route inside a locale renders the localized 404. */
export default function CatchAll() {
  notFound();
}
