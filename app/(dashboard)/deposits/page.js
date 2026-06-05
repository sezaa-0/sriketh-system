"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Search,
  Landmark,
  CalendarClock,
  Banknote,
  FileText,
  Building2,
  CreditCard,
} from "lucide-react";

const DATE_ALL = "all";
const DATE_TODAY = "today";
const DATE_YESTERDAY = "yesterday";
const DATE_MONTH = "month";
const DATE_CUSTOM = "custom";

const T = {
  pageTitle: "Bank Deposits",
  pageSub: "Bank Deposit Management Dashboard",
  accountFormTitle: "Bank Account Registration",
  bankName: "Bank",
  accountNickname: "Account Nickname",
  accountNumber: "Account Number",
  saveAccount: "Save Account",
  registeredAccounts: "Registered Accounts",
  emptyAccounts: "Register accounts",
  deleteAccountConfirm:
    "Do you want to permanently delete this bank account? If it has linked deposits, deletion will be blocked.",
  quickAdd: "Bank Deposit Log",
  selectAccount: "Select Account",
  amount: "Amount",
  amountPreview: "Preview",
  dateTime: "Date & Time",
  referenceNote: "Description / Source",
  saveDeposit: "Save Deposit",
  ledgerTitle: "Deposit Records",
  search: "Search",
  searchPlaceholder: "e.g. Araliya, Load, Rice...",
  dateFilter: "Date Filter",
  customDate: "Custom Date",
  filterAll: "All",
  filterToday: "Today",
  filterYesterday: "Yesterday",
  filterMonth: "This Month",
  emptyLedger: "No deposit records",
  emptyFilter: "No records match selected filters",
  noAccountForDeposit: "Register a bank account first",
  deleteDepositConfirm: "Do you want to permanently delete this deposit record?",
  matchCount: "Records",
  filteredTotal: "Visible Total Deposits",
};

const BANK_NAME_OPTIONS = [
  "BOC",
  "Sampath Bank",
  "HNB",
  "Commercial Bank",
  "Peoples Bank",
];

const BANK_BRANDS = {
  BOC: {
    card: "border-amber-500/30 bg-amber-50/40",
    badge: "border-amber-300 bg-amber-50 text-amber-950",
    accent: "text-amber-800",
    logoUrl:
      "https://www.newswire.lk/wp-content/uploads/2025/11/BOC-copy.jpg",
    short: "BOC",
  },
  "Sampath Bank": {
    card: "border-orange-600/25 bg-orange-50/40",
    badge: "border-orange-300 bg-orange-50 text-orange-950",
    accent: "text-orange-800",
    logoUrl:
      "https://s3.amazonaws.com/bizenglish/wp-content/uploads/2019/02/22154708/Sampath-Bank-Logo-30.1.191.jpg",
    short: "Sampath",
  },
  HNB: {
    card: "border-teal-600/25 bg-teal-50/40",
    badge: "border-teal-300 bg-teal-50 text-teal-950",
    accent: "text-teal-800",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/76/HNB_New_Logo.png",
    short: "HNB",
  },
  "Commercial Bank": {
    card: "border-blue-600/25 bg-blue-50/40",
    badge: "border-blue-300 bg-blue-50 text-blue-950",
    accent: "text-blue-800",
    logoUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmSH0yKy2YHtmgvHnd2hyVHVb3oJlv9KqtVA&s",
    short: "COM",
  },
  "Peoples Bank": {
    card: "border-rose-700/20 bg-gradient-to-br from-amber-50/50 to-rose-50/30",
    badge: "border-rose-300 bg-rose-50 text-rose-950",
    accent: "text-rose-900",
    logoUrl:
      "https://s3.amazonaws.com/bizenglish/wp-content/uploads/2021/01/15142548/Peoples-bank-logo.jpg",
    short: "PB",
  },
};

const DATE_FILTER_PILLS = [
  { id: DATE_ALL, labelSi: T.filterAll, labelEn: "All" },
  { id: DATE_TODAY, labelSi: T.filterToday, labelEn: "Today" },
  { id: DATE_YESTERDAY, labelSi: T.filterYesterday, labelEn: "Yesterday" },
  { id: DATE_MONTH, labelSi: T.filterMonth, labelEn: "This Month" },
];

const FILTER_PILL_ACTIVE =
  "border-neutral-950 bg-neutral-950 text-white shadow-sm";
const FILTER_PILL_INACTIVE =
  "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50";

const CARD =
  "rounded-3xl border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]";

const INPUT =
  "w-full min-w-0 bg-[#EFEFEF]/70 border-0 rounded-2xl p-4 font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none";

const AMOUNT_INPUT =
  "w-full min-w-0 bg-[#EFEFEF]/70 border-0 rounded-2xl px-4 py-5 text-2xl font-black tracking-tight text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none sm:text-3xl";

const ICON_BTN =
  "rounded-xl p-2 text-neutral-400 transition-all hover:bg-neutral-50 hover:text-rose-600";

const pageEnter = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardHoverMotion = {
  y: -3,
  scale: 1.005,
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
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

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function nowLocalDatetimeValue(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDatetimeToIso(value) {
  const s = String(value ?? "").trim();
  if (!s) return new Date().toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function moneyPlain(n) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(
    Math.abs(Number(n) || 0)
  );
}

function moneyFullLkr(n) {
  const abs = Math.abs(Number(n) || 0);
  const sign = n < 0 ? "-" : "";
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(abs);
  return `${sign}Rs. ${fmt}`;
}

function formatSinhalaLakhCrore(amount) {
  const n = Math.abs(Number(amount) || 0);
  const sign = Number(amount) < 0 ? "-" : "";
  const sub = moneyFullLkr(amount);

  if (n < 100_000) {
    return { main: `${sign}${moneyPlain(n)}`, sub };
  }

  if (n < 10_000_000) {
    const lakhs = n / 100_000;
    const formatted = String(Math.round(lakhs * 10) / 10);
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

function formatDepositDatetime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("si-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(iso);
  }
}

function bankBrand(bankName) {
  return BANK_BRANDS[bankName] ?? BANK_BRANDS.BOC;
}

function mapAccount(row) {
  const bankName = BANK_NAME_OPTIONS.includes(String(row.bank_name ?? "").trim())
    ? String(row.bank_name).trim()
    : BANK_NAME_OPTIONS[0];
  return {
    id: String(row.id),
    bank_name: bankName,
    account_name: String(row.account_name ?? "").trim(),
    account_number: String(row.account_number ?? "").trim(),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function accountOptionLabel(account) {
  return `${account.bank_name} - ${account.account_name} (${account.account_number})`;
}

function mapDeposit(row) {
  const rawAcc = row.bank_accounts;
  const account =
    rawAcc && typeof rawAcc === "object" && !Array.isArray(rawAcc)
      ? mapAccount(rawAcc)
      : null;
  return {
    id: String(row.id),
    bank_account_id: String(row.bank_account_id ?? account?.id ?? ""),
    amount: Number(row.amount ?? 0),
    deposited_at: String(row.deposited_at ?? new Date().toISOString()),
    reference_note: String(row.reference_note ?? "").trim(),
    created_at: String(row.created_at ?? new Date().toISOString()),
    account,
  };
}

function matchesDateFilter(depositedAtIso, dateFilter, customDate) {
  const d = new Date(depositedAtIso);
  if (Number.isNaN(d.getTime())) return false;

  if (dateFilter === DATE_CUSTOM) {
    const pick = String(customDate ?? "").trim();
    if (!pick) return true;
    const target = startOfDay(new Date(`${pick}T12:00:00`));
    return d >= startOfDay(target) && d <= endOfDay(target);
  }

  if (dateFilter === DATE_ALL) return true;

  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  if (dateFilter === DATE_TODAY) {
    return d >= todayStart && d <= todayEnd;
  }

  if (dateFilter === DATE_YESTERDAY) {
    const y = new Date(todayStart);
    y.setDate(y.getDate() - 1);
    return d >= startOfDay(y) && d <= endOfDay(y);
  }

  if (dateFilter === DATE_MONTH) {
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    return d >= monthStart && d <= todayEnd;
  }

  return true;
}

function filterDeposits(list, search, dateFilter, customDate) {
  const q = String(search ?? "").trim().toLowerCase();
  return list.filter((dep) => {
    if (!matchesDateFilter(dep.deposited_at, dateFilter, customDate)) return false;
    if (!q) return true;
    const acc = dep.account;
    const hay = [
      dep.reference_note,
      acc?.bank_name,
      acc?.account_name,
      acc?.account_number,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition-all ${
        active ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE
      }`}
    >
      {children}
    </button>
  );
}

function BankLogo({ bankName, className = "h-9 w-9 rounded-lg border border-white/80 bg-white object-contain p-0.5" }) {
  const brand = bankBrand(bankName);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [brand.logoUrl]);

  if (failed || !brand.logoUrl) {
    return (
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[9px] font-black text-neutral-600 ${className}`}
      >
        {brand.short}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.logoUrl}
      alt={bankName}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function AmountPreview({ amount }) {
  const n = toNum(amount);
  if (!n) {
    return (
      <p className="text-sm font-semibold text-neutral-400">{T.amountPreview}: —</p>
    );
  }
  const f = formatSinhalaLakhCrore(n);
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/70">
        {T.amountPreview}
      </p>
      <p className="text-xl font-black text-emerald-800" lang="si">
        {f.main}
      </p>
      <p className="text-xs font-semibold text-emerald-700/80">{f.sub}</p>
    </div>
  );
}

function RegisteredAccountChip({ account, onDelete }) {
  const brand = bankBrand(account.bank_name);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${brand.badge}`}
    >
      <BankLogo bankName={account.bank_name} className="h-7 w-7 rounded-md object-contain p-0.5" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black">{account.account_name}</p>
        <p className="truncate text-[10px] font-semibold opacity-80">
          {account.bank_name} · {account.account_number}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(account)}
        className={ICON_BTN}
        aria-label={T.deleteAccountConfirm}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
    </motion.div>
  );
}

function DepositRow({ deposit, onDelete, index }) {
  const acc = deposit.account;
  const bankName = acc?.bank_name ?? "BOC";
  const brand = bankBrand(bankName);
  const fin = formatSinhalaLakhCrore(deposit.amount);

  return (
    <motion.article
      layout
      custom={index}
      variants={staggerChild}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -20, scale: 0.98 }}
      whileHover={cardHoverMotion}
      className={`overflow-hidden rounded-3xl border-2 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-6 ${brand.card}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <BankLogo bankName={bankName} />
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${brand.badge}`}
            >
              <Landmark className="h-3.5 w-3.5" />
              {bankName}
            </span>
            {acc ? (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-neutral-700">
                {acc.account_name} · {acc.account_number}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
              <CalendarClock className="h-3 w-3" />
              {formatDepositDatetime(deposit.deposited_at)}
            </span>
          </div>
          <p
            className={`text-base font-bold leading-relaxed ${brand.accent}`}
            lang="si"
          >
            {deposit.reference_note || "—"}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-end">
          <div className="text-left sm:text-right">
            <p className="font-mono text-xl font-black text-emerald-700 sm:text-2xl">
              +{moneyFullLkr(deposit.amount)}
            </p>
            <p className="text-xs font-bold text-neutral-600" lang="si">
              {fin.main}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(deposit)}
            className={`${ICON_BTN} bg-white/80`}
            aria-label={T.deleteDepositConfirm}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function createAccountForm() {
  return {
    bank_name: BANK_NAME_OPTIONS[0],
    account_name: "",
    account_number: "",
  };
}

function createDepositForm(accountId = "") {
  return {
    bank_account_id: accountId,
    amount: "",
    deposited_at: nowLocalDatetimeValue(),
    reference_note: "",
  };
}

export default function DepositsPage() {
  const [accounts, setAccounts] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [accountForm, setAccountForm] = useState(createAccountForm);
  const [depositForm, setDepositForm] = useState(createDepositForm);
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(DATE_ALL);
  const [customDate, setCustomDate] = useState("");

  const filteredDeposits = useMemo(
    () => filterDeposits(deposits, search, dateFilter, customDate),
    [deposits, search, dateFilter, customDate]
  );

  const filteredTotal = useMemo(
    () => filteredDeposits.reduce((s, d) => s + d.amount, 0),
    [filteredDeposits]
  );

  const hasActiveFilters =
    search.trim() !== "" ||
    dateFilter !== DATE_ALL ||
    (dateFilter === DATE_CUSTOM && customDate !== "");

  const refreshAccounts = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchErr) throw fetchErr;
    return (data ?? []).map(mapAccount);
  }, []);

  const refreshDeposits = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from("bank_deposits")
      .select("*, bank_accounts(*)")
      .order("deposited_at", { ascending: false });
    if (fetchErr) throw fetchErr;
    return (data ?? []).map(mapDeposit);
  }, []);

  const refresh = useCallback(async () => {
    const [accList, depList] = await Promise.all([
      refreshAccounts(),
      refreshDeposits(),
    ]);
    setAccounts(accList);
    setDeposits(depList);
    setDepositForm((prev) => {
      const stillValid = accList.some((a) => a.id === prev.bank_account_id);
      const nextId = stillValid ? prev.bank_account_id : accList[0]?.id ?? "";
      return { ...prev, bank_account_id: nextId };
    });
  }, [refreshAccounts, refreshDeposits]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
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

  const saveAccount = async (ev) => {
    ev.preventDefault();
    const name = String(accountForm.account_name ?? "").trim();
    const number = String(accountForm.account_number ?? "").trim();
    if (!name || !number) {
      setError("Account nickname and number are required");
      return;
    }
    setSavingAccount(true);
    setError("");
    try {
      const { data, error: insErr } = await supabase
        .from("bank_accounts")
        .insert({
          bank_name: accountForm.bank_name,
          account_name: name,
          account_number: number,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;
      const created = mapAccount(data);
      setAccounts((prev) => [created, ...prev]);
      setAccountForm(createAccountForm());
      setDepositForm((f) =>
        f.bank_account_id ? f : { ...f, bank_account_id: created.id }
      );
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSavingAccount(false);
    }
  };

  const saveDeposit = async (ev) => {
    ev.preventDefault();
    if (!depositForm.bank_account_id) {
      setError(T.noAccountForDeposit);
      return;
    }
    if (!toNum(depositForm.amount)) {
      setError("Amount is required");
      return;
    }
    setSavingDeposit(true);
    setError("");
    try {
      const { data, error: insErr } = await supabase
        .from("bank_deposits")
        .insert({
          bank_account_id: depositForm.bank_account_id,
          amount: toNum(depositForm.amount),
          deposited_at: localDatetimeToIso(depositForm.deposited_at),
          reference_note: String(depositForm.reference_note ?? "").trim(),
        })
        .select("*, bank_accounts(*)")
        .single();
      if (insErr) throw insErr;
      const created = mapDeposit(data);
      setDeposits((prev) =>
        [created, ...prev].sort(
          (a, b) =>
            new Date(b.deposited_at).getTime() - new Date(a.deposited_at).getTime()
        )
      );
      setDepositForm(createDepositForm(depositForm.bank_account_id));
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSavingDeposit(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (!window.confirm(T.deleteAccountConfirm)) return;
    setError("");
    try {
      const { error: delErr } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", account.id);
      if (delErr) throw delErr;
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      setDeposits((prev) => prev.filter((d) => d.bank_account_id !== account.id));
      setDepositForm((f) =>
        f.bank_account_id === account.id
          ? createDepositForm(accounts.find((a) => a.id !== account.id)?.id ?? "")
          : f
      );
    } catch (err) {
      setError(dbError(err));
    }
  };

  const handleDeleteDeposit = async (deposit) => {
    if (!window.confirm(T.deleteDepositConfirm)) return;
    setError("");
    try {
      const { error: delErr } = await supabase
        .from("bank_deposits")
        .delete()
        .eq("id", deposit.id);
      if (delErr) throw delErr;
      setDeposits((prev) => prev.filter((d) => d.id !== deposit.id));
    } catch (err) {
      setError(dbError(err));
    }
  };

  const handleDatePill = (pillId) => {
    setDateFilter(pillId);
    if (pillId !== DATE_CUSTOM) setCustomDate("");
  };

  const handleCustomDate = (value) => {
    setCustomDate(value);
    setDateFilter(value ? DATE_CUSTOM : DATE_ALL);
  };

  return (
    <motion.main
      className="w-full min-h-screen bg-[#F4F4F7] px-4 py-8 sm:px-8 lg:px-16 lg:py-12"
      variants={pageEnter}
      initial="hidden"
      animate="show"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-4xl" lang="si">
          {T.pageTitle}
        </h1>
        <p className="mt-2 text-sm font-semibold text-neutral-500">{T.pageSub}</p>
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

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="grid w-full gap-8 xl:grid-cols-[minmax(360px,480px)_minmax(0,1fr)]">
          <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <motion.section
              variants={staggerChild}
              initial="hidden"
              animate="show"
              className={CARD}
            >
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-neutral-950">
                <Building2 className="h-5 w-5" />
                <span lang="si">{T.accountFormTitle}</span>
              </h2>
              <form onSubmit={saveAccount} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.bankName}
                  </label>
                  <select
                    className={INPUT}
                    value={accountForm.bank_name}
                    onChange={(ev) =>
                      setAccountForm((f) => ({ ...f, bank_name: ev.target.value }))
                    }
                  >
                    {BANK_NAME_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.accountNickname}
                  </label>
                  <input
                    className={INPUT}
                    value={accountForm.account_name}
                    onChange={(ev) =>
                      setAccountForm((f) => ({ ...f, account_name: ev.target.value }))
                    }
                    placeholder="Main current account"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.accountNumber}
                  </label>
                  <input
                    className={INPUT}
                    value={accountForm.account_number}
                    onChange={(ev) =>
                      setAccountForm((f) => ({
                        ...f,
                        account_number: ev.target.value,
                      }))
                    }
                    placeholder="1234567890"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="w-full rounded-2xl border-2 border-neutral-950 bg-white py-3.5 text-sm font-bold text-neutral-950 transition hover:bg-neutral-50 disabled:opacity-60"
                >
                  {savingAccount ? "..." : T.saveAccount}
                </button>
              </form>

              {accounts.length > 0 ? (
                <div className="mt-5 border-t border-neutral-100 pt-4">
                  <p className="mb-2 text-xs font-bold text-neutral-500">
                    {T.registeredAccounts}
                  </p>
                  <div className="flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {accounts.map((acc) => (
                        <RegisteredAccountChip
                          key={acc.id}
                          account={acc}
                          onDelete={handleDeleteAccount}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs font-semibold text-neutral-400">{T.emptyAccounts}</p>
              )}
            </motion.section>

            <motion.section
              variants={staggerChild}
              initial="hidden"
              animate="show"
              className={CARD}
            >
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-neutral-950">
                <Plus className="h-5 w-5" />
                <span lang="si">{T.quickAdd}</span>
              </h2>
              <form onSubmit={saveDeposit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.selectAccount}
                  </label>
                  <select
                    className={INPUT}
                    value={depositForm.bank_account_id}
                    onChange={(ev) =>
                      setDepositForm((f) => ({
                        ...f,
                        bank_account_id: ev.target.value,
                      }))
                    }
                    disabled={accounts.length === 0}
                  >
                    {accounts.length === 0 ? (
                      <option value="">{T.noAccountForDeposit}</option>
                    ) : (
                      accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {accountOptionLabel(acc)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.amount}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className={AMOUNT_INPUT}
                    value={depositForm.amount}
                    onChange={(ev) =>
                      setDepositForm((f) => ({ ...f, amount: ev.target.value }))
                    }
                    disabled={accounts.length === 0}
                    placeholder="0"
                  />
                  <div className="mt-2">
                    <AmountPreview amount={depositForm.amount} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {T.dateTime}
                  </label>
                  <input
                    type="datetime-local"
                    className={INPUT}
                    value={depositForm.deposited_at}
                    onChange={(ev) =>
                      setDepositForm((f) => ({
                        ...f,
                        deposited_at: ev.target.value,
                      }))
                    }
                    disabled={accounts.length === 0}
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                    <FileText className="h-3.5 w-3.5" />
                    {T.referenceNote}
                  </label>
                  <textarea
                    rows={4}
                    className={`${INPUT} min-h-[96px] resize-y text-base font-semibold leading-relaxed`}
                    value={depositForm.reference_note}
                    onChange={(ev) =>
                      setDepositForm((f) => ({
                        ...f,
                        reference_note: ev.target.value,
                      }))
                    }
                    disabled={accounts.length === 0}
                    placeholder="e.g. Payment sent for Paddy Load 01 from Araliya Rice"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingDeposit || accounts.length === 0}
                  className="w-full rounded-2xl bg-neutral-950 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60"
                >
                  {savingDeposit ? "..." : T.saveDeposit}
                </button>
              </form>
            </motion.section>
          </div>

          <section className="min-w-0 w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black text-neutral-950">
                <Banknote className="h-5 w-5" />
                <span lang="si">{T.ledgerTitle}</span>
              </h2>
              {hasActiveFilters && filteredDeposits.length > 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                    {T.filteredTotal}
                  </p>
                  <p className="font-mono text-sm font-black text-emerald-700">
                    {moneyFullLkr(filteredTotal)}
                  </p>
                  <p className="text-[10px] font-semibold text-neutral-400">
                    {filteredDeposits.length} {T.matchCount}
                  </p>
                </div>
              ) : null}
            </div>

            <div className={`mb-4 ${CARD} sm:p-5`}>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold text-neutral-500">
                <Search className="h-4 w-4" />
                {T.search}
              </label>
              <input
                type="search"
                className={INPUT}
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                placeholder={T.searchPlaceholder}
                autoComplete="off"
              />

              <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                {T.dateFilter}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {DATE_FILTER_PILLS.map((pill) => (
                  <FilterPill
                    key={pill.id}
                    active={
                      dateFilter === pill.id &&
                      (pill.id !== DATE_CUSTOM || !customDate)
                    }
                    onClick={() => handleDatePill(pill.id)}
                  >
                    <span lang="si">{pill.labelSi}</span>
                    <span className="opacity-70"> ({pill.labelEn})</span>
                  </FilterPill>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                  <CreditCard className="h-4 w-4" />
                  {T.customDate}
                </label>
                <input
                  type="date"
                  className={`${INPUT} sm:max-w-xs`}
                  value={customDate}
                  onChange={(ev) => handleCustomDate(ev.target.value)}
                />
                {dateFilter === DATE_CUSTOM && customDate ? (
                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-bold text-neutral-700">
                    {formatDate(customDate)}
                  </span>
                ) : null}
              </div>
            </div>

            {deposits.length === 0 ? (
              <p className="py-16 text-center text-lg font-bold text-neutral-400" lang="si">
                {T.emptyLedger}
              </p>
            ) : filteredDeposits.length === 0 ? (
              <p className="py-16 text-center text-lg font-bold text-neutral-400" lang="si">
                {T.emptyFilter}
              </p>
            ) : (
              <motion.div className="flex flex-col gap-3" layout>
                <AnimatePresence mode="popLayout">
                  {filteredDeposits.map((deposit, i) => (
                    <DepositRow
                      key={deposit.id}
                      deposit={deposit}
                      index={i}
                      onDelete={handleDeleteDeposit}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>
        </div>
      )}
    </motion.main>
  );
}
