/**
 * UI string accessor.
 *
 * Currently locked to English. To add another locale:
 *   1. Create `strings.fr.ts` with the same shape as `strings.en.ts`
 *   2. Wire a runtime selector here (cookie, context, route segment, etc.)
 *   3. Replace the static export below by the resolved dictionary
 *
 * Components import from "@/lib/i18n" and should never reach into the locale
 * files directly — that keeps the future migration to a real i18n layer to a
 * single edit per component.
 */

export { strings as t } from "./strings.en";
export type { Strings } from "./strings.en";
