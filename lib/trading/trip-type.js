/** Sinhala trip types stored in Supabase */
export const TRIP_TYPE_INWARD = "බඩු ගේන්න";
export const TRIP_TYPE_OUTWARD = "බඩු බාන්න";

/** @type {readonly ["බඩු ගේන්න", "බඩු බාන්න"]} */
export const TRIP_TYPES = [TRIP_TYPE_INWARD, TRIP_TYPE_OUTWARD];

/**
 * @typedef {"බඩු ගේන්න" | "බඩු බාන්න"} TripType
 */

/**
 * @param {unknown} value
 * @returns {TripType}
 */
export function toDbTripType(value) {
  const trimmed = String(value ?? "").trim();
  if (
    trimmed === TRIP_TYPE_OUTWARD ||
    trimmed === "Outward" ||
    trimmed.toLowerCase() === "outward"
  ) {
    return TRIP_TYPE_OUTWARD;
  }
  return TRIP_TYPE_INWARD;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isInwardTrip(value) {
  return toDbTripType(value) === TRIP_TYPE_INWARD;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isOutwardTrip(value) {
  return toDbTripType(value) === TRIP_TYPE_OUTWARD;
}
