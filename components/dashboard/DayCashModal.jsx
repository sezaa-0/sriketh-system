"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const EASE_FLOW = [0.22, 1, 0.36, 1];

const DEFAULT_BANKS = [
  "BOC",
  "Peoples Bank",
  "Commercial Bank",
  "Sampath Bank",
  "HNB",
];

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-white/35 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20";

const INITIAL_FORM = {
  bank_name: DEFAULT_BANKS[0],
  transaction_type: "Deposit",
  amount: "",
  description: "",
};

function todayDateValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function rowDateKey(row) {
  if (row.transaction_date) {
    return String(row.transaction_date).slice(0, 10);
  }
  const raw = row.transaction_at || row.created_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function recordToForm(row) {
  return {
    bank_name: String(row.bank_name ?? DEFAULT_BANKS[0]),
    transaction_type:
      row.transaction_type === "Withdrawal" ? "Withdrawal" : "Deposit",
    amount: String(row.amount ?? ""),
    description: String(row.description ?? ""),
  };
}

function dbError(err) {
  if (err && typeof err === "object" && "message" in err) {
    return [err.message, err.details, err.hint].filter(Boolean).join(" — ") || "Error";
  }
  return String(err);
}

export function DayCashModal({ open, onClose }) {
  const [records, setRecords] = useState([]);
  const [bankOptions, setBankOptions] = useState([...DEFAULT_BANKS]);
  const [filterDate, setFilterDate] = useState(todayDateValue);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm({ ...INITIAL_FORM, bank_name: bankOptions[0] ?? DEFAULT_BANKS[0] });
    setEditingId(null);
  };

  const loadBankOptions = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from("bank_accounts")
      .select("bank_name");
    if (fetchErr && !String(fetchErr.message).includes("does not exist")) {
      throw fetchErr;
    }
    const fromDb = [
      ...new Set((data ?? []).map((r) => String(r.bank_name ?? "").trim()).filter(Boolean)),
    ];
    const merged = [...new Set([...DEFAULT_BANKS, ...fromDb])];
    setBankOptions(merged);
    return merged;
  }, []);

  const loadRecords = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from("day_cash_log")
      .select("*")
      .eq("is_active", true)
      .order("transaction_at", { ascending: false });
    if (fetchErr) throw fetchErr;
    setRecords(data ?? []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await loadBankOptions();
      await loadRecords();
    } catch (err) {
      setError(dbError(err));
    } finally {
      setLoading(false);
    }
  }, [loadBankOptions, loadRecords]);

  useEffect(() => {
    if (!open) return;
    setFilterDate(todayDateValue());
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => {
      if (bankOptions.includes(prev.bank_name)) return prev;
      return { ...prev, bank_name: bankOptions[0] ?? DEFAULT_BANKS[0] };
    });
  }, [bankOptions, open]);

  const dayRecords = useMemo(
    () =>
      records
        .filter((row) => rowDateKey(row) === filterDate)
        .sort(
          (a, b) =>
            new Date(b.transaction_at || b.created_at).getTime() -
            new Date(a.transaction_at || a.created_at).getTime()
        ),
    [records, filterDate]
  );

  const cashInTotal = useMemo(
    () =>
      dayRecords
        .filter((r) => r.transaction_type === "Deposit")
        .reduce((sum, r) => sum + toNum(r.amount), 0),
    [dayRecords]
  );

  const cashOutTotal = useMemo(
    () =>
      dayRecords
        .filter((r) => r.transaction_type === "Withdrawal")
        .reduce((sum, r) => sum + toNum(r.amount), 0),
    [dayRecords]
  );

  const buildPayload = () => {
    const amount = toNum(form.amount);
    if (amount <= 0) throw new Error("Please enter a valid amount greater than zero.");
    const description = String(form.description ?? "").trim();
    if (!description) throw new Error("Please enter a description or purpose.");
    const bankName = String(form.bank_name ?? "").trim();
    if (!bankName) throw new Error("Please select a bank.");

    return {
      bank_name: bankName,
      transaction_type: form.transaction_type === "Withdrawal" ? "Withdrawal" : "Deposit",
      amount,
      description,
      transaction_date: filterDate,
      transaction_at: new Date().toISOString(),
      is_active: true,
    };
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = buildPayload();

      if (editingId) {
        const existing = records.find((r) => r.id === editingId);
        const { error: updateErr } = await supabase
          .from("day_cash_log")
          .update({
            ...payload,
            transaction_date: existing ? rowDateKey(existing) || filterDate : filterDate,
          })
          .eq("id", editingId);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from("day_cash_log").insert(payload);
        if (insertErr) throw insertErr;
      }

      await loadRecords();
      resetForm();
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm(recordToForm(row));
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Are you sure you want to delete this day cash record?")) return;
    setDeletingId(row.id);
    setError("");
    try {
      const { error: deleteErr } = await supabase
        .from("day_cash_log")
        .update({ is_active: false })
        .eq("id", row.id);
      if (deleteErr) throw deleteErr;
      if (editingId === row.id) resetForm();
      await loadRecords();
    } catch (err) {
      setError(dbError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const isEditing = Boolean(editingId);
  const actionBusy = submitting || Boolean(deletingId);

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
                <h3 className="text-lg font-black text-white sm:text-xl">Day Cash</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/45">
                  Daily cash deposits &amp; withdrawals by bank
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
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                    Filter by Date
                  </span>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
                    <input
                      type="date"
                      className={`${INPUT} pl-10`}
                      value={filterDate}
                      onChange={(ev) => setFilterDate(ev.target.value)}
                    />
                  </div>
                </label>
                {loading ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-white/45">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing records...
                  </div>
                ) : null}
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 shadow-[0_0_24px_rgba(52,211,153,0.12)]">
                  <div className="mb-2 flex items-center gap-2">
                    <ArrowDownCircle className="h-5 w-5 text-emerald-300" strokeWidth={2.2} />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-200/80">
                      Today&apos;s Total Cash In
                    </p>
                  </div>
                  <p className="font-mono text-3xl font-black text-emerald-200">
                    {moneyFullLkr(cashInTotal)}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 shadow-[0_0_24px_rgba(251,113,133,0.12)]">
                  <div className="mb-2 flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-rose-300" strokeWidth={2.2} />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-rose-200/80">
                      Today&apos;s Total Cash Out
                    </p>
                  </div>
                  <p className="font-mono text-3xl font-black text-rose-200">
                    {moneyFullLkr(cashOutTotal)}
                  </p>
                </div>
              </div>

              {error ? (
                <div className="mb-5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h4 className="text-sm font-black uppercase tracking-wide text-white/70">
                  {isEditing ? "Edit Transaction" : "New Transaction"}
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Bank Name
                    </span>
                    <select
                      className={INPUT}
                      value={form.bank_name}
                      onChange={(ev) => setField("bank_name", ev.target.value)}
                      required
                    >
                      {bankOptions.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Type
                    </span>
                    <select
                      className={INPUT}
                      value={form.transaction_type}
                      onChange={(ev) => setField("transaction_type", ev.target.value)}
                    >
                      <option value="Deposit">Deposit</option>
                      <option value="Withdrawal">Withdrawal</option>
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Amount (Rs.)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={INPUT}
                      value={form.amount}
                      onChange={(ev) => setField("amount", ev.target.value)}
                      required
                    />
                  </label>
                  <label className="block space-y-1.5 sm:col-span-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Description / Purpose
                    </span>
                    <textarea
                      rows={3}
                      className={`${INPUT} resize-none`}
                      value={form.description}
                      onChange={(ev) => setField("description", ev.target.value)}
                      placeholder="Enter details of why the cash came in or went out..."
                      required
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/30 disabled:opacity-60"
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
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="mt-8">
                <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-white/70">
                  Transaction History Log
                </h4>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="max-h-[300px] overflow-auto">
                    <table className="w-full min-w-[880px] border-collapse text-left">
                      <thead className="sticky top-0 bg-white/10">
                        <tr>
                          {["Time", "Bank", "Type", "Amount", "Description", "Actions"].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-white/75"
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {dayRecords.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center text-sm font-semibold text-white/55"
                            >
                              No day cash transactions for this date.
                            </td>
                          </tr>
                        ) : (
                          dayRecords.map((row) => {
                            const isDeposit = row.transaction_type === "Deposit";
                            const rowDeleting = deletingId === row.id;
                            const rowEditing = editingId === row.id;
                            return (
                              <tr
                                key={row.id}
                                className={`border-t border-white/10 ${rowEditing ? "bg-cyan-500/10" : ""}`}
                              >
                                <td className="px-4 py-3 font-mono text-sm font-semibold text-white/85">
                                  {formatTime(row.transaction_at || row.created_at)}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-white/90">
                                  {row.bank_name || "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
                                      isDeposit
                                        ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                                        : "border-rose-400/35 bg-rose-500/15 text-rose-200"
                                    }`}
                                  >
                                    {row.transaction_type}
                                  </span>
                                </td>
                                <td
                                  className={`px-4 py-3 font-mono text-sm font-black ${
                                    isDeposit ? "text-emerald-200" : "text-rose-200"
                                  }`}
                                >
                                  {moneyFullLkr(row.amount)}
                                </td>
                                <td className="max-w-[220px] px-4 py-3 text-sm font-semibold text-white/80">
                                  <span className="line-clamp-2">{row.description || "—"}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
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
