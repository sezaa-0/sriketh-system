import { supabase } from "@/lib/supabase";
import { toDbPaddyType } from "@/lib/trading/item-type";
import {
  toDbBuyerName,
  toDbOptionalNumber,
  toDbRequiredNumber,
} from "@/lib/trading/normalize";
import { isOutwardTrip, toDbTripType } from "@/lib/trading/trip-type";
import { formatSupabaseError, logSupabaseError } from "@/lib/trading/errors";

/**
 * @typedef {import('./types').Trip} Trip
 */

/** @param {Record<string, unknown>} row */
function mapTripRow(row) {
  return /** @type {Trip} */ ({
    id: String(row.id),
    tripReference: row.trip_reference ? String(row.trip_reference) : undefined,
    tripType: toDbTripType(row.trip_type),
    paddyType: toDbPaddyType(row.paddy_type),
    warehouseName: String(row.warehouse_name ?? "").trim(),
    buyerName: row.buyer_name != null ? String(row.buyer_name).trim() : null,
    lorryNumber: String(row.lorry_number ?? "").trim(),
    driverName: String(row.driver_name ?? "").trim(),
    helperNames: String(row.helper_names ?? "").trim(),
    totalKg: Number(row.total_kg ?? 0),
    pricePerKg: Number(row.price_per_kg ?? 0),
    startKm: Number(row.start_km ?? 0),
    endKm: Number(row.end_km ?? 0),
    dieselLiters: Number(row.diesel_liters ?? 0),
    fuelCost: Number(row.diesel_cost ?? row.fuel_cost ?? 0),
    driverWage: Number(row.driver_wage ?? 0),
    helperWage: Number(row.helper_wage ?? 0),
    roadExpenses: Number(row.road_expenses ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  });
}

/** @returns {Promise<string>} */
async function generateTripReference() {
  const year = new Date().getFullYear();
  const prefix = `TRIP-${year}-`;

  const { data, error } = await supabase
    .from("trips")
    .select("trip_reference")
    .ilike("trip_reference", `${prefix}%`);

  if (error) return `${prefix}${Date.now()}`;

  const numbers = (data ?? [])
    .map((r) => {
      const m = String(r.trip_reference).match(/TRIP-\d{4}-(\d+)$/i);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n) && n > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/**
 * @param {Record<string, unknown>} form — snake_case fields from page state
 */
export function buildTripInsertPayload(form) {
  const outward = isOutwardTrip(form.trip_type);

  return {
    trip_type: toDbTripType(form.trip_type),
    paddy_type: toDbPaddyType(form.paddy_type),
    warehouse_name: String(form.warehouse_name ?? "").trim(),
    buyer_name: outward ? toDbBuyerName(form.buyer_name) : null,
    lorry_number: String(form.lorry_number ?? "").trim(),
    driver_name: String(form.driver_name ?? "").trim(),
    helper_names: String(form.helper_names ?? "").trim(),
    total_kg: toDbRequiredNumber(form.total_kg, "total_kg"),
    price_per_kg: toDbRequiredNumber(form.price_per_kg, "price_per_kg"),
    start_km: toDbOptionalNumber(form.start_km),
    end_km: toDbOptionalNumber(form.end_km),
    diesel_liters: toDbOptionalNumber(form.diesel_liters),
    diesel_cost: toDbOptionalNumber(form.diesel_cost),
    driver_wage: toDbOptionalNumber(form.driver_wage),
    helper_wage: toDbOptionalNumber(form.helper_wage),
    road_expenses: toDbOptionalNumber(form.road_expenses),
  };
}

/** @returns {Promise<Trip[]>} */
export async function fetchAllTrips() {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("trips.select", error);
    throw new Error(formatSupabaseError(error));
  }

  return (data ?? []).map(mapTripRow);
}

/**
 * @param {Record<string, unknown>} form
 * @returns {Promise<Trip>}
 */
export async function submitCreateTrip(form) {
  const trip_reference = await generateTripReference();
  const payload = { trip_reference, ...buildTripInsertPayload(form) };

  try {
    let { data, error } = await supabase
      .from("trips")
      .insert(payload)
      .select()
      .single();

    if (error?.code === "23505") {
      const retryRef = `TRIP-${new Date().getFullYear()}-${Date.now()}`;
      ({ data, error } = await supabase
        .from("trips")
        .insert({ ...payload, trip_reference: retryRef })
        .select()
        .single());
    }

    if (error) {
      logSupabaseError("trips.insert", error, payload);
      throw error;
    }

    if (!data) throw new Error("Insert succeeded but no row returned");
    return mapTripRow(data);
  } catch (error) {
    logSupabaseError("submitCreateTrip", error, payload);
    throw new Error(formatSupabaseError(error));
  }
}
