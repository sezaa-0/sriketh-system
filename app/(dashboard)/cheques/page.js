"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Loader2,
  AlertCircle,
  ChevronDown,
  Check,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCcw,
  Calendar,
} from "lucide-react";

const TYPE_RECEIVED = "received";
const TYPE_ISSUED = "issued";
const STATUS_PENDING = "pending";
const STATUS_SETTLED = "settled";
const STATUS_RETURNED = "returned";

const TAB_PENDING = "pending";
const TAB_SETTLED = "settled";
const TAB_RETURNED = "returned";

const T = {
  pageTitle: "Cheque Registry & Cash Flow",
  alertTitle: "Today's Cheque Alerts",
  alertCount: "Total cheques due for settlement",
  alertTotal: "Total Value",
  formTitle: "Cheque Registration",
  micrLine: "MICR Line",
  chequeNumber: "Cheque Number",
  bankCode: "Bank Code",
  branchCode: "Branch Code",
  accountNumber: "Account Number",
  bankName: "Bank",
  selectBank: "Select a bank",
  branchName: "Branch Name",
  amount: "Amount",
  settleDate: "Settlement Date",
  chequeType: "Cheque Type",
  typeReceived: "Received Cheque",
  typeIssued: "Issued Cheque",
  save: "Save Cheque",
  cancel: "Cancel",
  feedTitle: "Cheque Records",
  tabPending: "Pending Settlement",
  tabSettled: "Settled",
  tabReturned: "Returned",
  emptyPending: "No pending cheques",
  emptySettled: "No settled cheques",
  emptyReturned: "No returned cheques",
  dueToday: "Due Today",
  overdue: "Overdue",
  dueSoon: "Due Soon",
  deleteConfirm: "Do you want to permanently remove this cheque record?",
  settle: "Settle",
  returnCheque: "Return",
};

const INITIAL_FORM = {
  cheque_number: "",
  bank_code: "",
  branch_code: "",
  account_number: "",
  bank_name: "",
  branch_name: "",
  amount: "",
  settle_date: "",
  cheque_type: TYPE_RECEIVED,
};

const INPUT =
  "w-full min-w-0 bg-[#EFEFEF]/70 border-0 rounded-2xl p-4 font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none";

const MICR_CELL =
  "w-full min-w-0 rounded-xl border-2 border-neutral-200 bg-neutral-950 px-4 py-3 text-center font-mono text-base font-bold tracking-widest text-emerald-400 placeholder:text-neutral-600 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 lg:text-lg";

function digitsOnly(value, maxLen) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maxLen);
}

function micrSegment(value, emptyPlaceholder) {
  const s = String(value ?? "").trim();
  return s || emptyPlaceholder;
}

const MICR_DISPLAY_FLEX = ["min-w-0 flex-[2]", "min-w-0 flex-[1.5]", "min-w-0 flex-[1.2]", "min-w-0 flex-[5]"];

function MicrLineDisplay({ cheque }) {
  const parts = [
    micrSegment(cheque.cheque_number, "______"),
    micrSegment(cheque.bank_code, "____"),
    micrSegment(cheque.branch_code, "___"),
    micrSegment(cheque.account_number, "_________"),
  ];
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="flex w-full min-w-0 items-center justify-between gap-1.5 rounded-xl bg-neutral-50 px-4 py-3 font-mono text-sm font-bold tracking-wider text-neutral-800 md:gap-2 md:text-base">
        {parts.map((part, i) => (
          <span
            key={i}
            className={`truncate text-center ${MICR_DISPLAY_FLEX[i]}`}
            title={`${i === 0 ? "⑈ " : " ⑈ "}${part}`}
          >
            {i === 0 ? "⑈ " : " ⑈ "}
            {part}
          </span>
        ))}
      </div>
    </div>
  );
}

function MicrInputRow({ form, setForm }) {
  const fields = [
    {
      key: "cheque_number",
      label: T.chequeNumber,
      max: 6,
      placeholder: "000000",
      wrap: "min-w-0 flex-[2]",
    },
    {
      key: "bank_code",
      label: T.bankCode,
      max: 4,
      placeholder: "0000",
      wrap: "min-w-0 flex-[1.5]",
    },
    {
      key: "branch_code",
      label: T.branchCode,
      max: 3,
      placeholder: "000",
      wrap: "min-w-0 flex-[1.2]",
    },
    {
      key: "account_number",
      label: T.accountNumber,
      max: 12,
      placeholder: "000000000",
      wrap: "min-w-0 flex-[5]",
    },
  ];

  return (
    <div className="w-full min-w-0 rounded-2xl border-2 border-dashed border-neutral-300 bg-gradient-to-b from-neutral-100 to-neutral-50 p-4">
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {T.micrLine}
      </p>
      <div className="flex w-full min-w-0 items-start gap-3">
        {fields.map((f) => (
          <div key={f.key} className={f.wrap}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={f.max}
              placeholder={f.placeholder}
              className={MICR_CELL}
              value={form[f.key]}
              onChange={(ev) =>
                setForm((prev) => ({
                  ...prev,
                  [f.key]: digitsOnly(ev.target.value, f.max),
                }))
              }
            />
            <p className="mt-1.5 text-center text-xs font-bold leading-snug text-neutral-500">
              {f.label}
            </p>
          </div>
        ))}
      </div>
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

function formatSinhalaLakhCrore(amount, { lakhDecimals = false } = {}) {
  const n = Math.abs(Number(amount) || 0);
  const sign = amount < 0 ? "-" : "";
  const sub = moneyFullLkr(amount);

  if (n < 100_000) {
    return { main: `${sign}${moneyPlain(n)}`, sub };
  }

  if (n < 10_000_000) {
    const lakhs = n / 100_000;
    const formatted = lakhDecimals ? lakhs.toFixed(2) : String(Math.round(lakhs * 10) / 10);
    return { main: `${sign}Lakh ${formatted}`, sub };
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
    return new Date(`${d}T12:00:00`).toLocaleDateString("si-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
}

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntilSettle(settleDate) {
  if (!settleDate) return null;
  const today = startOfDay();
  const target = startOfDay(new Date(`${settleDate}T12:00:00`));
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function isAlertWindow(settleDate) {
  const days = daysUntilSettle(settleDate);
  if (days == null) return false;
  return days <= 3;
}

function dueBadgeMeta(settleDate) {
  const days = daysUntilSettle(settleDate);
  if (days == null) return null;
  if (days < 0) return { label: T.overdue, className: "bg-rose-100 text-rose-800 animate-pulse" };
  if (days === 0) return { label: T.dueToday, className: "bg-amber-100 text-amber-900 animate-pulse" };
  if (days <= 3) return { label: T.dueSoon, className: "bg-orange-50 text-orange-800" };
  return null;
}

function findBank(name) {
  const n = String(name ?? "").trim().toLowerCase();
  if (!n) return null;
  return (
    SRI_LANKAN_BANKS.find((b) => b.name.toLowerCase() === n) ||
    SRI_LANKAN_BANKS.find((b) => n.includes(b.id) || b.name.toLowerCase().includes(n))
  );
}

function mapCheque(row) {
  const type =
    String(row.cheque_type ?? "").trim() === TYPE_ISSUED ? TYPE_ISSUED : TYPE_RECEIVED;
  const status = [STATUS_SETTLED, STATUS_RETURNED].includes(String(row.status ?? "").trim())
    ? String(row.status).trim()
    : STATUS_PENDING;
  return {
    id: String(row.id),
    cheque_number: String(row.cheque_number ?? "").trim(),
    bank_code: String(row.bank_code ?? "").trim(),
    branch_code: String(row.branch_code ?? "").trim(),
    account_number: String(row.account_number ?? "").trim(),
    bank_name: String(row.bank_name ?? "").trim(),
    branch_name: String(row.branch_name ?? "").trim(),
    amount: Number(row.amount ?? 0),
    settle_date: row.settle_date ? String(row.settle_date) : "",
    cheque_type: type,
    status,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
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

function FinancialDisplay({ amount, lakhDecimals = false, size = "md" }) {
  const f = formatSinhalaLakhCrore(amount, { lakhDecimals });
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

function StatusTabs({ activeTab, onChange, pendingCount, settledCount, returnedCount }) {
  const tabs = [
    { id: TAB_PENDING, label: T.tabPending, icon: Clock, count: pendingCount },
    { id: TAB_SETTLED, label: T.tabSettled, icon: CheckCircle2, count: settledCount },
    { id: TAB_RETURNED, label: T.tabReturned, icon: RotateCcw, count: returnedCount },
  ];
  return (
    <div className="inline-flex w-full max-w-3xl rounded-[20px] bg-neutral-200/50 p-2 backdrop-blur-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3.5 text-xs font-bold sm:text-sm ${
              active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {active && (
              <motion.span
                layoutId="chequesStatusTabPill"
                className="absolute inset-0 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              <span lang="si" className="truncate">
                {tab.label}
              </span>
              <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-black text-neutral-600">
                {tab.count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ChequeCard({ cheque, onSettle, onReturn, onDelete, updating }) {
  const bank = findBank(cheque.bank_name);
  const isReceived = cheque.cheque_type === TYPE_RECEIVED;
  const isPending = cheque.status === STATUS_PENDING;
  const due = dueBadgeMeta(cheque.settle_date);
  const fin = formatSinhalaLakhCrore(cheque.amount);

  const borderAccent = isPending
    ? isReceived
      ? "border-l-emerald-500"
      : "border-l-rose-500"
    : cheque.status === STATUS_SETTLED
      ? "border-l-blue-500"
      : "border-l-amber-500";

  return (
    <motion.article
      layout
      variants={staggerChild}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      whileHover={cardHoverMotion}
      className={`flex min-w-0 flex-col rounded-[28px] border border-neutral-100 border-l-8 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ${borderAccent} ${
        updating ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <div className="mb-4 flex w-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BankLogo bank={bank} />
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isReceived ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
              }`}
            >
              {isReceived ? T.typeReceived : T.typeIssued}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-neutral-600">
            {cheque.bank_name}
            {cheque.branch_name ? ` · ${cheque.branch_name}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isPending ? (
            <>
              <button
                type="button"
                onClick={() => onSettle(cheque.id)}
                className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-neutral-50 hover:text-emerald-600"
                aria-label={T.settle}
              >
                <CheckCircle className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => onReturn(cheque.id)}
                className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-neutral-50 hover:text-amber-600"
                aria-label={T.returnCheque}
              >
                <AlertTriangle className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onDelete(cheque.id)}
              className="rounded-xl p-2 text-neutral-400 transition-all hover:bg-neutral-50 hover:text-rose-600"
              aria-label={T.deleteConfirm}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 w-full min-w-0">
        <MicrLineDisplay cheque={cheque} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            {T.amount}
          </p>
          <p className="text-2xl font-black text-neutral-950" lang="si">
            {fin.main}
          </p>
          <p className="text-xs font-semibold text-neutral-400">{fin.sub}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            {T.settleDate}
          </p>
          <p className="flex items-center justify-end gap-1.5 text-sm font-bold text-neutral-800">
            <Calendar className="h-4 w-4 text-neutral-400" />
            {formatDate(cheque.settle_date)}
          </p>
          {isPending && due ? (
            <span
              className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${due.className}`}
            >
              {due.label}
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

export default function ChequesPage() {
  const [cheques, setCheques] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [feedTab, setFeedTab] = useState(TAB_PENDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const refresh = useCallback(async () => {
    setError("");
    const { data, error: fetchErr } = await supabase
      .from("cheques")
      .select("*")
      .order("settle_date", { ascending: true });
    if (fetchErr) throw fetchErr;
    setCheques((data ?? []).map(mapCheque));
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

  const alertCheques = useMemo(
    () =>
      cheques.filter(
        (c) => c.status === STATUS_PENDING && c.settle_date && isAlertWindow(c.settle_date)
      ),
    [cheques]
  );

  const alertStats = useMemo(() => {
    let total = 0;
    for (const c of alertCheques) total += c.amount;
    return { count: alertCheques.length, total };
  }, [alertCheques]);

  const pendingCheques = useMemo(
    () => cheques.filter((c) => c.status === STATUS_PENDING),
    [cheques]
  );
  const settledCheques = useMemo(
    () => cheques.filter((c) => c.status === STATUS_SETTLED),
    [cheques]
  );
  const returnedCheques = useMemo(
    () => cheques.filter((c) => c.status === STATUS_RETURNED),
    [cheques]
  );

  const feedCheques =
    feedTab === TAB_PENDING
      ? pendingCheques
      : feedTab === TAB_SETTLED
        ? settledCheques
        : returnedCheques;

  const updateChequeStatus = async (id, status) => {
    setUpdatingId(id);
    setError("");
    try {
      const { data, error: upErr } = await supabase
        .from("cheques")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single();
      if (upErr) throw upErr;
      const updated = mapCheque(data);
      setCheques((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (status === STATUS_SETTLED) setFeedTab(TAB_SETTLED);
      if (status === STATUS_RETURNED) setFeedTab(TAB_RETURNED);
    } catch (err) {
      setError(dbError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(T.deleteConfirm)) return;
    setUpdatingId(id);
    setError("");
    try {
      const { error: delErr } = await supabase.from("cheques").delete().eq("id", id);
      if (delErr) throw delErr;
      setCheques((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(dbError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const saveCheque = async (ev) => {
    ev.preventDefault();
    if (!String(form.bank_name ?? "").trim()) {
      setError("Select a bank");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const cheque_type =
        form.cheque_type === TYPE_ISSUED ? TYPE_ISSUED : TYPE_RECEIVED;
      const { data, error: insErr } = await supabase
        .from("cheques")
        .insert({
          cheque_number: digitsOnly(form.cheque_number, 6),
          bank_code: digitsOnly(form.bank_code, 4),
          branch_code: digitsOnly(form.branch_code, 3),
          account_number: digitsOnly(form.account_number, 12),
          bank_name: String(form.bank_name).trim(),
          branch_name: String(form.branch_name ?? "").trim(),
          amount: toNum(form.amount),
          settle_date: toDateOrNull(form.settle_date),
          cheque_type,
          status: STATUS_PENDING,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;
      const created = mapCheque(data);
      setCheques((prev) => [...prev, created].sort((a, b) => {
        const da = a.settle_date || "9999";
        const db = b.settle_date || "9999";
        return da.localeCompare(db);
      }));
      setForm(INITIAL_FORM);
      setFeedTab(TAB_PENDING);
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
          Cheque Tracker & Cash Flow Dashboard
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

      <AnimatePresence>
        {alertStats.count > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-8 overflow-hidden rounded-[28px] border-2 border-amber-300 bg-gradient-to-br from-[#FFF8E1] via-[#FFECB3] to-[#FFE082] p-6 shadow-[0_12px_40px_rgba(245,158,11,0.15)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black text-amber-950" lang="si">
                  <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
                  {T.alertTitle}
                </h2>
                <p className="mt-2 text-sm font-bold text-amber-900/90" lang="si">
                  {T.alertCount}: {alertStats.count}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200/80 bg-white/70 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800/80">
                  {T.alertTotal}
                </p>
                <FinancialDisplay amount={alertStats.total} lakhDecimals={true} size="lg" />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid w-full gap-8 xl:grid-cols-[1.15fr_minmax(0,1fr)]">
        <motion.section
          variants={staggerChild}
          initial="hidden"
          animate="show"
          className="h-fit w-full min-w-0 rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] xl:sticky xl:top-8"
        >
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-neutral-950">
            <Plus className="h-5 w-5" />
            {T.formTitle}
          </h2>
          <form onSubmit={saveCheque} className="w-full min-w-0 space-y-4">
            <MicrInputRow form={form} setForm={setForm} />
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                {T.bankName}
              </label>
              <BankPicker
                value={form.bank_name}
                onChange={(name) => setForm((f) => ({ ...f, bank_name: name }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                {T.branchName}
              </label>
              <input
                className={INPUT}
                value={form.branch_name}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, branch_name: ev.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                {T.amount}
              </label>
              <input
                className={INPUT}
                inputMode="decimal"
                value={form.amount}
                onChange={(ev) => setForm((f) => ({ ...f, amount: ev.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                {T.settleDate}
              </label>
              <input
                type="date"
                className={INPUT}
                value={form.settle_date}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, settle_date: ev.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-neutral-500">
                {T.chequeType}
              </label>
              <div className="flex rounded-2xl bg-neutral-200/50 p-1.5">
                {[TYPE_RECEIVED, TYPE_ISSUED].map((type) => {
                  const active = form.cheque_type === type;
                  const label = type === TYPE_RECEIVED ? T.typeReceived : T.typeIssued;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, cheque_type: type }))}
                      className={`relative flex-1 rounded-xl py-3 text-xs font-bold sm:text-sm ${
                        active ? "text-neutral-950" : "text-neutral-500"
                      }`}
                    >
                      {active ? (
                        <motion.span
                          layoutId="chequeTypePill"
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
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-neutral-950 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {saving ? "..." : T.save}
            </button>
          </form>
        </motion.section>

        <section className="min-w-0 w-full">
          <div className="mb-6 flex flex-col gap-4">
            <h2 className="text-lg font-black text-neutral-950">{T.feedTitle}</h2>
            <StatusTabs
              activeTab={feedTab}
              onChange={setFeedTab}
              pendingCount={pendingCheques.length}
              settledCount={settledCheques.length}
              returnedCount={returnedCheques.length}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
            </div>
          ) : feedCheques.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-lg font-bold text-neutral-400"
              lang="si"
            >
              {feedTab === TAB_PENDING
                ? T.emptyPending
                : feedTab === TAB_SETTLED
                  ? T.emptySettled
                  : T.emptyReturned}
            </motion.p>
          ) : (
            <motion.div className="grid w-full min-w-0 grid-cols-1 gap-6 2xl:grid-cols-2" layout>
              <AnimatePresence mode="popLayout">
                {feedCheques.map((cheque) => (
                  <ChequeCard
                    key={cheque.id}
                    cheque={cheque}
                    updating={updatingId === cheque.id}
                    onSettle={(id) => updateChequeStatus(id, STATUS_SETTLED)}
                    onReturn={(id) => updateChequeStatus(id, STATUS_RETURNED)}
                    onDelete={handleDelete}
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
