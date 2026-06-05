/**
 * @typedef {import('./types').Trip} Trip
 * @typedef {import('./types').TripFinancials} TripFinancials
 */

import { isOutwardTrip } from "./trip-type";

/**
 * @param {Trip} trip
 * @returns {number}
 */
export function calculateLogisticsTotal(trip) {
  return (
    Number(trip.fuelCost || 0) +
    Number(trip.driverWage || 0) +
    Number(trip.helperWage || 0) +
    Number(trip.roadExpenses || 0)
  );
}

/**
 * @param {Trip} trip
 * @returns {number}
 */
export function calculateTripDistance(trip) {
  const d = Number(trip.endKm || 0) - Number(trip.startKm || 0);
  return d > 0 ? d : 0;
}

/**
 * @param {Trip} trip
 * @returns {TripFinancials}
 */
export function calculateTripFinancials(trip) {
  const outward = isOutwardTrip(trip.tripType);
  const goodsTotal = Number(trip.totalKg || 0) * Number(trip.pricePerKg || 0);
  const logisticsTotal = calculateLogisticsTotal(trip);

  const netProfit = outward
    ? goodsTotal - logisticsTotal
    : -(goodsTotal + logisticsTotal);

  return {
    goodsTotal,
    logisticsTotal,
    netProfit,
    isOutward: outward,
  };
}

/**
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * @param {number} value
 * @param {number} [decimals=0]
 * @returns {string}
 */
export function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
