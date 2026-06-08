"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Fuel,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  FUEL_STATUS,
  buildFuelLogInsertPayload,
  buildFuelLogUpdatePayload,
  computeInstallmentUpdate,
  uniqueFuelStations,
} from "@/lib/fuel-management";

const EASE = [0.22, 1, 0.36, 1];
const INPUT =
  "w-full min-w-0 rounded-2xl border-0 bg-[#EFEFEF]/70 p-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-neutral-950";
const CARD =
  "rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-8";

const INITIAL_FORM = {
  vehicle_no: "",
  fuel_station: "",
  amount: "",
  is_credit: false,
};

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

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function todayDateValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dbError(err) {
  if (err && typeof err === "object" && "message" in err) {
    return [err.message, err.details, err.hint].filter(Boolean).join(" — ") || "Error";
  }
  return String(err);
}

function recordToForm(row) {
  return {
    vehicle_no: String(row.vehicle_no ?? ""),
    fuel_station: String(row.fuel_station ?? ""),
    amount: String(row.total_amount ?? ""),
    is_credit: Boolean(row.is_credit),
  };
}

function StatusBadge({ status }) {
  const styles =
    status === FUEL_STATUS.PAID
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === FUEL_STATUS.PARTIAL
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${styles}`}
    >
      {status}
    </span>
  );
}

export default function FuelManagementPage() {
  const [logs, setLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [installmentLog, setInstallmentLog] = useState(null);
  const [installmentDate, setInstallmentDate] = useState(todayDateValue());
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [installmentSubmitting, setInstallmentSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const stationSuggestions = useMemo(() => uniqueFuelStations(logs), [logs]);

  const paymentsByLog = useMemo(() => {
    const map = new Map();
    for (const payment of payments) {
      const key = payment.fuel_log_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(payment);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );
    }
    return map;
  }, [payments]);

  const paymentsSumByLog = useMemo(() => {
    const map = new Map();
    for (const payment of payments) {
      const key = payment.fuel_log_id;
      map.set(key, (map.get(key) ?? 0) + toNum(payment.amount_paid));
    }
    return map;
  }, [payments]);

  const loadData = useCallback(async () => {
    const [logsRes, paymentsRes] = await Promise.all([
      supabase.from("fuel_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("fuel_payments").select("*").order("payment_date", { ascending: false }),
    ]);
    if (logsRes.error) throw logsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    setLogs(logsRes.data ?? []);
    setPayments(paymentsRes.data ?? []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await loadData();
    } catch (err) {
      setError(dbError(err));
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const amount = toNum(form.amount);
      if (amount <= 0) throw new Error("Please enter a valid amount greater than zero.");
      if (!String(form.vehicle_no).trim()) throw new Error("Please enter a vehicle number.");
      if (!String(form.fuel_station).trim()) throw new Error("Please enter a fuel station name.");

      if (editingId) {
        const paymentsSum = paymentsSumByLog.get(editingId) ?? 0;
        const payload = buildFuelLogUpdatePayload(form, paymentsSum);
        const { error: updateErr } = await supabase
          .from("fuel_logs")
          .update(payload)
          .eq("id", editingId);
        if (updateErr) throw updateErr;
      } else {
        const payload = buildFuelLogInsertPayload(form);
        const { error: insertErr } = await supabase.from("fuel_logs").insert(payload);
        if (insertErr) throw insertErr;
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Are you sure you want to delete this fuel log?")) return;
    setDeletingId(row.id);
    setError("");
    try {
      const { error: deleteErr } = await supabase.from("fuel_logs").delete().eq("id", row.id);
      if (deleteErr) throw deleteErr;
      if (editingId === row.id) resetForm();
      if (expandedId === row.id) setExpandedId(null);
      await loadData();
    } catch (err) {
      setError(dbError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm(recordToForm(row));
    setExpandedId(null);
  };

  const openInstallment = (row) => {
    setInstallmentLog(row);
    setInstallmentDate(todayDateValue());
    setInstallmentAmount("");
    setError("");
  };

  const closeInstallment = () => {
    setInstallmentLog(null);
    setInstallmentAmount("");
  };

  const handleInstallmentSubmit = async (ev) => {
    ev.preventDefault();
    if (!installmentLog) return;

    setInstallmentSubmitting(true);
    setError("");
    try {
      const paid = toNum(installmentAmount);
      if (paid <= 0) throw new Error("Please enter a valid payment amount.");
      if (paid > toNum(installmentLog.remaining_balance)) {
        throw new Error("Payment amount cannot exceed the remaining balance.");
      }

      const { error: paymentErr } = await supabase.from("fuel_payments").insert({
        fuel_log_id: installmentLog.id,
        payment_date: installmentDate,
        amount_paid: paid,
      });
      if (paymentErr) throw paymentErr;

      const update = computeInstallmentUpdate(installmentLog, paid);
      const { error: logErr } = await supabase
        .from("fuel_logs")
        .update(update)
        .eq("id", installmentLog.id);
      if (logErr) throw logErr;

      await loadData();
      closeInstallment();
    } catch (err) {
      setError(dbError(err));
    } finally {
      setInstallmentSubmitting(false);
    }
  };

  const canPayInstallment = (row) =>
    row.status === FUEL_STATUS.PENDING || row.status === FUEL_STATUS.PARTIAL;

  return (
    <>
      <div className="mb-8">
        <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
            <Fuel className="h-5 w-5" strokeWidth={2.2} />
          </span>
          Fuel Management
        </h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-neutral-500">
          Record vehicle fuel purchases, track credit balances, and manage installment payments by
          station.
        </p>
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className={`${CARD} mb-8`}
      >
        <h2 className="mb-1 text-lg font-black text-neutral-950">
          {editingId ? "Edit Fuel Log" : "New Fuel Log"}
        </h2>
        <p className="mb-6 text-sm font-medium text-neutral-500">
          {editingId
            ? "Update this fuel purchase record."
            : "Log a fuel purchase. Enable credit to track outstanding balances."}
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Vehicle No
            </span>
            <input
              className={INPUT}
              value={form.vehicle_no}
              onChange={(ev) => setField("vehicle_no", ev.target.value)}
              placeholder="e.g. CAB-1234"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Fuel Station
            </span>
            <input
              className={INPUT}
              list="fuel-station-suggestions"
              value={form.fuel_station}
              onChange={(ev) => setField("fuel_station", ev.target.value)}
              placeholder="Select or enter station name"
              required
            />
            <datalist id="fuel-station-suggestions">
              {stationSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Amount (Rs.)
            </span>
            <input
              type="number"
              min="0"
              step="any"
              className={INPUT}
              value={form.amount}
              onChange={(ev) => setField("amount", ev.target.value)}
              placeholder="0"
              required
            />
          </label>

          <label className="flex items-center gap-3 self-end rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
            <input
              type="checkbox"
              checked={form.is_credit}
              onChange={(ev) => setField("is_credit", ev.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
            />
            <span className="text-sm font-bold text-neutral-800">
              Purchase on Credit
            </span>
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-3.5 text-sm font-black text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Update Log" : "Save Log"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.4, ease: EASE }}
        className={CARD}
      >
        <h2 className="mb-1 text-lg font-black text-neutral-950">Fuel History</h2>
        <p className="mb-6 text-sm font-medium text-neutral-500">
          Click a record to view installment payment history.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-sm font-semibold text-neutral-400">
            No fuel logs recorded yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-neutral-50">
                  <tr>
                    {[
                      "",
                      "Date",
                      "Vehicle No",
                      "Fuel Station",
                      "Total Amount",
                      "Status",
                      "Remaining",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h || "expand"}
                        className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-neutral-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => {
                    const expanded = expandedId === row.id;
                    const rowPayments = paymentsByLog.get(row.id) ?? [];
                    const rowDeleting = deletingId === row.id;

                    return (
                      <Fragment key={row.id}>
                        <tr
                          className={`border-t border-neutral-100 ${expanded ? "bg-neutral-50/80" : "hover:bg-neutral-50/50"}`}
                        >
                          <td className="px-2 py-3">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : row.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950"
                              aria-label={expanded ? "Collapse details" : "Expand payment history"}
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-neutral-800">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-bold text-neutral-950">
                            {row.vehicle_no || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-neutral-800">
                            {row.fuel_station || "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-bold text-neutral-950">
                            {moneyFullLkr(row.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-bold text-neutral-800">
                            {moneyFullLkr(row.remaining_balance)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {canPayInstallment(row) ? (
                                <button
                                  type="button"
                                  onClick={() => openInstallment(row)}
                                  disabled={rowDeleting}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-black uppercase tracking-wide text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  <Wallet className="h-3.5 w-3.5" />
                                  Pay Installment
                                </button>
                              ) : null}
                              <button
                                type="button"
                                title="Edit"
                                onClick={() => handleEdit(row)}
                                disabled={rowDeleting}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Delete"
                                onClick={() => handleDelete(row)}
                                disabled={rowDeleting}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                              >
                                {rowDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="border-t border-neutral-100 bg-neutral-50/60">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="rounded-xl border border-neutral-100 bg-white p-4">
                                <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-neutral-500">
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Installment Payment History
                                </h3>
                                {rowPayments.length === 0 ? (
                                  <p className="text-sm font-medium text-neutral-400">
                                    No installment payments recorded for this log.
                                  </p>
                                ) : (
                                  <ul className="space-y-2">
                                    {rowPayments.map((payment) => (
                                      <li
                                        key={payment.id}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-sm"
                                      >
                                        <span className="font-semibold text-neutral-700">
                                          {formatDate(payment.payment_date)}
                                        </span>
                                        <span className="font-mono font-bold text-emerald-800">
                                          {moneyFullLkr(payment.amount_paid)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.section>

      <AnimatePresence>
        {installmentLog ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close installment modal"
              onClick={closeInstallment}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-neutral-100 bg-white p-6 shadow-2xl sm:p-8"
            >
              <h3 className="text-lg font-black text-neutral-950">Pay Installment</h3>
              <p className="mt-1 text-sm font-medium text-neutral-500">
                {installmentLog.fuel_station} — Remaining {moneyFullLkr(installmentLog.remaining_balance)}
              </p>

              <form onSubmit={handleInstallmentSubmit} className="mt-6 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                    Payment Date
                  </span>
                  <input
                    type="date"
                    className={INPUT}
                    value={installmentDate}
                    onChange={(ev) => setInstallmentDate(ev.target.value)}
                    required
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                    Amount Paid (Rs.)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={INPUT}
                    value={installmentAmount}
                    onChange={(ev) => setInstallmentAmount(ev.target.value)}
                    placeholder="0"
                    required
                  />
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={installmentSubmitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-950 py-3 text-sm font-black text-white transition hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {installmentSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={closeInstallment}
                    disabled={installmentSubmitting}
                    className="rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
