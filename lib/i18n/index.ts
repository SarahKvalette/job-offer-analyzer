/**
 * UI string accessor.
 *
 * French-first: `t` resolves to the French dictionary. English remains fully
 * written in `strings.en.ts` and defines the `Strings` shape, so `strings.fr`
 * is checked for parity at compile time. To support runtime locale switching
 * later, wire a selector here (cookie / context / route segment) and return
 * the resolved dictionary.
 *
 * Components import from "@/lib/i18n" and should never reach into the locale
 * files directly — that keeps locale changes to a single edit here.
 */

export { strings as t } from "./strings.fr";
export type { Strings } from "./strings.en";
