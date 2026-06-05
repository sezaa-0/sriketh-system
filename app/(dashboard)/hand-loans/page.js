"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import {
  User,
  Coins,
  FileText,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  AlertCircle,
} from "lucide-react";

const LOAN_RECEIVABLE = "receivable";
const LOAN_PAYABLE = "payable";

const T = {
  pageTitle: "Hand Loans",
  alertReceivable: "💡 Total hand loans receivable",
  alertPayable: "🚨 Total hand loans payable",
  formTitle: "Hand Loan Details",
  person: "Name",
  amount: "Amount",
  description: "Description",
  loanType: "Type",
  typeReceivable: "🟩 Lent by me",
  typePayable: "🟥 Borrowed by me",
  feedTitle: "Active Hand Loans",
  tabReceivable: "People who borrowed from me",
  tabPayable: "People I borrowed from",
  emptyReceivable: "No receivables",
  emptyPayable: "No payables",
  save: "Save",
  settle: "Settle",
  empty: "No active hand loans",
};

const INITIAL_FORM = {
  person_name: "",
  amount: "",
  description: "",
  loan_type: LOAN_RECEIVABLE,
};

const INPUT =
  "w-full min-w-0 bg-[#EFEFEF]/70 border-0 rounded-2xl p-4 font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none";

const pageEnter = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardHoverMotion = {
  y: -6,
  scale: 1.01,
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

function supabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

const supabase = createClient(
  supabaseUrl(),
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

function dbError(err) {
  if (!err) return "Database error";
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const e = err;
    return [e.message, e.details, e.hint].filter(Boolean).join(" — ") || "Error";
  }
  return String(err);
}

function toNum(v) {
  if (v == null || String(v).trim() === "") return 0;
  const n = parseFloat(String(v).trim());
  return Number.isNaN(n) ? 0 : n;
}

/** @param {Record<string, unknown>} row */
function mapLoan(row) {
  const type = String(row.loan_type ?? "").trim() === LOAN_PAYABLE ? LOAN_PAYABLE : LOAN_RECEIVABLE;
  return {
    id: String(row.id),
    person_name: String(row.person_name ?? "").trim(),
    amount: Number(row.amount ?? 0),
    description: String(row.description ?? "").trim(),
    loan_type: type,
    is_settled: Boolean(row.is_settled),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

/** @param {ReturnType<mapLoan>[]} loans */
function alertTotals(loans) {
  let receivable = 0;
  let payable = 0;
  for (const l of loans) {
    if (l.is_settled) continue;
    if (l.loan_type === LOAN_RECEIVABLE) receivable += l.amount;
    else payable += l.amount;
  }
  return { receivable, payable };
}

/** @param {typeof INITIAL_FORM} form */
function buildPayload(form) {
  const loan_type =
    String(form.loan_type).trim() === LOAN_PAYABLE ? LOAN_PAYABLE : LOAN_RECEIVABLE;
  return {
    person_name: String(form.person_name ?? "").trim(),
    amount: toNum(form.amount),
    description: String(form.description ?? "").trim(),
    loan_type,
    is_settled: false,
  };
}

async function loadLoans() {
  const { data, error } = await supabase
    .from("hand_loans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase Fetch Error Detailed:", error);
    throw new Error(dbError(error));
  }
  return (data ?? []).map(mapLoan);
}

/** @param {typeof INITIAL_FORM} form */
async function insertLoan(form) {
  const payload = buildPayload(form);
  const { data, error } = await supabase.from("hand_loans").insert(payload).select().single();
  if (error) {
    console.error("Supabase Insert Error Detailed:", error, payload);
    throw new Error(dbError(error));
  }
  if (!data) throw new Error("Save failed");
  return mapLoan(data);
}

/** @param {string} id */
async function settleLoanById(id) {
  const { data, error } = await supabase
    .from("hand_loans")
    .update({ is_settled: true })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Supabase Settle Error Detailed:", error);
    throw new Error(dbError(error));
  }
  if (!data) throw new Error("Settle action failed");
  return mapLoan(data);
}

function moneyPlain(n) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(n);
}

function moneyFullLkr(n) {
  const abs = Math.abs(Number(n) || 0);
  const sign = n < 0 ? "-" : "";
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(abs);
  return `${sign}Rs. ${fmt}`;
}

function trimLakhDecimal(n) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

/** @param {number} amount @returns {{ main: string; sub: string }} */
function formatSinhalaLakhCrore(amount) {
  const n = Math.abs(Number(amount) || 0);
  const sign = amount < 0 ? "-" : "";
  const sub = moneyFullLkr(amount);

  if (n < 100_000) {
    return { main: `${sign}${moneyPlain(n)}`, sub };
  }

  if (n < 10_000_000) {
    const lakhs = n / 100_000;
    return { main: `${sign}Lakh ${trimLakhDecimal(lakhs)}`, sub };
  }

  const crores = Math.floor(n / 10_000_000);
  const remainder = n % 10_000_000;
  const lakhPart = Math.round(remainder / 100_000);
  let main = `${sign}Crore ${crores}`;
  if (lakhPart > 0) main += ` Lakh ${lakhPart}`;
  return { main, sub };
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("si-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

/** @param {{ title: string; amount: number; variant: 'receivable' | 'payable' }} props */
function TopAlert({ title, amount, variant }) {
  const fin = formatSinhalaLakhCrore(amount);
  const isRecv = variant === "receivable";

  return (
    <motion.div
      variants={staggerChild}
      initial="hidden"
      animate="show"
      whileHover={{ y: -2 }}
      className={`flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${
        isRecv
          ? "border-emerald-200/60 bg-emerald-50/80"
          : "border-rose-200/60 bg-rose-50/80"
      }`}
    >
      <p
        className={`min-w-0 flex-1 text-[13px] font-bold leading-snug sm:text-[14px] ${
          isRecv ? "text-emerald-900" : "text-rose-900"
        }`}
        lang="si"
      >
        {title}
      </p>
      <div className="shrink-0 text-right">
        <p
          className={`text-2xl font-black tracking-tight sm:text-3xl ${
            isRecv ? "text-emerald-800" : "text-rose-800"
          }`}
          lang="si"
        >
          {fin.main}
        </p>
        <p className={`mt-0.5 text-[11px] font-bold tabular-nums ${isRecv ? "text-emerald-700/70" : "text-rose-700/70"}`}>
          {fin.sub}
        </p>
      </div>
    </motion.div>
  );
}

/** @param {{ loan: ReturnType<mapLoan>; index: number; onSettle: () => void; settling: boolean }} props */
function LoanCard({ loan, index, onSettle, settling }) {
  const isRecv = loan.loan_type === LOAN_RECEIVABLE;
  const fin = formatSinhalaLakhCrore(loan.amount);

  return (
    <motion.article
      layout
      custom={index}
      variants={staggerChild}
      initial="hidden"
      animate="show"
      whileHover={cardHoverMotion}
      className={`relative flex min-w-0 flex-col overflow-visible rounded-[24px] border border-neutral-100 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.05)] ${
        isRecv ? "border-l-8 border-l-emerald-500" : "border-l-8 border-l-rose-500"
      } ${settling ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500" lang="si">
            {isRecv ? T.typeReceivable : T.typePayable}
          </p>
          <h3 className="mt-1 break-words text-xl font-black text-neutral-900" lang="si">
            {loan.person_name || "—"}
          </h3>
          <p className="mt-2 break-words text-[13px] font-semibold text-neutral-600" lang="si">
            {loan.description || "—"}
          </p>
          <time className="mt-2 block text-[11px] font-bold text-neutral-400">
            {formatDate(loan.created_at)}
          </time>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`text-2xl font-black tabular-nums ${isRecv ? "text-emerald-700" : "text-rose-700"}`}
            lang="si"
          >
            {fin.main}
          </p>
          <p className="text-[11px] font-bold tabular-nums text-neutral-500">{fin.sub}</p>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onSettle}
        disabled={settling}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-white transition-all duration-300 ${
          isRecv
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-rose-600 hover:bg-rose-700"
        } disabled:opacity-50`}
        lang="si"
      >
        <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        {T.settle}
      </motion.button>
    </motion.article>
  );
}

export default function HandLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settlingId, setSettlingId] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [feedTab, setFeedTab] = useState(LOAN_RECEIVABLE);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setLoans(await loadLoans());
    } catch (e) {
      console.error("Supabase Fetch Error Detailed:", e);
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totals = useMemo(() => alertTotals(loans), [loans]);

  const activeLoans = useMemo(() => loans.filter((l) => !l.is_settled), [loans]);

  const filteredFeedLoans = useMemo(() => {
    return activeLoans.filter((l) => l.loan_type === feedTab);
  }, [activeLoans, feedTab]);

  const setField = useCallback((key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!String(form.person_name ?? "").trim()) {
      setError("Name is required");
      return;
    }
    if (toNum(form.amount) <= 0) {
      setError("Enter amount");
      return;
    }

    setSaving(true);
    try {
      await insertLoan(form);
      setForm({ ...INITIAL_FORM });
      await refresh();
    } catch (err) {
      console.error("Supabase Save Error Detailed:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async (loan) => {
    setSettlingId(loan.id);
    setError(null);
    try {
      await settleLoanById(loan.id);
      await refresh();
    } catch (err) {
      console.error("Supabase Settle Error Detailed:", err);
      setError(err instanceof Error ? err.message : "Settle action failed");
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <motion.div
      variants={pageEnter}
      initial="hidden"
      animate="show"
      className="w-full min-h-screen bg-[#F4F4F7] px-8 py-12 text-neutral-950 lg:px-16"
    >
      <header className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight lg:text-5xl" lang="si">
          <HandCoins className="h-10 w-10 shrink-0 text-neutral-800" strokeWidth={2} />
          {T.pageTitle}
        </h1>
      </header>

      {error ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-[13px] font-bold text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.p>
      ) : null}

      <div className="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <TopAlert title={T.alertReceivable} amount={totals.receivable} variant="receivable" />
        <TopAlert title={T.alertPayable} amount={totals.payable} variant="payable" />
      </div>

      <div className="grid w-full grid-cols-1 gap-8 xl:grid-cols-2">
        <motion.section
          variants={pageEnter}
          className="min-w-0 rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.02)] lg:p-8"
        >
          <h2 className="mb-6 text-[13px] font-black uppercase tracking-[0.25em] text-neutral-950" lang="si">
            {T.formTitle}
          </h2>

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div>
              <label className="mb-2 block text-[12px] font-black uppercase tracking-wider text-neutral-800" lang="si">
                {T.person}
              </label>
              <div className="relative min-w-0">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  name="person_name"
                  className={`${INPUT} pl-12`}
                  value={form.person_name}
                  onChange={(ev) => setField("person_name", ev.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[12px] font-black uppercase tracking-wider text-neutral-800" lang="si">
                {T.amount}
              </label>
              <div className="relative min-w-0">
                <Coins className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  name="amount"
                  type="number"
                  min="0"
                  className={`${INPUT} pl-12`}
                  value={form.amount}
                  onChange={(ev) => setField("amount", ev.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[12px] font-black uppercase tracking-wider text-neutral-800" lang="si">
                {T.description}
              </label>
              <div className="relative min-w-0">
                <FileText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-neutral-500" />
                <textarea
                  name="description"
                  rows={3}
                  className={`${INPUT} min-h-[96px] resize-y pl-12`}
                  value={form.description}
                  onChange={(ev) => setField("description", ev.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-neutral-800" lang="si">
                {T.loanType}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { id: LOAN_RECEIVABLE, label: T.typeReceivable, green: true },
                  { id: LOAN_PAYABLE, label: T.typePayable, green: false },
                ].map((opt) => {
                  const on = form.loan_type === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setField("loan_type", opt.id)}
                      className={`rounded-xl px-3 py-4 text-[13px] font-bold leading-snug transition-all duration-300 ${
                        on
                          ? opt.green
                            ? "bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400"
                            : "bg-rose-50 text-rose-900 ring-2 ring-rose-400"
                          : "bg-[#F4F4F7] text-neutral-600 hover:bg-neutral-100"
                      }`}
                      lang="si"
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-8 py-4 text-[15px] font-black text-white shadow-lg transition-all duration-300 hover:bg-neutral-800 disabled:opacity-50"
              lang="si"
            >
              <ArrowUpRight className="h-5 w-5 shrink-0" />
              {T.save}
            </motion.button>
          </form>
        </motion.section>

        <motion.section variants={pageEnter} className="min-w-0">
          <h2 className="mb-4 text-[13px] font-black uppercase tracking-[0.25em] text-neutral-950" lang="si">
            {T.feedTitle}
          </h2>

          <div className="mb-6 w-full rounded-2xl bg-neutral-200/50 p-2 shadow-inner backdrop-blur-xl">
            <div className="relative flex w-full">
              {[
                {
                  id: LOAN_RECEIVABLE,
                  label: T.tabReceivable,
                  icon: ArrowDownLeft,
                },
                {
                  id: LOAN_PAYABLE,
                  label: T.tabPayable,
                  icon: ArrowUpRight,
                },
              ].map((t) => {
                const on = feedTab === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFeedTab(t.id)}
                    className="relative flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3"
                  >
                    {on ? (
                      <motion.span
                        layoutId="handLoansFeedTabPill"
                        className="absolute inset-0 rounded-xl bg-white/95 shadow-lg ring-1 ring-white/80 backdrop-blur-md"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <Icon
                      className={`relative z-10 h-4 w-4 shrink-0 ${
                        on
                          ? t.id === LOAN_RECEIVABLE
                            ? "text-emerald-600"
                            : "text-rose-600"
                          : "text-neutral-400"
                      }`}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span
                      className={`relative z-10 whitespace-nowrap text-center text-[12px] font-bold leading-tight sm:text-[13px] ${
                        on ? "text-neutral-950" : "text-neutral-500"
                      }`}
                      lang="si"
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-[24px] bg-white/80" />
              ))}
            </div>
          ) : filteredFeedLoans.length === 0 ? (
            <motion.div
              key={feedTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-[24px] border border-neutral-100 bg-white py-20 text-center shadow-[0_12px_40px_rgba(0,0,0,0.02)]"
            >
              <p className="text-lg font-black text-neutral-500" lang="si">
                {feedTab === LOAN_RECEIVABLE ? T.emptyReceivable : T.emptyPayable}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={feedTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {filteredFeedLoans.map((loan, i) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  index={i}
                  settling={settlingId === loan.id}
                  onSettle={() => handleSettle(loan)}
                />
              ))}
            </motion.div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
