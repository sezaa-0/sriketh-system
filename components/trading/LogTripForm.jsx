"use client";

import { motion } from "framer-motion";
import {
  Truck,
  Warehouse,
  Scale,
  DollarSign,
  User,
  Users,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { LABELS, PADDY_TYPE_LABELS } from "@/lib/trading/labels";
import { PADDY_TYPES } from "@/lib/trading/item-type";
import {
  TRIP_TYPE_INWARD,
  TRIP_TYPE_OUTWARD,
  isOutwardTrip,
} from "@/lib/trading/trip-type";

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {React.ReactNode} props.children
 */
function FormSection({ title, children }) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-neutral-100" />
        <p className="shrink-0 text-[13px] font-semibold text-neutral-800" lang="si">
          {title}
        </p>
        <div className="h-px flex-1 bg-neutral-100" />
      </div>
      {children}
    </section>
  );
}

/**
 * @param {Object} props
 * @param {Record<string, string>} props.formState
 * @param {(field: string, value: string) => void} props.onFieldChange
 * @param {(values: Record<string, string>) => void | Promise<void>} props.onSubmit
 * @param {boolean} [props.isSubmitting]
 */
export function LogTripForm({ formState, onFieldChange, onSubmit, isSubmitting = false }) {
  const outward = isOutwardTrip(formState.trip_type);

  return (
    <motion.form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const fromDom = Object.fromEntries(fd.entries());
        onSubmit({
          ...formState,
          ...fromDom,
          lorry_number: String(fromDom.lorry_number ?? formState.lorry_number ?? ""),
        });
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl" lang="si">
        {LABELS.logTripTitle.si}
      </h2>

      <div className="mt-8 space-y-10">
        <FormField labelSi={LABELS.tripType.si}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { type: TRIP_TYPE_INWARD, label: LABELS.tripInward.si, accent: "emerald" },
              { type: TRIP_TYPE_OUTWARD, label: LABELS.tripOutward.si, accent: "amber" },
            ].map((opt) => {
              const selected = formState.trip_type === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => onFieldChange("trip_type", opt.type)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                    selected
                      ? opt.accent === "emerald"
                        ? "border-emerald-500/30 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/15"
                        : "border-amber-400/40 bg-amber-50 text-amber-900 ring-2 ring-amber-400/15"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50"
                  }`}
                >
                  <span className="block text-[14px] font-semibold" lang="si">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </FormField>

        <FormSection title={LABELS.formBasicInfo.si}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField labelSi={LABELS.lorryNumber.si}>
              <div className="relative">
                <Truck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="lorry_number"
                  name="lorry_number"
                  type="text"
                  autoComplete="off"
                  className="input-field pl-10 font-mono"
                  placeholder="WP CAB-4521"
                  value={formState.lorry_number ?? ""}
                  onChange={(e) => onFieldChange("lorry_number", e.target.value)}
                />
              </div>
            </FormField>
            <FormField labelSi={LABELS.driverName.si}>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  name="driver_name"
                  className="input-field pl-10"
                  value={formState.driver_name ?? ""}
                  onChange={(e) => onFieldChange("driver_name", e.target.value)}
                />
              </div>
            </FormField>
            <FormField labelSi={LABELS.helperNames.si} className="sm:col-span-2">
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  name="helper_names"
                  className="input-field pl-10"
                  value={formState.helper_names ?? ""}
                  onChange={(e) => onFieldChange("helper_names", e.target.value)}
                />
              </div>
            </FormField>
            <FormField labelSi={LABELS.warehouse.si}>
              <div className="relative">
                <Warehouse className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  name="warehouse_name"
                  className="input-field pl-10"
                  value={formState.warehouse_name ?? ""}
                  onChange={(e) => onFieldChange("warehouse_name", e.target.value)}
                />
              </div>
            </FormField>
            {outward ? (
              <FormField labelSi={LABELS.buyerName.si}>
                <div className="relative">
                  <ShoppingBag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    name="buyer_name"
                    className="input-field pl-10"
                    value={formState.buyer_name ?? ""}
                    onChange={(e) => onFieldChange("buyer_name", e.target.value)}
                  />
                </div>
              </FormField>
            ) : (
              <div className="hidden sm:block" aria-hidden="true" />
            )}
          </div>
        </FormSection>

        <FormSection title={LABELS.formStockInfo.si}>
          <FormField labelSi={LABELS.paddyType.si}>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              {PADDY_TYPES.map((type) => {
                const labels = PADDY_TYPE_LABELS[type];
                const selected = formState.paddy_type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onFieldChange("paddy_type", type)}
                    className={`rounded-xl border py-3.5 text-center transition-all duration-200 ${
                      selected
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <span className="font-semibold" lang="si">
                      {labels.si}
                    </span>
                  </button>
                );
              })}
            </div>
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField labelSi={LABELS.totalKg.si}>
              <div className="relative">
                <Scale className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  name="total_kg"
                  type="number"
                  min="0"
                  className="input-field pl-10"
                  value={formState.total_kg ?? ""}
                  onChange={(e) => onFieldChange("total_kg", e.target.value)}
                />
              </div>
            </FormField>
            <FormField labelSi={LABELS.pricePerKg.si}>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  name="price_per_kg"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field pl-10"
                  value={formState.price_per_kg ?? ""}
                  onChange={(e) => onFieldChange("price_per_kg", e.target.value)}
                />
              </div>
            </FormField>
          </div>
        </FormSection>

        <FormSection title={LABELS.formTripExpenses.si}>
          <div className="rounded-2xl bg-neutral-50/80 p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField labelSi={LABELS.startKm.si}>
                <input
                  name="start_km"
                  type="number"
                  min="0"
                  className="input-field bg-white"
                  value={formState.start_km ?? ""}
                  onChange={(e) => onFieldChange("start_km", e.target.value)}
                />
              </FormField>
              <FormField labelSi={LABELS.endKm.si}>
                <input
                  name="end_km"
                  type="number"
                  min="0"
                  className="input-field bg-white"
                  value={formState.end_km ?? ""}
                  onChange={(e) => onFieldChange("end_km", e.target.value)}
                />
              </FormField>
              <FormField labelSi={LABELS.dieselLiters.si}>
                <input
                  name="diesel_liters"
                  type="number"
                  min="0"
                  step="0.1"
                  className="input-field bg-white"
                  value={formState.diesel_liters ?? ""}
                  onChange={(e) => onFieldChange("diesel_liters", e.target.value)}
                />
              </FormField>
              <FormField labelSi={LABELS.fuelCost.si}>
                <input
                  name="diesel_cost"
                  type="number"
                  min="0"
                  className="input-field bg-white"
                  value={formState.diesel_cost ?? ""}
                  onChange={(e) => onFieldChange("diesel_cost", e.target.value)}
                />
              </FormField>
              <FormField labelSi={LABELS.driverWage.si}>
                <input
                  name="driver_wage"
                  type="number"
                  min="0"
                  className="input-field bg-white"
                  value={formState.driver_wage ?? ""}
                  onChange={(e) => onFieldChange("driver_wage", e.target.value)}
                />
              </FormField>
              <FormField labelSi={LABELS.helperWage.si}>
                <input
                  name="helper_wage"
                  type="number"
                  min="0"
                  className="input-field bg-white"
                  value={formState.helper_wage ?? ""}
                  onChange={(e) => onFieldChange("helper_wage", e.target.value)}
                />
              </FormField>
              <FormField labelSi={LABELS.roadExpenses.si} className="sm:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    name="road_expenses"
                    type="number"
                    min="0"
                    className="input-field bg-white pl-10"
                    value={formState.road_expenses ?? ""}
                    onChange={(e) => onFieldChange("road_expenses", e.target.value)}
                  />
                </div>
              </FormField>
            </div>
          </div>
        </FormSection>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary mt-10 w-full py-4 sm:w-auto sm:min-w-[200px] sm:px-14"
        lang="si"
      >
        {LABELS.saveTrip.si}
      </button>
    </motion.form>
  );
}
