"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BankLogo, BankPicker } from "@/components/ui/BankPicker";
import { DAY_CASH_BANK_OPTIONS, findBank, normalizeBankName } from "@/lib/sri-lankan-banks";

const EASE_FLOW = [0.22, 1, 0.36, 1];

const INPUT =
  "w-full min-w-0 rounded-2xl border-0 bg-[#EFEFEF]/70 p-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-neutral-950";

const CARD =
  "rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-8";

const INITIAL_FORM = {
  bank_name: "",
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
    bank_name: normalizeBankName(row.bank_name),
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

export default function DayCashPage() {
  const [records, setRecords] = useState([]);
  const [filterDate, setFilterDate] = useState(todayDateValue);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
  };

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
      await loadRecords();
    } catch (err) {
      setError(dbError(err));
    } finally {
      setLoading(false);
    }
  }, [loadRecords]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
    if (!description) throw new Error("Please enter a description or notes.");
    const bankName = normalizeBankName(form.bank_name);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_FLOW }}
      className="min-h-screen bg-white px-4 py-8 text-neutral-900 sm:px-6 lg:px-8 lg:py-10"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-bold text-neutral-800 transition hover:border-neutral-300 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Back to Dashboard
          </Link>
          <div className="sm:text-right">
            <h1 className="text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
              💰 Day Cash Book Ledger
            </h1>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Independent daily cash flow — deposits &amp; withdrawals
            </p>
          </div>
        </header>

        {error ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        ) : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4, ease: EASE_FLOW }}
            className="flex min-h-[132px] flex-col justify-center rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-100/80 to-emerald-200 p-6 text-emerald-950 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-emerald-700" strokeWidth={2.2} />
              <p className="text-sm font-bold text-emerald-900">Today&apos;s Total Cash In</p>
            </div>
            <p className="font-mono text-4xl font-black tracking-tight sm:text-5xl">
              {moneyFullLkr(cashInTotal)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE_FLOW }}
            className="flex min-h-[132px] flex-col justify-center rounded-[28px] border border-rose-200 bg-gradient-to-br from-rose-50 via-rose-100/80 to-rose-200 p-6 text-rose-950 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-rose-700" strokeWidth={2.2} />
              <p className="text-sm font-bold text-rose-900">Today&apos;s Total Cash Out</p>
            </div>
            <p className="font-mono text-4xl font-black tracking-tight sm:text-5xl">
              {moneyFullLkr(cashOutTotal)}
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-neutral-300" />
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[minmax(320px,400px)_1fr]">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.42, ease: EASE_FLOW }}
              className={`h-fit ${CARD} xl:sticky xl:top-8 ${isEditing ? "ring-2 ring-neutral-950/10" : ""}`}
            >
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-neutral-950">
                <Plus className="h-5 w-5" />
                {isEditing ? "Edit Transaction" : "New Cash Entry"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    Bank Name
                  </label>
                  <BankPicker
                    value={form.bank_name}
                    onChange={(name) => setField("bank_name", name)}
                    banks={DAY_CASH_BANK_OPTIONS}
                    placeholder="Select a bank"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    Transaction Type
                  </label>
                  <select
                    className={INPUT}
                    value={form.transaction_type}
                    onChange={(ev) => setField("transaction_type", ev.target.value)}
                  >
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={INPUT}
                    value={form.amount}
                    onChange={(ev) => setField("amount", ev.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    Description / Notes
                  </label>
                  <textarea
                    rows={4}
                    className={`${INPUT} resize-none`}
                    value={form.description}
                    onChange={(ev) => setField("description", ev.target.value)}
                    placeholder="Enter details of why the cash came in or went out..."
                    required
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={actionBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isEditing ? "Update" : "Save Transaction"}
                  </button>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={actionBusy}
                      className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-black text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.42, ease: EASE_FLOW }}
              className={CARD}
            >
              <div className="mb-6">
                <h2 className="mb-3 text-lg font-black text-neutral-950">Live Date Search</h2>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-neutral-500">
                    Filter by Date
                  </span>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="date"
                      className={`${INPUT} pl-11`}
                      value={filterDate}
                      onChange={(ev) => setFilterDate(ev.target.value)}
                    />
                  </div>
                </label>
              </div>

              <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-neutral-500">
                Transaction History Log
              </h3>
              <div className="overflow-hidden rounded-2xl border border-neutral-100">
                <div className="max-h-[560px] overflow-auto [scrollbar-width:thin]">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead className="sticky top-0 bg-neutral-50">
                      <tr>
                        {["Time", "Bank", "Type", "Amount", "Description", "Actions"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-neutral-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dayRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-sm font-semibold text-neutral-400"
                          >
                            No day cash transactions for this date.
                          </td>
                        </tr>
                      ) : (
                        dayRecords.map((row) => {
                          const isDeposit = row.transaction_type === "Deposit";
                          const rowDeleting = deletingId === row.id;
                          const rowEditing = editingId === row.id;
                          const bankMeta = findBank(row.bank_name, DAY_CASH_BANK_OPTIONS);
                          const bankLabel = normalizeBankName(row.bank_name) || row.bank_name || "—";
                          return (
                            <tr
                              key={row.id}
                              className={`border-t border-neutral-100 ${rowEditing ? "bg-sky-50/80" : "bg-white"}`}
                            >
                              <td className="px-4 py-3 font-mono text-sm font-semibold text-neutral-700">
                                {formatTime(row.transaction_at || row.created_at)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <BankLogo bank={bankMeta} />
                                  <span className="text-sm font-bold text-neutral-900">
                                    {bankLabel}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
                                    isDeposit
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border-rose-200 bg-rose-50 text-rose-800"
                                  }`}
                                >
                                  {row.transaction_type}
                                </span>
                              </td>
                              <td
                                className={`px-4 py-3 font-mono text-sm font-black ${
                                  isDeposit ? "text-emerald-700" : "text-rose-700"
                                }`}
                              >
                                {moneyFullLkr(row.amount)}
                              </td>
                              <td className="max-w-[200px] px-4 py-3 text-sm font-semibold text-neutral-700">
                                <span className="line-clamp-2">{row.description || "—"}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    title="Edit"
                                    onClick={() => handleEdit(row)}
                                    disabled={actionBusy || rowDeleting}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
                                  >
                                    <Pencil className="h-4 w-4" strokeWidth={2.2} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete"
                                    onClick={() => handleDelete(row)}
                                    disabled={actionBusy || rowDeleting}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
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
            </motion.section>
          </div>
        )}
      </div>
    </motion.main>
  );
}
