"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ADD_NEW_VARIETY,
  BSS_COMMODITY_TYPES,
  BSS_INITIAL_FORM,
  BSS_PAYMENT_METHODS,
  BSS_PAYMENT_STATUSES,
  buildBssFormFromRecord,
  computeBssMetrics,
  getBssNetProfit,
  getBssPaymentStatus,
  getBssTotalKg,
  getBssVehicleNo,
  normalizeBssRow,
} from "@/lib/buying-selling-stock";
import { CheckCircle2, Loader2, Pencil, Trash2, X } from "lucide-react";

const EASE_FLOW = [0.22, 1, 0.36, 1];

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20";

const SECTION =
  "rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5";

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

function formatSettledOn(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function PaymentStatusCell({ row }) {
  const status = getBssPaymentStatus(row);
  if (status === "Settled") {
    const settledOn = formatSettledOn(row.settled_at || row.created_at);
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          Settled
        </span>
        {settledOn ? (
          <p className="text-[10px] font-semibold text-white/40">on {settledOn}</p>
        ) : null}
      </div>
    );
  }

  return (
    <span className="inline-flex rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-amber-200">
      Pending
    </span>
  );
}

export function BuyingSellingStockModal({
  open,
  onClose,
  records,
  paddyTypes,
  onSubmit,
  onDelete,
  onPaymentSettle,
  submitting,
  paymentSettlingId,
  deletingId,
  focusRecordId = null,
}) {
  const [form, setForm] = useState({ ...BSS_INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);

  const normalizedRecords = useMemo(
    () => (records ?? []).map(normalizeBssRow),
    [records]
  );

  useEffect(() => {
    if (!open) return;
    if (focusRecordId) {
      const row = normalizedRecords.find((r) => r.id === focusRecordId);
      if (row) {
        setEditingId(row.id);
        setForm(buildBssFormFromRecord(row));
      }
      return;
    }
    setForm({ ...BSS_INITIAL_FORM });
    setEditingId(null);
  }, [open, focusRecordId, normalizedRecords]);

  const metrics = useMemo(() => computeBssMetrics(form), [form]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm({ ...BSS_INITIAL_FORM });
    setEditingId(null);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const ok = await onSubmit(form, metrics, editingId);
    if (ok) resetForm();
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm(buildBssFormFromRecord(row));
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const ok = await onDelete(row.id);
    if (ok && editingId === row.id) resetForm();
  };

  const handleQuickSettle = async (row) => {
    if (getBssPaymentStatus(row) === "Settled") return;
    const ok = await onPaymentSettle(row.id);
    if (ok && editingId === row.id) {
      setForm((prev) => ({ ...prev, payment_status: "Settled" }));
    }
  };

  const showPaddyVariety = form.commodity_type === "Paddy";
  const showNewVarietyInput = form.variety_select === ADD_NEW_VARIETY;
  const isEditing = Boolean(editingId);
  const actionBusy = submitting || Boolean(paymentSettlingId);

  const supplierOverpaid = metrics.supplierBalance < -0.5;
  const supplierOwed = metrics.supplierBalance > 0.5;

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
                  {isEditing
                    ? "Editing transaction record"
                    : "Record purchase and sale in one transaction log"}
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
                {/* Common vehicle / commodity info */}
                <div className={SECTION}>
                  <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-white/55">
                    Vehicle &amp; Commodity
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        Vehicle Number
                      </span>
                      <input
                        className={INPUT}
                        value={form.vehicle_no}
                        onChange={(ev) => setField("vehicle_no", ev.target.value)}
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
                        onChange={(ev) => {
                          const nextType = ev.target.value;
                          setForm((prev) => ({
                            ...prev,
                            commodity_type: nextType,
                            ...(nextType !== "Paddy"
                              ? {
                                  variety: "",
                                  variety_select: "",
                                  new_variety_name: "",
                                }
                              : {}),
                          }));
                        }}
                      >
                        {BSS_COMMODITY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    {showPaddyVariety ? (
                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                          Variety
                        </span>
                        <select
                          className={INPUT}
                          value={form.variety_select}
                          onChange={(ev) => {
                            const v = ev.target.value;
                            setForm((prev) => ({
                              ...prev,
                              variety_select: v,
                              variety: v === ADD_NEW_VARIETY ? "" : v,
                            }));
                          }}
                        >
                          <option value="">Select variety...</option>
                          {paddyTypes.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                          <option value={ADD_NEW_VARIETY}>Add New Variety...</option>
                        </select>
                      </label>
                    ) : (
                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                          Variety
                        </span>
                        <input
                          className={INPUT}
                          value={form.variety}
                          onChange={(ev) => setField("variety", ev.target.value)}
                          placeholder="Optional variety label"
                        />
                      </label>
                    )}
                  </div>
                  {showNewVarietyInput ? (
                    <label className="mt-4 block space-y-1.5">
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
                  <label className="mt-4 block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Total Weight (KG)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={INPUT}
                      value={form.total_kg}
                      onChange={(ev) => setField("total_kg", ev.target.value)}
                      required
                    />
                  </label>
                </div>

                {/* Buying section */}
                <div className={`${SECTION} border-sky-400/20`}>
                  <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-sky-300/80">
                    Buying Section
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5 sm:col-span-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        Supplier Name
                      </span>
                      <input
                        className={INPUT}
                        value={form.supplier_name}
                        onChange={(ev) => setField("supplier_name", ev.target.value)}
                        required
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        Buying Price per KG (Rs.)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={INPUT}
                        value={form.buying_price_per_kg}
                        onChange={(ev) => setField("buying_price_per_kg", ev.target.value)}
                        required
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        Amount Paid to Supplier (Rs.)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={INPUT}
                        value={form.amount_paid_to_supplier}
                        onChange={(ev) => setField("amount_paid_to_supplier", ev.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-xl border border-sky-400/15 bg-sky-500/5 p-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                        Total Buying Amount
                      </p>
                      <p className="font-mono text-lg font-black text-sky-100">
                        {moneyFullLkr(metrics.totalBuyingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                        Supplier Balance
                      </p>
                      <p
                        className={`font-mono text-lg font-black ${
                          supplierOverpaid
                            ? "text-rose-200"
                            : supplierOwed
                              ? "text-amber-200"
                              : "text-emerald-200"
                        }`}
                      >
                        {metrics.supplierBalance < 0 ? "−" : ""}
                        {moneyFullLkr(Math.abs(metrics.supplierBalance))}
                      </p>
                    </div>
                  </div>
                  {supplierOverpaid ? (
                    <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100">
                      Supplier was overpaid by {moneyFullLkr(Math.abs(metrics.supplierBalance))}.
                      Recover this amount from the supplier.
                    </p>
                  ) : null}
                  {!supplierOverpaid && supplierOwed ? (
                    <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100">
                      Outstanding payable to supplier: {moneyFullLkr(metrics.supplierBalance)}.
                    </p>
                  ) : null}
                </div>

                {/* Selling section */}
                <div className={`${SECTION} border-emerald-400/20`}>
                  <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-emerald-300/80">
                    Selling Section
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5 sm:col-span-2">
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
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        Selling Price per KG (Rs.)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={INPUT}
                        value={form.selling_price_per_kg}
                        onChange={(ev) => setField("selling_price_per_kg", ev.target.value)}
                        required
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        Payment Status
                      </span>
                      <select
                        className={INPUT}
                        value={form.payment_status}
                        onChange={(ev) => setField("payment_status", ev.target.value)}
                      >
                        {BSS_PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <fieldset className="block space-y-2 sm:col-span-2">
                      <legend className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                        Payment Method
                      </legend>
                      <div className="flex flex-wrap gap-3">
                        {BSS_PAYMENT_METHODS.map((method) => (
                          <label
                            key={method}
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                              form.payment_method === method
                                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                                : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment_method"
                              value={method}
                              checked={form.payment_method === method}
                              onChange={(ev) => setField("payment_method", ev.target.value)}
                              className="sr-only"
                            />
                            {method}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                        Total Selling Amount
                      </p>
                      <p className="font-mono text-lg font-black text-emerald-100">
                        {moneyFullLkr(metrics.totalSellingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                        Net Profit
                      </p>
                      <p
                        className={`font-mono text-lg font-black ${
                          metrics.netProfit >= 0 ? "text-emerald-200" : "text-rose-200"
                        }`}
                      >
                        {moneyFullLkr(metrics.netProfit)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isEditing ? "Update Transaction" : "Save Transaction"}
                  </button>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={actionBusy}
                      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white/80 transition hover:bg-white/20 disabled:opacity-60"
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="mt-8">
                <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-white/70">
                  Transaction History Log
                </h4>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full min-w-[1020px] border-collapse text-left">
                      <thead className="sticky top-0 bg-white/10">
                        <tr>
                          {[
                            "Date",
                            "Vehicle",
                            "Buyer",
                            "KG",
                            "Net Profit",
                            "Payment",
                            "Actions",
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
                        {normalizedRecords.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-10 text-center text-sm font-semibold text-white/55"
                            >
                              No buying &amp; selling records yet.
                            </td>
                          </tr>
                        ) : (
                          normalizedRecords.map((row) => {
                            const rowDeleting = deletingId === row.id;
                            const rowSettling = paymentSettlingId === row.id;
                            const rowEditing = editingId === row.id;
                            const isPending = getBssPaymentStatus(row) === "Pending";
                            return (
                              <tr
                                key={row.id}
                                className={`border-t border-white/10 ${rowEditing ? "bg-emerald-500/10" : ""}`}
                              >
                                <td className="px-4 py-3 text-sm font-semibold text-white/90">
                                  {formatDateTime(row.created_at)}
                                </td>
                                <td className="px-4 py-3 font-mono text-sm font-bold text-white">
                                  {getBssVehicleNo(row)}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-white/90">
                                  {row.buyer_name || "—"}
                                </td>
                                <td className="px-4 py-3 font-mono text-sm font-bold text-white">
                                  {moneyPlain(getBssTotalKg(row))} kg
                                </td>
                                <td className="px-4 py-3 font-mono text-sm font-bold text-emerald-200">
                                  {moneyFullLkr(getBssNetProfit(row))}
                                </td>
                                <td className="px-4 py-3">
                                  <PaymentStatusCell row={row} />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {isPending ? (
                                      <button
                                        type="button"
                                        title="Mark payment as settled"
                                        onClick={() => handleQuickSettle(row)}
                                        disabled={actionBusy || rowDeleting}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 text-xs font-black uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-50"
                                      >
                                        {rowSettling ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
                                        )}
                                        Settle
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      title="Edit"
                                      onClick={() => handleEdit(row)}
                                      disabled={actionBusy || rowDeleting}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-200 transition hover:bg-sky-500/25 disabled:opacity-50"
                                    >
                                      <Pencil className="h-4 w-4" strokeWidth={2.2} />
                                    </button>
                                    <button
                                      type="button"
                                      title="Delete"
                                      onClick={() => handleDelete(row)}
                                      disabled={actionBusy || rowDeleting}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/15 text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-50"
                                    >
                                      {rowDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
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
