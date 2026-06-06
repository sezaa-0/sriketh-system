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
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const EASE_FLOW = [0.22, 1, 0.36, 1];

const GLASS_PANEL =
  "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl";

const DEFAULT_BANKS = [
  "BOC",
  "Peoples Bank",
  "Commercial Bank",
  "Sampath Bank",
  "HNB",
  "Cash in Hand",
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

function GlassEnergy({ colors, duration = 22 }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -inset-[45%] opacity-60 blur-3xl"
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      style={{
        background: `conic-gradient(from 0deg, ${colors.join(", ")})`,
      }}
    />
  );
}

export default function DayCashPage() {
  const [records, setRecords] = useState([]);
  const [bankOptions, setBankOptions] = useState([...DEFAULT_BANKS]);
  const [filterDate, setFilterDate] = useState(todayDateValue);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      bank_name: bankOptions.includes("Cash in Hand")
        ? DEFAULT_BANKS[0]
        : bankOptions[0] ?? DEFAULT_BANKS[0],
    });
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
    refresh();
  }, [refresh]);

  useEffect(() => {
    setForm((prev) => {
      if (bankOptions.includes(prev.bank_name)) return prev;
      return { ...prev, bank_name: bankOptions[0] ?? DEFAULT_BANKS[0] };
    });
  }, [bankOptions]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen px-4 py-8 text-white sm:px-8 lg:px-16 lg:py-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]"
      />

      <div className="relative z-10 mx-auto max-w-[1600px]">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_FLOW }}
          className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black text-white/90 transition hover:border-cyan-400/40 hover:bg-cyan-500/15 hover:text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Back to Dashboard
          </Link>
          <div className="sm:text-right">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              💰 Day Cash Book Ledger
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/45">
              Independent daily cash flow — deposits &amp; withdrawals
            </p>
          </div>
        </motion.header>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        ) : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.42, ease: EASE_FLOW }}
            className={`${GLASS_PANEL} p-6 sm:p-7`}
          >
            <GlassEnergy colors={["#10b981", "#34d399", "#6ee7b7", "#10b981"]} duration={18} />
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-emerald-300" strokeWidth={2.2} />
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-200/80">
                  Today&apos;s Total Cash In
                </p>
              </div>
              <p className="font-mono text-4xl font-black text-emerald-200 sm:text-5xl">
                {moneyFullLkr(cashInTotal)}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.42, ease: EASE_FLOW }}
            className={`${GLASS_PANEL} p-6 sm:p-7`}
          >
            <GlassEnergy colors={["#fb7185", "#f43f5e", "#fda4af", "#fb7185"]} duration={20} />
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-rose-300" strokeWidth={2.2} />
                <p className="text-[11px] font-bold uppercase tracking-wide text-rose-200/80">
                  Today&apos;s Total Cash Out
                </p>
              </div>
              <p className="font-mono text-4xl font-black text-rose-200 sm:text-5xl">
                {moneyFullLkr(cashOutTotal)}
              </p>
            </div>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.45, ease: EASE_FLOW }}
              className={`${GLASS_PANEL} p-6 sm:p-8 ${isEditing ? "ring-2 ring-cyan-400/35" : ""}`}
            >
              <GlassEnergy colors={["#22d3ee", "#0891b2", "#67e8f9", "#22d3ee"]} duration={26} />
              <div className="relative z-10">
                <h2 className="mb-5 text-sm font-black uppercase tracking-wide text-white/70">
                  {isEditing ? "Edit Transaction" : "New Cash Entry"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      Transaction Type
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
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                      Description / Notes
                    </span>
                    <textarea
                      rows={4}
                      className={`${INPUT} resize-none`}
                      value={form.description}
                      onChange={(ev) => setField("description", ev.target.value)}
                      placeholder="Enter details of why the cash came in or went out..."
                      required
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={actionBusy}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/30 disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {isEditing ? "Update" : "Save Transaction"}
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
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45, ease: EASE_FLOW }}
              className={`${GLASS_PANEL} p-6 sm:p-8`}
            >
              <GlassEnergy colors={["#8b5cf6", "#6366f1", "#a78bfa", "#8b5cf6"]} duration={24} />
              <div className="relative z-10">
                <div className="mb-5">
                  <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-white/70">
                    Live Date Search
                  </h2>
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
                </div>

                <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-white/70">
                  Transaction History Log
                </h3>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="max-h-[520px] overflow-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                      <thead className="sticky top-0 bg-white/10 backdrop-blur-md">
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
                              className="px-4 py-12 text-center text-sm font-semibold text-white/55"
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
                                <td className="max-w-[200px] px-4 py-3 text-sm font-semibold text-white/80">
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
            </motion.section>
          </div>
        )}
      </div>
    </motion.main>
  );
}
