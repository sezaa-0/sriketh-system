"use client";

import { motion } from "framer-motion";
import {
  Warehouse,
  Package,
  DollarSign,
  Fuel,
  MapPin,
  User,
  Users,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import {
  calculateTripFinancials,
  formatCurrency,
  formatNumber,
} from "@/lib/trading/calculations";
import { isInwardTrip, isOutwardTrip } from "@/lib/trading/trip-type";
import { LABELS, PADDY_TYPE_LABELS } from "@/lib/trading/labels";

/**
 * @typedef {import('@/lib/trading/types').Trip} Trip
 */

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {import('lucide-react').LucideIcon} props.icon
 */
function ExpenseRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
        <p className="text-[12px] font-medium text-neutral-700" lang="si">
          {label}
        </p>
      </div>
      <p className="shrink-0 text-[12px] font-semibold tabular-nums text-neutral-800">{value}</p>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {React.ReactNode} props.children
 */
function FieldLabel({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-neutral-500" lang="si">
        {label}
      </p>
      {children}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {Trip} props.trip
 * @param {number} props.index
 */
export function TripCard({ trip, index }) {
  const financials = calculateTripFinancials(trip);
  const inward = isInwardTrip(trip.tripType);
  const outward = isOutwardTrip(trip.tripType);
  const paddy = PADDY_TYPE_LABELS[trip.paddyType];
  const totalInvestment = financials.goodsTotal + financials.logisticsTotal;

  const date = new Date(trip.createdAt).toLocaleDateString("si-LK", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const badgeClass = inward
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
    : "bg-amber-50 text-amber-800 ring-1 ring-amber-100";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className="trip-card-premium"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-tight ${badgeClass}`}
            lang="si"
          >
            {inward ? LABELS.badgeInward.si : LABELS.badgeOutward.si}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
            {trip.tripReference ? (
              <span className="font-mono text-neutral-500">{trip.tripReference}</span>
            ) : null}
            {trip.tripReference ? <span className="text-neutral-300">·</span> : null}
            <time dateTime={trip.createdAt}>{date}</time>
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-neutral-900 px-3.5 py-2">
          <p className="text-[10px] font-medium text-neutral-400" lang="si">
            {LABELS.lorryNumber.si}
          </p>
          <p className="font-mono text-[15px] font-bold tracking-tight text-white">
            {trip.lorryNumber || "—"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 lg:grid-cols-3 lg:gap-5">
        <div className="flex flex-col justify-between gap-4 lg:border-r lg:border-neutral-100 lg:pr-5">
          <FieldLabel label={LABELS.totalKgCard.si}>
            <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-neutral-900">
              {formatNumber(trip.totalKg)}
              <span className="ml-1 text-base font-semibold text-neutral-500">kg</span>
            </p>
          </FieldLabel>

          <div className="space-y-3 border-t border-neutral-100 pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-[13px] font-medium text-neutral-700" lang="si">
                  {LABELS.priceLabel.si}
                </span>
              </div>
              <span className="text-[14px] font-semibold tabular-nums text-neutral-900">
                {formatCurrency(trip.pricePerKg)}
                <span className="text-[11px] font-normal text-neutral-400">/kg</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-[13px] font-medium text-neutral-700" lang="si">
                  {LABELS.paddyType.si}
                </span>
              </div>
              <span className="text-[13px] font-medium text-neutral-800" lang="si">
                {paddy.si}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Warehouse className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span className="text-[13px] font-medium text-neutral-700" lang="si">
                  {LABELS.warehouse.si}
                </span>
              </div>
              <span className="max-w-[140px] text-right text-[13px] font-medium text-neutral-800">
                {trip.warehouseName || "—"}
              </span>
            </div>
            {outward && trip.buyerName ? (
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="text-[13px] font-medium text-neutral-700" lang="si">
                    {LABELS.buyerName.si}
                  </span>
                </div>
                <span className="max-w-[140px] text-right text-[13px] font-medium text-neutral-800">
                  {trip.buyerName}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:border-r lg:border-neutral-100 lg:pr-5">
          <div className="h-full rounded-xl bg-neutral-50 p-4">
            <p className="mb-3 text-[13px] font-semibold text-neutral-800" lang="si">
              {LABELS.sectionLogistics.si}
            </p>
            <div className="space-y-0.5">
              <ExpenseRow icon={Fuel} label={LABELS.fuelCost.si} value={formatCurrency(trip.fuelCost)} />
              <ExpenseRow icon={User} label={LABELS.driverWage.si} value={formatCurrency(trip.driverWage)} />
              <ExpenseRow icon={Users} label={LABELS.helperWage.si} value={formatCurrency(trip.helperWage)} />
              <ExpenseRow icon={MapPin} label={LABELS.roadExpenses.si} value={formatCurrency(trip.roadExpenses)} />
            </div>
            <div className="mt-4 border-t border-neutral-200/80 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-neutral-800" lang="si">
                  {LABELS.totalTripCosts.si}
                </span>
                <p className="text-[14px] font-bold tabular-nums text-neutral-900">
                  {formatCurrency(financials.logisticsTotal)}
                </p>
              </div>
            </div>
            {(trip.driverName || trip.helperNames) && (
              <div className="mt-3 space-y-1 border-t border-neutral-200/60 pt-3 text-[12px] text-neutral-600">
                {trip.driverName ? (
                  <p lang="si">
                    {LABELS.driverName.si}: {trip.driverName}
                  </p>
                ) : null}
                {trip.helperNames ? (
                  <p lang="si">
                    {LABELS.helperNames.si}: {trip.helperNames}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          {inward ? (
            <div className="rounded-2xl border border-neutral-100 bg-white p-4">
              <p className="text-[13px] font-semibold text-neutral-800" lang="si">
                {LABELS.totalInvestment.si}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-neutral-900">
                {formatCurrency(totalInvestment)}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-neutral-100 bg-white p-4">
                <p className="text-[13px] font-semibold text-neutral-800" lang="si">
                  {LABELS.totalRevenue.si}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-neutral-900">
                  {formatCurrency(financials.goodsTotal)}
                </p>
              </div>
              <div
                className={`rounded-xl px-3 py-3 font-semibold ${
                  financials.netProfit >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-orange-50 text-orange-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <p className="text-[13px] font-semibold" lang="si">
                      {financials.netProfit >= 0
                        ? LABELS.netProfitClean.si
                        : LABELS.netLoss.si}
                    </p>
                  </div>
                  <p className="text-xl font-bold tabular-nums">
                    {financials.netProfit >= 0 ? "+" : ""}
                    {formatCurrency(financials.netProfit)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}
