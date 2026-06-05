export const ITEM_TYPE_WEE = "වී";
export const ITEM_TYPE_MAIZE = "බඩඉරිඟු";

/** @type {readonly ["වී", "බඩඉරිඟු"]} */
export const PADDY_TYPES = [ITEM_TYPE_WEE, ITEM_TYPE_MAIZE];

/**
 * @typedef {"වී" | "බඩඉරිඟු"} PaddyType
 */

/**
 * @param {unknown} value
 * @returns {PaddyType}
 */
export function toDbPaddyType(value) {
  const trimmed = String(value ?? "").trim();
  if (
    trimmed === ITEM_TYPE_MAIZE ||
    trimmed === "Maize" ||
    trimmed.toLowerCase() === "maize"
  ) {
    return ITEM_TYPE_MAIZE;
  }
  return ITEM_TYPE_WEE;
}
