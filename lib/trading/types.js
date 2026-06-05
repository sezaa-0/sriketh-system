/**
 * @typedef {import('./trip-type').TripType} TripType
 * @typedef {import('./item-type').PaddyType} PaddyType
 */

/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} [tripReference]
 * @property {TripType} tripType
 * @property {PaddyType} paddyType
 * @property {string} warehouseName
 * @property {string | null} buyerName
 * @property {string} lorryNumber
 * @property {string} driverName
 * @property {string} helperNames
 * @property {number} totalKg
 * @property {number} pricePerKg
 * @property {number} startKm
 * @property {number} endKm
 * @property {number} dieselLiters
 * @property {number} fuelCost
 * @property {number} driverWage
 * @property {number} helperWage
 * @property {number} roadExpenses
 * @property {string} createdAt
 */

/**
 * @typedef {Object} TripFinancials
 * @property {number} goodsTotal
 * @property {number} logisticsTotal
 * @property {number} netProfit
 * @property {boolean} isOutward
 */

/**
 * @typedef {'history' | 'log'} TradingTabId
 */

export { TRIP_TYPES } from "./trip-type";
export { PADDY_TYPES } from "./item-type";
