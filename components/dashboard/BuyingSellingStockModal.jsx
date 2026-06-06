"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";

const EASE_FLOW = [0.22, 1, 0.36, 1];
const ADD_NEW_VARIETY = "__add_new__";

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20";

function toNum(v) {
  if (v == null || String(v).trim() === "") return 0;
  const n = parseFloat(String(v).trim());
  return Number.isNaN(n) ? 0 : n;
}

function moneyPlain(n) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(
    Math.abs(Math.round(Number(n) || 0))
  );
}

function moneyFullLkr(n) {
  return `Rs. ${moneyPlain(n)}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function computeBssMetrics(form) {
  const weight = toNum(form.buying_weight_kg);
  const totalCost = weight * toNum(form.buying_rate_per_kg);
  const totalRevenue = weight * toNum(form.selling_rate_per_kg);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - toNum(form.extra_expenses);
  const advance = toNum(form.advance_cash_paid);
  const diff = Math.abs(advance - totalCost);

  let advanceSettlementStatus = "settled";
  if (advance > totalCost + 0.5) advanceSettlementStatus = "receivable_from_buyer";
  else if (advance < totalCost - 0.5) advanceSettlementStatus = "payable_to_buyer";

  return {
    totalCost,
    totalRevenue,
    grossProfit,
    netProfit,
    advanceDifference: diff,
    advanceSettlementStatus,
  };
}

function advanceStatusLabel(status) {
  if (status === "receivable_from_buyer") return "Balance Due From Buyer";
  if (status === "payable_to_buyer") return "Outstanding Payable to Buyer";
  return "Settled";
}

const INITIAL_FORM = {
  lorry_number: "",
  driver_name: "",
  commodity_type: "Paddy",
  paddy_variety: "",
  paddy_variety_select: "",
  new_variety_name: "",
  buyer_name: "",
  buying_weight_kg: "",
  buying_rate_per_kg: "",
  selling_rate_per_kg: "",
  advance_cash_paid: "",
  extra_expenses: "",
};

export function BuyingSellingStockModal({
  open,
  onClose,
  records,
  paddyTypes,
  onSubmit,
  submitting,
}) {
  const [form, setForm] = useState({ ...INITIAL_FORM });

  useEffect(() => {
    if (open) setForm({ ...INITIAL_FORM });
  }, [open]);

  const metrics = useMemo(() => computeBssMetrics(form), [form]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    await onSubmit(form, metrics);
  };

  const showPaddyVariety = form.commodity_type === "Paddy";
  const showNewVarietyInput = form.paddy_variety_select === ADD_NEW_VARIETY;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-lg"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.24, ease: EASE_FLOW }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0c]/95 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
              <div>
                <h3 className="text-lg font-black text-white sm:text-xl">
                  Buying &amp; Selling Stock
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/45">
                  Record trade loads and track settlement
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Lorry Number
                    </span>
                    <input
                      className={INPUT}
                      value={form.lorry_number}
                      onChange={(ev) => setField("lorry_number", ev.target.value)}
                      required
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Driver Name
                    </span>
                    <input
                      className={INPUT}
                      value={form.driver_name}
                      onChange={(ev) => setField("driver_name", ev.target.value)}
                      required
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Commodity Type
                    </span>
                    <select
                      className={INPUT}
                      value={form.commodity_type}
                      onChange={(ev) => setField("commodity_type", ev.target.value)}
                    >
                      <option value="Paddy">Paddy</option>
                      <option value="Maize">Maize</option>
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Buyer Name
                    </span>
                    <input
                      className={INPUT}
                      value={form.buyer_name}
                      onChange={(ev) => setField("buyer_name", ev.target.value)}
                      required
                    />
                  </label>
                </div>

                {showPaddyVariety ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5 sm:col-span-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        Paddy Variety
                      </span>
                      <select
                        className={INPUT}
                        value={form.paddy_variety_select}
                        onChange={(ev) => {
                          const v = ev.target.value;
                          setForm((prev) => ({
                            ...prev,
                            paddy_variety_select: v,
                            paddy_variety: v === ADD_NEW_VARIETY ? "" : v,
                          }));
                        }}
                      >
                        <option value="">Select variety...</option>
                        {paddyTypes.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                        <option value={ADD_NEW_VARIETY}>➕ Add New Variety...</option>
                      </select>
                    </label>
                    {showNewVarietyInput ? (
                      <label className="block space-y-1.5 sm:col-span-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                          New Variety Name
                        </span>
                        <input
                          className={INPUT}
                          value={form.new_variety_name}
                          onChange={(ev) => setField("new_variety_name", ev.target.value)}
                          placeholder="Enter new paddy variety..."
                          required
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["buying_weight_kg", "Buying Weight (KG)"],
                    ["buying_rate_per_kg", "Buying Rate per KG (Rs.)"],
                    ["selling_rate_per_kg", "Selling Rate per KG (Rs.)"],
                    ["advance_cash_paid", "Advance Cash Paid (Rs.)"],
                    ["extra_expenses", "Extra Expenses (Rs.)"],
                  ].map(([key, label]) => (
                    <label key={key} className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        {label}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={INPUT}
                        value={form[key]}
                        onChange={(ev) => setField(key, ev.target.value)}
                        required={key !== "extra_expenses"}
                      />
                    </label>
                  ))}
                </div>

                <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Total Cost", metrics.totalCost],
                    ["Total Revenue", metrics.totalRevenue],
                    ["Gross Profit", metrics.grossProfit],
                    ["Net Profit", metrics.netProfit],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                        {label}
                      </p>
                      <p className="font-mono text-lg font-black text-white">{moneyFullLkr(value)}</p>
                    </div>
                  ))}
                </div>

                {metrics.advanceSettlementStatus === "receivable_from_buyer" ? (
                  <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-100">
                    ⚠️ Balance Due From Buyer: {moneyFullLkr(metrics.advanceDifference)} (Overpaid
                    Advance)
                  </div>
                ) : null}
                {metrics.advanceSettlementStatus === "payable_to_buyer" ? (
                  <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm font-bold text-rose-100">
                    ⚠️ Outstanding Payable to Buyer: {moneyFullLkr(metrics.advanceDifference)}{" "}
                    (Credit Purchase)
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Buying &amp; Selling Entry
                </button>
              </form>

              <div className="mt-8">
                <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-white/70">
                  Transaction History Log
                </h4>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full min-w-[880px] border-collapse text-left">
                      <thead className="sticky top-0 bg-white/10">
                        <tr>
                          {[
                            "Date",
                            "Lorry",
                            "Buyer",
                            "KG",
                            "Net Profit",
                            "Advance Status",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-white/75"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center text-sm font-semibold text-white/55"
                            >
                              No buying &amp; selling records yet.
                            </td>
                          </tr>
                        ) : (
                          records.map((row) => (
                            <tr key={row.id} className="border-t border-white/10">
                              <td className="px-4 py-3 text-sm font-semibold text-white/90">
                                {formatDateTime(row.created_at)}
                              </td>
                              <td className="px-4 py-3 font-mono text-sm font-bold text-white">
                                {row.lorry_number || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-white/90">
                                {row.buyer_name || "—"}
                              </td>
                              <td className="px-4 py-3 font-mono text-sm font-bold text-white">
                                {moneyPlain(row.buying_weight_kg)} kg
                              </td>
                              <td className="px-4 py-3 font-mono text-sm font-bold text-emerald-200">
                                {moneyFullLkr(row.net_profit)}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-white/85">
                                {advanceStatusLabel(row.advance_settlement_status)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export { computeBssMetrics, ADD_NEW_VARIETY };
