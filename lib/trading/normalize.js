/**
 * Optional numeric fields: blank, null, undefined, or invalid → 0.
 * @param {unknown} value
 * @returns {number}
 */
export function toDbOptionalNumber(value) {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    return 0;
  }
  const n =
    typeof value === "string" ? parseFloat(value.trim()) : Number(value);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * @param {unknown} value
 * @param {string} fieldLabel
 * @returns {number}
 */
export function toDbRequiredNumber(value, fieldLabel) {
  const n =
    typeof value === "string" && value.trim() !== ""
      ? parseFloat(value)
      : Number(value);

  if (Number.isNaN(n)) {
    throw new Error(`${fieldLabel} must be a valid number`);
  }
  return n;
}

/**
 * Maps optional sales fields to Supabase-friendly null values when empty.
 * @param {unknown} price
 * @returns {number | null}
 */
export function toDbSellingPrice(price) {
  if (price == null || price === "") return null;
  const n =
    typeof price === "string" ? parseFloat(price) : Number(price);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

/**
 * @param {unknown} name
 * @returns {string | null}
 */
export function toDbBuyerName(name) {
  if (name == null || name === "") return null;
  const trimmed = String(name).trim();
  return trimmed === "" ? null : trimmed;
}
