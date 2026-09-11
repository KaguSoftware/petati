/**
 * Client-safe constants for the delivery code. Kept out of `confirm.ts` because that module is
 * `server-only` and the admin card renders the remaining attempts in the browser.
 */
export const DELIVERY_ATTEMPT_LIMIT = 5;
