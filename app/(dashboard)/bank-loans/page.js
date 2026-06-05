"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Activity,
  History,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
  Trash2,
  Edit2,
  CheckCircle,
} from "lucide-react";

const INTEREST_MONTHLY = "monthly";
const INTEREST_YEARLY = "yearly";
const STATUS_ACTIVE = "active";
const STATUS_COMPLETED = "completed";
const FEED_ACTIVE = "active";
const FEED_HISTORY = "history";

const T = {
  pageTitle: "Bank Loans",
  formTitle: "Loan Registration",
  bankName: "Bank",
  selectBank: "Select a bank",
  loanAmount: "Loan Amount",
  duration: "Duration (months)",
  interestRate: "Interest Rate %",
  interestType: "Interest Type",
  monthly: "Monthly",
  yearly: "Yearly",
  startedDate: "Start Date",
  save: "Register Loan",
  cancel: "Cancel",
  feedTitle: "Loan Records",
  tabActive: "Active Loans",
  tabHistory: "Completed Loans",
  emptyActive: "No active loans",
  emptyHistory: "No loan history",
  remainingPrincipal: "Remaining Principal",
  accruedInterest: "Accrued Interest",
  totalOutstanding: "Total Outstanding",
  totalPaid: "Total Paid",
  addRepayment: "Add Repayment",
  paymentDate: "Payment Date",
  paidAmount: "Paid Amount",
  addPayment: "Add Payment",
  markComplete: "Mark as Completed",
  repaymentLine: "Paid",
  deleteRepaymentConfirm: "Do you want to permanently remove this repayment record?",
  deleteLoanConfirm: "Do you want to permanently remove this loan record?",
  updateLoan: "Update Loan",
  months: "Months",
};

const INITIAL_FORM = {
  bank_name: "",
  loan_amount: "",
  duration_months: "",
  interest_rate: "",
  interest_type: INTEREST_MONTHLY,
  started_date: "",
};

function loanToForm(loan) {
  return {
    bank_name: loan.bank_name ?? "",
    loan_amount: loan.loan_amount ? String(loan.loan_amount) : "",
    duration_months: loan.duration_months ? String(loan.duration_months) : "",
    interest_rate: loan.interest_rate ? String(loan.interest_rate) : "",
    interest_type:
      loan.interest_type === INTEREST_YEARLY ? INTEREST_YEARLY : INTEREST_MONTHLY,
    started_date: loan.started_date ?? "",
  };
}

const INPUT =
  "w-full min-w-0 bg-[#EFEFEF]/70 border-0 rounded-2xl p-4 font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none";

const REPAYMENT_INPUT =
  "w-full min-w-0 rounded-2xl border-2 border-neutral-100 bg-neutral-50 px-4 py-3 text-base font-bold text-neutral-900 placeholder:text-neutral-400 transition-all duration-300 outline-none focus:border-neutral-950 focus:bg-white";

const LEDGER_SCROLL =
  "max-h-36 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgb(163_163_163)_transparent]";

/** Sri Lankan commercial banks — A–Z with official logo URLs */
const SRI_LANKAN_BANKS = [
  {
    id: "boc",
    name: "Bank of Ceylon (BOC)",
    short: "BOC",
    logoUrl: "https://www.newswire.lk/wp-content/uploads/2025/11/BOC-copy.jpg",
  },
  {
    id: "commercial",
    name: "Commercial Bank",
    short: "COM",
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmSH0yKy2YHtmgvHnd2hyVHVb3oJlv9KqtVA&s",
  },
  {
    id: "dfcc",
    name: "DFCC Bank",
    short: "DFCC",
    logoUrl: "https://lankabizz.net/wp-content/uploads/2024/11/images-2.jpeg",
  },
  {
    id: "hnb",
    name: "Hatton National Bank (HNB)",
    short: "HNB",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/76/HNB_New_Logo.png",
  },
  {
    id: "ndb",
    name: "National Development Bank (NDB)",
    short: "NDB",
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg9iENSlomqP_-r_VfJ0DCccwv1Nxz_x6owg&s",
  },
  {
    id: "ntb",
    name: "Nations Trust Bank (NTB)",
    short: "NTB",
    logoUrl:
      "https://governmentjob.lk/wp-content/uploads/2026/05/Nations-Trust-Bank-PLC-NTB-Bank.png",
  },
  {
    id: "panasia",
    name: "Pan Asia Bank",
    short: "PAN",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/1e/PAN_ASIA_BANK_LOGO_-_The_Truly_Sri_Lankan_ank.jpg",
  },
  {
    id: "peoples",
    name: "People's Bank",
    short: "PB",
    logoUrl:
      "https://s3.amazonaws.com/bizenglish/wp-content/uploads/2021/01/15142548/Peoples-bank-logo.jpg",
  },
  {
    id: "sampath",
    name: "Sampath Bank",
    short: "SAM",
    logoUrl:
      "https://s3.amazonaws.com/bizenglish/wp-content/uploads/2019/02/22154708/Sampath-Bank-Logo-30.1.191.jpg",
  },
  {
    id: "sdb",
    name: "Sanasa Development Bank (SDB)",
    short: "SDB",
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBhuaCaA4iC_sb78imYNiRwegPaARAP8iWDQ&s",
  },
  {
    id: "seylan",
    name: "Seylan Bank",
    short: "SEY",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Seylan_Transparent.png/1280px-Seylan_Transparent.png",
  },
];

const BANK_LOGO_CLASS =
  "h-6 w-6 shrink-0 rounded-md border border-neutral-100 bg-white object-contain p-0.5";

function findBank(name) {
  const n = String(name ?? "").trim().toLowerCase();
  if (!n) return null;
  return (
    SRI_LANKAN_BANKS.find((b) => b.name.toLowerCase() === n) ||
    SRI_LANKAN_BANKS.find((b) => n.includes(b.id) || b.name.toLowerCase().includes(n))
  );
}

function BankLogo({ bank, className = BANK_LOGO_CLASS }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [bank?.logoUrl]);

  if (!bank) {
    return (
      <span
        className={`${className} flex items-center justify-center text-[8px] font-black text-neutral-400`}
      >
        ?
      </span>
    );
  }

  if (failed || !bank.logoUrl) {
    return (
      <span
        className={`${className} flex items-center justify-center text-[8px] font-black text-neutral-600`}
        title={bank.name}
      >
        {bank.short}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={bank.logoUrl}
      alt=""
      title={bank.name}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function BankPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = findBank(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-neutral-100 bg-[#EFEFEF]/70 px-4 py-3.5 text-left font-bold transition hover:border-neutral-200 focus:border-neutral-950 focus:bg-white focus:outline-none"
      >
        <BankLogo bank={selected} />
        <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">
          {selected ? selected.name : T.selectBank}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-neutral-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label={T.cancel}
              onClick={() => setOpen(false)}
            />
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 480, damping: 34 }}
              className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-[20px] border border-neutral-100 bg-white p-2 shadow-[0_16px_48px_rgba(0,0,0,0.12)] [scrollbar-width:thin] [scrollbar-color:rgb(163_163_163)_transparent]"
            >
              {SRI_LANKAN_BANKS.map((bank) => {
                const active = value === bank.name;
                return (
                  <li key={bank.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(bank.name);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        active ? "bg-neutral-100" : "hover:bg-[#F4F4F7]"
                      }`}
                    >
                      <BankLogo bank={bank} />
                      <span className="min-w-0 flex-1 text-sm font-bold text-neutral-900">
                        {bank.name}
                      </span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-neutral-900" /> : null}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

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

function toDateOrNull(d) {
  const s = String(d ?? "").trim();
  return s === "" ? null : s;
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
    return String(d);
  }
}

function mapLoan(row) {
  const interest_type =
    String(row.interest_type ?? "").trim() === INTEREST_YEARLY
      ? INTEREST_YEARLY
      : INTEREST_MONTHLY;
  const status =
    String(row.status ?? "").trim() === STATUS_COMPLETED
      ? STATUS_COMPLETED
      : STATUS_ACTIVE;
  return {
    id: String(row.id),
    bank_name: String(row.bank_name ?? "").trim(),
    loan_amount: Number(row.loan_amount ?? 0),
    duration_months: Number(row.duration_months ?? 0),
    interest_rate: Number(row.interest_rate ?? 0),
    interest_type,
    started_date: row.started_date ? String(row.started_date) : "",
    status,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapRepayment(row) {
  return {
    id: String(row.id),
    loan_id: String(row.loan_id),
    paid_amount: Number(row.paid_amount ?? 0),
    payment_date: row.payment_date ? String(row.payment_date) : "",
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

/**
 * Reducing-balance interest: month-by-month on outstanding principal;
 * payments reduce balance when they occur.
 */
function computeLoanFinance(loan, repayments) {
  const totalPaid = repayments.reduce((s, r) => s + r.paid_amount, 0);
  const remainingPrincipal = Math.max(0, loan.loan_amount - totalPaid);

  const monthlyRate =
    loan.interest_type === INTEREST_YEARLY
      ? loan.interest_rate / 12 / 100
      : loan.interest_rate / 100;

  if (!loan.started_date || monthlyRate <= 0) {
    const totalOutstanding = remainingPrincipal;
    return {
      remainingPrincipal,
      accruedInterest: 0,
      totalOutstanding,
      totalPaid,
      canComplete: totalOutstanding <= 0,
    };
  }

  const start = new Date(`${loan.started_date}T12:00:00`);
  const end = new Date();
  if (end < start) {
    return {
      remainingPrincipal,
      accruedInterest: 0,
      totalOutstanding: remainingPrincipal,
      totalPaid,
      canComplete: remainingPrincipal <= 0,
    };
  }

  const reps = [...repayments]
    .map((r) => ({
      ...r,
      d: new Date(`${r.payment_date || r.created_at.slice(0, 10)}T12:00:00`),
    }))
    .sort((a, b) => a.d.getTime() - b.d.d.getTime());

  let balance = loan.loan_amount;
  let accruedInterest = 0;
  let repIndex = 0;
  let cursor = new Date(start);

  while (cursor <= end) {
    const nextMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      Math.min(cursor.getDate(), 28)
    );
    const periodEnd = nextMonth > end ? end : nextMonth;
    const spanMs = nextMonth.getTime() - cursor.getTime();
    const fraction = spanMs > 0 ? (periodEnd.getTime() - cursor.getTime()) / spanMs : 1;

    accruedInterest += balance * monthlyRate * fraction;

    while (repIndex < reps.length && reps[repIndex].d <= periodEnd) {
      balance = Math.max(0, balance - reps[repIndex].paid_amount);
      repIndex += 1;
    }

    cursor = nextMonth;
  }

  const totalOutstanding = Math.max(0, remainingPrincipal + accruedInterest);

  return {
    remainingPrincipal,
    accruedInterest,
    totalOutstanding,
    totalPaid,
    canComplete: totalOutstanding <= 0,
  };
}

function FinancialDisplay({ amount, size = "md" }) {
  const f = formatSinhalaLakhCrore(amount);
  const mainClass =
    size === "lg"
      ? "text-3xl font-black tracking-tight"
      : size === "sm"
        ? "text-lg font-black"
        : "text-2xl font-black tracking-tight";
  return (
    <div className="min-w-0">
      <p className={`${mainClass} text-neutral-900`} lang="si">
        {f.main}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-neutral-400">{f.sub}</p>
    </div>
  );
}

function FeedTabs({ activeTab, onChange, activeCount, historyCount }) {
  const tabs = [
    { id: FEED_ACTIVE, label: T.tabActive, icon: Activity, count: activeCount },
    { id: FEED_HISTORY, label: T.tabHistory, icon: History, count: historyCount },
  ];

  return (
    <div className="inline-flex w-full max-w-xl rounded-[20px] bg-neutral-200/50 p-2 backdrop-blur-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition-colors ${
              active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {active && (
              <motion.span
                layoutId="bankLoansFeedTabPill"
                className="absolute inset-0 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              <span lang="si">{tab.label}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-black text-neutral-600">
                {tab.count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LoanCard({
  loan,
  repayments,
  onRepaymentAdded,
  onRepaymentRemoved,
  onEdit,
  onCompleteLoan,
  onDeleteLoan,
}) {
  const [payForm, setPayForm] = useState({
    payment_date: new Date().toISOString().slice(0, 10),
    paid_amount: "",
  });
  const [saving, setSaving] = useState(false);
  const [payError, setPayError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [deletingRepaymentId, setDeletingRepaymentId] = useState(null);

  const finance = useMemo(
    () => computeLoanFinance(loan, repayments),
    [loan, repayments]
  );

  const sortedRepayments = useMemo(
    () =>
      [...repayments].sort(
        (a, b) =>
          new Date(b.payment_date || b.created_at).getTime() -
          new Date(a.payment_date || a.created_at).getTime()
      ),
    [repayments]
  );

  const handleRepayment = async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setPayError("");
    const paid_amount = toNum(payForm.paid_amount);
    if (paid_amount <= 0) {
      setPayError("Enter paid amount");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("loan_repayments")
        .insert({
          loan_id: loan.id,
          paid_amount,
          payment_date: toDateOrNull(payForm.payment_date),
        })
        .select("*")
        .single();
      if (error) throw error;
      onRepaymentAdded(loan.id, mapRepayment(data));
      setPayForm((f) => ({ ...f, paid_amount: "" }));
    } catch (err) {
      setPayError(dbError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRepayment = async (repayment) => {
    if (!window.confirm(T.deleteRepaymentConfirm)) return;
    setPayError("");
    setDeletingRepaymentId(repayment.id);
    try {
      const { error } = await supabase
        .from("loan_repayments")
        .delete()
        .eq("id", repayment.id);
      if (error) throw error;
      onRepaymentRemoved(loan.id, repayment.id);
    } catch (err) {
      setPayError(dbError(err));
    } finally {
      setDeletingRepaymentId(null);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setPayError("");
    try {
      await onCompleteLoan(loan.id);
    } catch (err) {
      setPayError(dbError(err));
    } finally {
      setCompleting(false);
    }
  };

  const isActive = loan.status === STATUS_ACTIVE;
  const monthlyLabel =
    loan.interest_type === INTEREST_YEARLY ? T.yearly : T.monthly;
  const bankMeta = findBank(loan.bank_name);

  return (
    <motion.article
      custom={0}
      variants={staggerChild}
      initial="hidden"
      animate="show"
      whileHover={isActive ? cardHoverMotion : undefined}
      className={`flex min-w-0 flex-col rounded-[28px] border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ${
        isActive ? "border-l-8 border-l-[#1565C0] border-neutral-100" : "border-neutral-100 opacity-90"
      }`}
    >
      <div className="mb-4 flex w-full items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BankLogo bank={bankMeta} />
            <h3 className="truncate text-xl font-black text-neutral-950">{loan.bank_name || "—"}</h3>
          </div>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {formatDate(loan.started_date)} · {loan.duration_months} {T.months} · {loan.interest_rate}%{" "}
            {monthlyLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isActive ? (
            <>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onEdit(loan);
                }}
                className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-amber-50 hover:text-amber-500"
                aria-label={T.updateLoan}
              >
                <Edit2 className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleComplete();
                }}
                disabled={completing}
                className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                aria-label={T.markComplete}
              >
                {completing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" strokeWidth={2.2} />
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                onDeleteLoan(loan.id);
              }}
              className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-rose-50 hover:text-rose-600"
              aria-label={T.deleteLoanConfirm}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#F4F4F7] p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            {T.totalOutstanding}
          </p>
          <FinancialDisplay amount={finance.totalOutstanding} size="lg" />
        </div>
        <div className="space-y-2 rounded-2xl border border-neutral-100 p-4 text-xs font-bold text-neutral-700">
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500">{T.remainingPrincipal}</span>
            <span>{formatSinhalaLakhCrore(finance.remainingPrincipal).main}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500">{T.accruedInterest}</span>
            <span>{formatSinhalaLakhCrore(finance.accruedInterest).main}</span>
          </div>
          <div className="flex justify-between gap-2 border-t border-neutral-100 pt-2">
            <span className="text-neutral-500">{T.totalPaid}</span>
            <span className="text-emerald-700">{formatSinhalaLakhCrore(finance.totalPaid).main}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500">{T.loanAmount}</span>
            <span>{formatSinhalaLakhCrore(loan.loan_amount).main}</span>
          </div>
        </div>
      </div>

      {isActive ? (
        <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] p-4">
          <p className="mb-3 text-sm font-black text-emerald-900">{T.addRepayment}</p>
          <form onSubmit={handleRepayment} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-emerald-800/80">
                  {T.paymentDate}
                </label>
                <input
                  type="date"
                  className={REPAYMENT_INPUT}
                  value={payForm.payment_date}
                  onChange={(ev) =>
                    setPayForm((f) => ({ ...f, payment_date: ev.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-emerald-800/80">
                  {T.paidAmount}
                </label>
                <input
                  className={REPAYMENT_INPUT}
                  placeholder={T.paidAmount}
                  inputMode="decimal"
                  value={payForm.paid_amount}
                  onChange={(ev) =>
                    setPayForm((f) => ({ ...f, paid_amount: ev.target.value }))
                  }
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-emerald-700 px-5 py-4 text-base font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "..." : T.addPayment}
            </button>
          </form>
          {payError ? (
            <p className="mt-2 text-xs font-bold text-rose-600">{payError}</p>
          ) : null}
          {finance.canComplete ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="mt-3 w-full rounded-2xl bg-neutral-950 py-3 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {completing ? "..." : T.markComplete}
            </button>
          ) : null}
        </div>
      ) : null}

      {sortedRepayments.length > 0 ? (
        <div className={`mt-4 ${LEDGER_SCROLL}`}>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {sortedRepayments.map((r, i) => (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ delay: i * 0.03, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-2 rounded-xl bg-[#F4F4F7] px-3 py-2.5 text-sm font-semibold text-neutral-800"
                >
                  <Calendar className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1" lang="si">
                    {formatDate(r.payment_date)} — {moneyFullLkr(r.paid_amount)} {T.repaymentLine}
                  </span>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDeleteRepayment(r);
                    }}
                    disabled={deletingRepaymentId === r.id}
                    className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-rose-600 disabled:opacity-40"
                    aria-label={T.deleteRepaymentConfirm}
                  >
                    {deletingRepaymentId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                    )}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ) : null}
    </motion.article>
  );
}

export default function BankLoansPage() {
  const [loans, setLoans] = useState([]);
  const [repaymentsByLoan, setRepaymentsByLoan] = useState({});
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [feedTab, setFeedTab] = useState(FEED_ACTIVE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    const [loansRes, repRes] = await Promise.all([
      supabase.from("bank_loans").select("*").order("created_at", { ascending: false }),
      supabase.from("loan_repayments").select("*").order("payment_date", { ascending: false }),
    ]);
    if (loansRes.error) throw loansRes.error;
    if (repRes.error) throw repRes.error;

    const mappedLoans = (loansRes.data ?? []).map(mapLoan);
    const byLoan = {};
    for (const row of repRes.data ?? []) {
      const r = mapRepayment(row);
      if (!byLoan[r.loan_id]) byLoan[r.loan_id] = [];
      byLoan[r.loan_id].push(r);
    }
    setLoans(mappedLoans);
    setRepaymentsByLoan(byLoan);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(dbError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === STATUS_ACTIVE),
    [loans]
  );
  const historyLoans = useMemo(
    () => loans.filter((l) => l.status === STATUS_COMPLETED),
    [loans]
  );

  const feedLoans = feedTab === FEED_ACTIVE ? activeLoans : historyLoans;

  const totalActiveOutstanding = useMemo(() => {
    let sum = 0;
    for (const loan of activeLoans) {
      const reps = repaymentsByLoan[loan.id] ?? [];
      sum += computeLoanFinance(loan, reps).totalOutstanding;
    }
    return sum;
  }, [activeLoans, repaymentsByLoan]);

  const handleRepaymentAdded = (loanId, repayment) => {
    setRepaymentsByLoan((prev) => ({
      ...prev,
      [loanId]: [repayment, ...(prev[loanId] ?? [])],
    }));
  };

  const handleRepaymentRemoved = (loanId, repaymentId) => {
    setRepaymentsByLoan((prev) => ({
      ...prev,
      [loanId]: (prev[loanId] ?? []).filter((r) => r.id !== repaymentId),
    }));
  };

  const handleCompleted = (loanId) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: STATUS_COMPLETED } : l))
    );
    setFeedTab(FEED_HISTORY);
  };

  const startEdit = (loan) => {
    setEditingLoanId(loan.id);
    setForm(loanToForm(loan));
    setError("");
  };

  const handleCompleteLoan = async (loanId) => {
    const { error } = await supabase
      .from("bank_loans")
      .update({ status: STATUS_COMPLETED })
      .eq("id", loanId);
    if (error) throw error;
    handleCompleted(loanId);
  };

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm(T.deleteLoanConfirm)) return;
    setError("");
    try {
      const { error } = await supabase.from("bank_loans").delete().eq("id", loanId);
      if (error) throw error;
      setLoans((prev) => prev.filter((l) => l.id !== loanId));
      setRepaymentsByLoan((prev) => {
        const next = { ...prev };
        delete next[loanId];
        return next;
      });
    } catch (err) {
      setError(dbError(err));
    }
  };

  const saveLoan = async (ev) => {
    ev.preventDefault();
    if (!String(form.bank_name ?? "").trim()) {
      setError("Select a bank");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const interest_type =
        form.interest_type === INTEREST_YEARLY ? INTEREST_YEARLY : INTEREST_MONTHLY;
      const payload = {
        bank_name: String(form.bank_name).trim(),
        loan_amount: toNum(form.loan_amount),
        duration_months: Math.round(toNum(form.duration_months)),
        interest_rate: toNum(form.interest_rate),
        interest_type,
        started_date: toDateOrNull(form.started_date),
      };

      if (editingLoanId) {
        const { data, error: upErr } = await supabase
          .from("bank_loans")
          .update(payload)
          .eq("id", editingLoanId)
          .select("*")
          .single();
        if (upErr) throw upErr;
        const updated = mapLoan(data);
        setLoans((prev) => prev.map((l) => (l.id === editingLoanId ? updated : l)));
        setEditingLoanId(null);
      } else {
        const { data, error: insErr } = await supabase
          .from("bank_loans")
          .insert({ ...payload, status: STATUS_ACTIVE })
          .select("*")
          .single();
        if (insErr) throw insErr;
        const created = mapLoan(data);
        setLoans((prev) => [created, ...prev]);
        setRepaymentsByLoan((prev) => ({ ...prev, [created.id]: [] }));
        setFeedTab(FEED_ACTIVE);
      }
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.main
      className="w-full min-h-screen bg-[#F4F4F7] px-8 lg:px-16 py-12"
      variants={pageEnter}
      initial="hidden"
      animate="show"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl" lang="si">
          {T.pageTitle}
        </h1>
        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Bank Loan Tracker & Enterprise Debt Management
        </p>
      </div>

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

      {activeLoans.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex min-h-[120px] flex-col justify-center rounded-[28px] border border-[#BBDEFB] bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] p-6 text-[#0D47A1] shadow-sm"
        >
          <p className="text-sm font-bold">Total Active Loan Outstanding</p>
          <FinancialDisplay amount={totalActiveOutstanding} size="lg" />
        </motion.div>
      ) : null}

      <div className="grid w-full gap-8 xl:grid-cols-[minmax(320px,400px)_1fr]">
        <motion.section
          variants={staggerChild}
          initial="hidden"
          animate="show"
          className="h-fit rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] xl:sticky xl:top-8"
        >
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-neutral-950">
            <Plus className="h-5 w-5" />
            {editingLoanId ? T.updateLoan : T.formTitle}
          </h2>
          <form onSubmit={saveLoan} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">{T.bankName}</label>
              <BankPicker
                value={form.bank_name}
                onChange={(name) => setForm((f) => ({ ...f, bank_name: name }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">{T.loanAmount}</label>
              <input
                className={INPUT}
                inputMode="decimal"
                value={form.loan_amount}
                onChange={(ev) => setForm((f) => ({ ...f, loan_amount: ev.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-500">{T.duration}</label>
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={form.duration_months}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, duration_months: ev.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                  {T.interestRate}
                </label>
                <input
                  className={INPUT}
                  inputMode="decimal"
                  value={form.interest_rate}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, interest_rate: ev.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-neutral-500">{T.interestType}</label>
              <div className="flex rounded-2xl bg-neutral-200/50 p-1.5">
                {[INTEREST_MONTHLY, INTEREST_YEARLY].map((type) => {
                  const active = form.interest_type === type;
                  const label = type === INTEREST_MONTHLY ? T.monthly : T.yearly;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, interest_type: type }))}
                      className={`relative flex-1 rounded-xl py-3 text-sm font-bold transition ${
                        active ? "text-neutral-950" : "text-neutral-500"
                      }`}
                    >
                      {active ? (
                        <motion.span
                          layoutId="bankLoanInterestPill"
                          className="absolute inset-0 rounded-xl bg-white shadow-sm"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        />
                      ) : null}
                      <span className="relative z-10" lang="si">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">{T.startedDate}</label>
              <input
                type="date"
                className={INPUT}
                value={form.started_date}
                onChange={(ev) => setForm((f) => ({ ...f, started_date: ev.target.value }))}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-neutral-950 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {saving ? "..." : editingLoanId ? T.updateLoan : T.save}
            </button>
            {editingLoanId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingLoanId(null);
                  setForm(INITIAL_FORM);
                }}
                className="w-full rounded-2xl bg-neutral-100 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-200"
              >
                {T.cancel}
              </button>
            ) : null}
          </form>
        </motion.section>

        <section className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-black text-neutral-950">{T.feedTitle}</h2>
            <FeedTabs
              activeTab={feedTab}
              onChange={setFeedTab}
              activeCount={activeLoans.length}
              historyCount={historyLoans.length}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
            </div>
          ) : feedLoans.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-lg font-bold text-neutral-400"
              lang="si"
            >
              {feedTab === FEED_ACTIVE ? T.emptyActive : T.emptyHistory}
            </motion.p>
          ) : (
            <motion.div className="grid w-full gap-6 lg:grid-cols-2" layout>
              <AnimatePresence mode="popLayout">
                {feedLoans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    repayments={repaymentsByLoan[loan.id] ?? []}
                    onRepaymentAdded={handleRepaymentAdded}
                    onRepaymentRemoved={handleRepaymentRemoved}
                    onEdit={startEdit}
                    onCompleteLoan={handleCompleteLoan}
                    onDeleteLoan={handleDeleteLoan}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </div>
    </motion.main>
  );
}
