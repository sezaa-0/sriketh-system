"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  User,
  Calendar,
  Coins,
  Fuel,
  Pencil,
  Trash2,
  ArrowUpRight,
  TrendingUp,
  Package,
  Gauge,
  Hash,
  Wallet,
  Sparkles,
  Clock,
} from "lucide-react";

/** @typedef {import('@supabase/supabase-js').PostgrestError} PostgrestError */

/** @typedef {{
 *   id: string;
 *   hire_reference: string;
 *   lorry_number: string;
 *   hirer_name: string;
 *   driver_name: string;
 *   depart_date: string;
 *   return_date: string;
 *   start_km: number;
 *   end_km: number;
 *   hire_rate: number;
 *   paid_amount: number;
 *   diesel_cost: number;
 *   driver_wage: number;
 *   helper_wage: number;
 *   other_expenses: number;
 *   is_settled: boolean;
 *   created_at: string;
 * }} Hire */

/** @typedef {typeof INITIAL_FORM} HireForm */

const EMERALD = "#10B981";
const ORANGE = "#F97316";

const T = {
  pageTitle: "Lorry Hire Log",
  tabReports: "📊 Hire Reports",
  tabNew: "➕ New Hire",
  statCount: "Total Hires",
  statRevenue: "Total Hire Revenue",
  statProfit: "Net Profit from Hires",
  statPending: "Total Pending Receivables",
  filterAll: "All",
  filterSettled: "✅ Settled",
  filterPending: "⏳ Pending",
  formHeading: "Lorry Hire Details",
  lorry: "Lorry Number",
  hirer: "Hirer",
  driver: "Driver",
  runKm: "Run KM",
  departDate: "Departed Date",
  returnDate: "Returned Date",
  formStartDate: "Start Date",
  formEndDate: "Return Date",
  startKm: "Start KM",
  endKm: "End KM",
  hireRate: "Agreed Rate",
  totalFare: "Total Fare",
  paidAmount: "Paid Amount",
  paidSoFar: "Paid So Far",
  remaining: "Remaining",
  quickPayPlaceholder: "Payment amount",
  quickPayBtn: "Pay",
  dieselCost: "Diesel Cost",
  driverWage: "Driver Wage",
  helperWage: "Helper Wage",
  extraCost: "Additional Cost",
  paid: "Payment Received",
  netProfit: "Net Profit",
  netLoss: "Net Loss",
  save: "Save Hire",
  update: "Update Hire",
  empty: "No hire records",
  confirmDelete: "Do you want to delete this hire record?",
};

const INITIAL_FORM = {
  lorry_number: "",
  hirer_name: "",
  driver_name: "",
  depart_date: "",
  return_date: "",
  start_km: "",
  end_km: "",
  hire_rate: "",
  paid_amount: "",
  diesel_cost: "",
  driver_wage: "",
  helper_wage: "",
  other_expenses: "",
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
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardHoverMotion = {
  y: -8,
  scale: 1.02,
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

/** @param {unknown} err */
function dbError(err) {
  if (!err) return "Database error";
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const e = /** @type {{ message?: string; details?: string; hint?: string }} */ (err);
    return [e.message, e.details, e.hint].filter(Boolean).join(" — ") || "Error";
  }
  return String(err);
}

/** @param {unknown} v */
function toNum(v) {
  if (v == null || String(v).trim() === "") return 0;
  const n = parseFloat(String(v).trim());
  return Number.isNaN(n) ? 0 : n;
}

/** @param {unknown} d */
function toDateOrNull(d) {
  const s = String(d ?? "").trim();
  return s === "" ? null : s;
}

/** @param {Record<string, unknown>} row */
function mapHire(row) {
  return /** @type {Hire} */ ({
    id: String(row.id),
    hire_reference: row.hire_reference ? String(row.hire_reference) : "",
    lorry_number: String(row.lorry_number ?? "").trim(),
    hirer_name: String(row.hirer_name ?? "").trim(),
    driver_name: String(row.driver_name ?? "").trim(),
    depart_date: row.depart_date ? String(row.depart_date) : "",
    return_date: row.return_date ? String(row.return_date) : "",
    start_km: Number(row.start_km ?? 0),
    end_km: Number(row.end_km ?? 0),
    hire_rate: Number(row.hire_rate ?? 0),
    paid_amount: Number(row.paid_amount ?? 0),
    diesel_cost: Number(row.diesel_cost ?? 0),
    driver_wage: Number(row.driver_wage ?? 0),
    helper_wage: Number(row.helper_wage ?? 0),
    other_expenses: Number(row.other_expenses ?? 0),
    is_settled: deriveIsSettled(Number(row.hire_rate ?? 0), Number(row.paid_amount ?? 0)),
    created_at: String(row.created_at ?? new Date().toISOString()),
  });
}

/** @param {number} fare @param {number} paid */
function deriveIsSettled(fare, paid) {
  return fare > 0 && paid >= fare;
}

/** @param {Pick<Hire, 'hire_rate'|'paid_amount'|'is_settled'>} hire */
function hirePayment(hire) {
  const fare = hire.hire_rate;
  const paid = hire.paid_amount;
  const remaining = Math.max(0, fare - paid);
  const settled = deriveIsSettled(fare, paid);
  return { fare, paid, remaining, settled };
}

/** @param {number} paid */
function formatPaidDisplay(paid) {
  const n = Math.abs(Number(paid) || 0);
  if (n >= 100_000) return formatSinhalaLakhCrore(n).main;
  return moneyFullLkr(n);
}

/** @param {Pick<Hire, 'hire_rate'|'paid_amount'>} hire */
function paymentBadgeText(hire) {
  const p = hirePayment(hire);
  return `${T.paidSoFar}: ${formatPaidDisplay(p.paid)} | ${T.remaining}: ${moneyFullLkr(p.remaining)}`;
}

/** @param {Pick<Hire, 'hire_rate'|'diesel_cost'|'driver_wage'|'helper_wage'|'other_expenses'>} hire */
function hireFinance(hire) {
  const expenses =
    hire.diesel_cost + hire.driver_wage + hire.helper_wage + hire.other_expenses;
  return { expenses, netProfit: hire.hire_rate - expenses };
}

/** @param {Hire[]} hires */
function dashboardStats(hires) {
  let totalRevenue = 0;
  let totalProfit = 0;
  let pendingReceivable = 0;
  for (const h of hires) {
    totalRevenue += h.hire_rate;
    totalProfit += hireFinance(h).netProfit;
    const pay = hirePayment(h);
    if (!pay.settled) pendingReceivable += pay.remaining;
  }
  return { totalRevenue, totalCount: hires.length, totalProfit, pendingReceivable };
}

/** @param {HireForm} form */
function buildPayload(form) {
  const hire_rate = toNum(form.hire_rate);
  const paid_amount = toNum(form.paid_amount);
  return {
    lorry_number: String(form.lorry_number ?? "").trim(),
    hirer_name: String(form.hirer_name ?? "").trim(),
    driver_name: String(form.driver_name ?? "").trim(),
    depart_date: toDateOrNull(form.depart_date),
    return_date: toDateOrNull(form.return_date),
    start_km: toNum(form.start_km),
    end_km: toNum(form.end_km),
    hire_rate,
    paid_amount,
    diesel_cost: toNum(form.diesel_cost),
    driver_wage: toNum(form.driver_wage),
    helper_wage: toNum(form.helper_wage),
    other_expenses: toNum(form.other_expenses),
    is_settled: deriveIsSettled(hire_rate, paid_amount),
  };
}

async function nextHireRef() {
  const prefix = `HIRE-${new Date().getFullYear()}-`;
  const { data, error } = await supabase
    .from("lorry_hires")
    .select("hire_reference")
    .ilike("hire_reference", `${prefix}%`);
  if (error) return `${prefix}${Date.now()}`;
  const nums = (data ?? [])
    .map((r) => {
      const m = String(r.hire_reference).match(/HIRE-\d{4}-(\d+)$/i);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n) && n > 0);
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/** @returns {Promise<Hire[]>} */
async function loadHires() {
  const { data, error } = await supabase
    .from("lorry_hires")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase Fetch Error Detailed:", error);
    throw new Error(dbError(error));
  }
  return (data ?? []).map(mapHire);
}

/** @param {HireForm} form @returns {Promise<Hire>} */
async function insertHire(form) {
  const hire_reference = await nextHireRef();
  const payload = { hire_reference, ...buildPayload(form) };
  let { data, error } = await supabase.from("lorry_hires").insert(payload).select().single();
  if (error?.code === "23505") {
    ({ data, error } = await supabase
      .from("lorry_hires")
      .insert({ ...payload, hire_reference: `HIRE-${Date.now()}` })
      .select()
      .single());
  }
  if (error) {
    console.error("Supabase Insert Error Detailed:", error, payload);
    throw new Error(dbError(error));
  }
  if (!data) throw new Error("Hire was not saved");
  return mapHire(data);
}

/** @param {string} id @param {HireForm} form @returns {Promise<Hire>} */
async function updateHire(id, form) {
  const payload = buildPayload(form);
  const { data, error } = await supabase
    .from("lorry_hires")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Supabase Update Error Detailed:", error, payload);
    throw new Error(dbError(error));
  }
  if (!data) throw new Error("Update failed");
  return mapHire(data);
}

/** @param {string} id */
async function deleteHireById(id) {
  const { error } = await supabase.from("lorry_hires").delete().eq("id", id);
  if (error) {
    console.error("Supabase Delete Error Detailed:", error);
    throw new Error(dbError(error));
  }
}

/**
 * Quick partial payment from hire card.
 * @param {string} id
 * @param {number} currentPaid
 * @param {number} hireRate
 * @param {number} addAmount
 * @returns {Promise<Hire>}
 */
async function applyQuickPartialPayment(id, currentPaid, hireRate, addAmount) {
  const new_paid_amount = currentPaid + addAmount;
  const is_settled = deriveIsSettled(hireRate, new_paid_amount);
  const { data, error } = await supabase
    .from("lorry_hires")
    .update({ paid_amount: new_paid_amount, is_settled })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Supabase Quick Pay Error Detailed:", error, {
      id,
      new_paid_amount,
      is_settled,
    });
    throw new Error(dbError(error));
  }
  if (!data) throw new Error("Payment update failed");
  return mapHire(data);
}

/** @param {Hire} hire @returns {HireForm} */
function hireToForm(hire) {
  const str = (/** @type {number} */ n) => (n === 0 ? "" : String(n));
  return {
    lorry_number: hire.lorry_number,
    hirer_name: hire.hirer_name,
    driver_name: hire.driver_name,
    depart_date: hire.depart_date,
    return_date: hire.return_date,
    start_km: str(hire.start_km),
    end_km: str(hire.end_km),
    hire_rate: str(hire.hire_rate),
    paid_amount: str(hire.paid_amount),
    diesel_cost: str(hire.diesel_cost),
    driver_wage: str(hire.driver_wage),
    helper_wage: str(hire.helper_wage),
    other_expenses: str(hire.other_expenses),
  };
}

/** @param {number} n */
function money(n) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** @param {number} n */
function moneyPlain(n) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(n);
}

/** @param {number} n */
function moneyFullLkr(n) {
  const abs = Math.abs(Number(n) || 0);
  const sign = n < 0 ? "-" : "";
  const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(abs);
  return `${sign}Rs. ${fmt}`;
}

/** @param {number} n */
function trimLakhDecimal(n) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

/**
 * Sri Lankan lakh/crore short labels for bento financial cards.
 * @param {number} amount
 * @returns {{ main: string; sub: string }}
 */
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

/** @param {string} d */
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

/** @param {Hire} hire */
function runKmLabel(hire) {
  const diff = Math.max(0, hire.end_km - hire.start_km);
  if (hire.start_km === 0 && hire.end_km === 0) return "—";
  return `${moneyPlain(hire.start_km)} → ${moneyPlain(hire.end_km)} (${moneyPlain(diff)} km)`;
}

/** @param {{ label: string; children: import('react').ReactNode; className?: string }} props */
function Field({ label, children, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label
        className="mb-2 block text-[12px] font-black uppercase tracking-wider text-neutral-800"
        lang="si"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/** @param {{ id: string; label: string; name: string; value: string; onChange: (v: string) => void }} props */
function DateField({ id, label, name, value, onChange }) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-black text-neutral-700"
        lang="si"
      >
        {label}
      </label>
      <div className="relative min-w-0">
        <Calendar
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          aria-hidden
        />
        <input
          id={id}
          name={name}
          type="date"
          className={`${INPUT} pl-12`}
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
        />
      </div>
    </div>
  );
}

/** Main form section heading */
function FormMainHeading() {
  return (
    <h2
      className="mb-4 border-b border-neutral-100 pb-2 text-sm font-black uppercase tracking-widest text-neutral-400"
      lang="si"
    >
      {T.formHeading}
    </h2>
  );
}

/** @param {{ title: string }} props */
function SectionTag({ title }) {
  return (
    <h3
      className="text-[13px] font-black uppercase tracking-[0.25em] text-neutral-950"
      lang="si"
    >
      {title}
    </h3>
  );
}

/** @param {{ label: string; value: string }} props */
function MetaPill({ label, value }) {
  return (
    <div
      className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] rounded-2xl bg-[#F8F9FA]/90 px-4 py-3 ring-1 ring-neutral-200/70 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:ring-neutral-300 sm:basis-auto sm:min-w-[140px]"
      lang="si"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 break-words text-[13px] font-black leading-snug text-neutral-900">
        {value}
      </p>
    </div>
  );
}

/** @param {{ title: string; amount: number }} props */
function BentoPendingMetric({ title, amount }) {
  const financial = formatSinhalaLakhCrore(amount);

  return (
    <motion.div
      custom={0}
      variants={staggerChild}
      initial="hidden"
      animate="show"
      whileHover={cardHoverMotion}
      className="flex min-h-[180px] min-w-0 flex-col overflow-visible rounded-[24px] border border-[#FFE0B2] bg-[#FFF3E0] p-6 text-[#E65100] shadow-sm transition-shadow duration-300"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold leading-snug" lang="si">
            {title}
          </p>
          <div className="mt-4 min-w-0">
            <p
              className="break-words text-3xl font-black leading-tight tracking-tight lg:text-4xl xl:text-5xl"
              lang="si"
            >
              {financial.main}
            </p>
            <p className="mt-2 text-sm font-bold tabular-nums text-[#E65100]/70">
              {financial.sub}
            </p>
          </div>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFE0B2]/60 text-[#E65100]">
          <Clock className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </div>
      </div>
    </motion.div>
  );
}

/** @param {{ title: string; value?: string | number; amount?: number; icon: import('lucide-react').LucideIcon; accent: 'orange'|'neutral'|'emerald' }} props */
function BentoMetric({ title, value, amount, icon: Icon, accent }) {
  const isEmerald = accent === "emerald";
  const isOrange = accent === "orange";
  const financial = amount !== undefined ? formatSinhalaLakhCrore(amount) : null;

  return (
    <motion.div
      custom={0}
      variants={staggerChild}
      initial="hidden"
      animate="show"
      whileHover={cardHoverMotion}
      className={`flex min-h-[180px] min-w-0 flex-col overflow-visible rounded-[28px] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.02)] transition-shadow duration-300 ${
        isEmerald
          ? "border border-[#A5D6A7] bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] text-[#1B5E20]"
          : isOrange
            ? "border border-neutral-100 border-l-4 bg-white"
            : "border border-neutral-100 bg-white"
      }`}
      style={isOrange ? { borderLeftColor: ORANGE } : undefined}
    >
      <div className="flex min-w-0 flex-1 items-start gap-6">
        <div className="min-w-0 flex-1">
          <p
            className={`text-[14px] font-bold leading-snug ${
              isEmerald ? "text-[#1B5E20]" : isOrange ? "text-[#F97316]" : "text-neutral-600"
            }`}
            lang="si"
          >
            {title}
          </p>
          {financial ? (
            <div className="mt-6 min-w-0">
              <p
                className={`break-words font-black leading-tight tracking-tight ${
                  isEmerald
                    ? "text-3xl lg:text-4xl xl:text-5xl"
                    : "text-3xl text-neutral-950 lg:text-4xl xl:text-5xl"
                }`}
                lang="si"
              >
                {financial.main}
              </p>
              <p
                className={`mt-2 text-sm font-bold tabular-nums ${
                  isEmerald ? "text-[#1B5E20]/65" : "text-neutral-500"
                }`}
              >
                {financial.sub}
              </p>
            </div>
          ) : (
            <p
              className={`mt-6 break-words font-black tracking-tight tabular-nums ${
                isEmerald
                  ? "text-4xl lg:text-5xl xl:text-[3.25rem]"
                  : "text-4xl text-neutral-950 lg:text-5xl xl:text-[3.25rem]"
              }`}
            >
              {value}
            </p>
          )}
        </div>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
            isEmerald
              ? "bg-white/60 text-[#1B5E20]"
              : isOrange
                ? "bg-[#FFF7ED] text-[#F97316]"
                : "bg-[#F8F9FA] text-neutral-800"
          }`}
        >
          <Icon className="h-7 w-7" strokeWidth={2.25} aria-hidden />
        </div>
      </div>
    </motion.div>
  );
}

/** @param {{ hire: Hire; onEdit: () => void; onDelete: () => void; onAfterQuickPay: () => Promise<void>; onQuickPayError: (msg: string) => void; busy: boolean; index: number }} props */
function HireCard({ hire, onEdit, onDelete, onAfterQuickPay, onQuickPayError, busy, index }) {
  const [quickAmount, setQuickAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const fin = hireFinance(hire);
  const pay = hirePayment(hire);
  const settled = pay.settled;
  const profitOk = fin.netProfit >= 0;
  const cardBusy = busy || paying;

  const handleQuickPay = async () => {
    const addAmount = toNum(quickAmount);
    if (addAmount <= 0) {
      onQuickPayError("Enter payment amount");
      return;
    }
    setPaying(true);
    onQuickPayError("");
    try {
      await applyQuickPartialPayment(hire.id, hire.paid_amount, hire.hire_rate, addAmount);
      setQuickAmount("");
      await onAfterQuickPay();
    } catch (err) {
      console.error("Supabase Quick Pay Error Detailed:", err);
      onQuickPayError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <motion.article
      layout
      custom={index}
      variants={staggerChild}
      initial="hidden"
      animate="show"
      whileHover={cardHoverMotion}
      className={`relative flex min-w-0 flex-col overflow-visible rounded-[28px] border border-neutral-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] ${
        settled ? "border-l-8 border-l-[#10B981]" : "border-l-8 border-l-[#F97316]"
      } ${cardBusy ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="flex flex-col p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <span className="inline-flex shrink-0 font-mono text-[12px] font-bold rounded-xl bg-neutral-100 px-3 py-1.5 text-neutral-800 ring-1 ring-neutral-200/80">
            {hire.lorry_number || "—"}
          </span>
          <div className="flex shrink-0 gap-2">
            <motion.button
              type="button"
              onClick={onEdit}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F9FA] text-neutral-600 ring-1 ring-neutral-200/80 transition-colors duration-300 hover:bg-[#ECFDF5] hover:text-[#10B981]"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" strokeWidth={2.2} />
            </motion.button>
            <motion.button
              type="button"
              onClick={onDelete}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F9FA] text-neutral-600 ring-1 ring-neutral-200/80 transition-colors duration-300 hover:bg-[#FFF7ED] hover:text-[#F97316]"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.2} />
            </motion.button>
          </div>
        </div>

        <p className="text-[12px] font-bold text-neutral-500" lang="si">
          {T.hirer}
        </p>
        <h3
          className="mb-4 break-words text-2xl font-black leading-tight tracking-tight text-neutral-900"
          lang="si"
        >
          {hire.hirer_name || "—"}
        </h3>

        <div className="flex flex-wrap gap-2">
          <MetaPill label={T.driver} value={hire.driver_name || "—"} />
          <MetaPill label={T.runKm} value={runKmLabel(hire)} />
          <MetaPill label={T.departDate} value={formatDate(hire.depart_date)} />
          <MetaPill label={T.returnDate} value={formatDate(hire.return_date)} />
        </div>

        <div
          className={`mt-4 break-words rounded-2xl px-4 py-3 text-[12px] font-bold leading-snug ring-1 ${
            settled
              ? "bg-[#ECFDF5] text-[#10B981] ring-[#A5D6A7]/60"
              : "bg-[#FFF7ED] text-[#E65100] ring-[#FFE0B2]/80"
          }`}
          lang="si"
        >
          {paymentBadgeText(hire)}
        </div>

        <div
          className={`mt-6 rounded-[20px] p-5 font-bold ${
            profitOk
              ? "border border-[#A5D6A7] bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] text-[#1B5E20]"
              : "bg-[#FFF7ED] text-[#F97316]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[15px]" lang="si">
              <TrendingUp className="h-5 w-5 shrink-0" />
              {profitOk ? T.netProfit : T.netLoss}
            </span>
            <span className="shrink-0 text-xl font-black tabular-nums lg:text-2xl">
              {profitOk ? "+" : ""}
              {money(fin.netProfit)}
            </span>
          </div>
          <p className="mt-2 text-right text-[12px] font-bold opacity-80 tabular-nums">
            {T.hireRate}: {money(hire.hire_rate)}
          </p>
        </div>

        {!settled ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
            <input
              type="number"
              min="0"
              placeholder={T.quickPayPlaceholder}
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleQuickPay();
                }
              }}
              disabled={cardBusy}
              className="w-32 min-w-0 bg-neutral-100 border-0 rounded-xl px-3 py-1.5 font-bold text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none"
              lang="si"
            />
            <motion.button
              type="button"
              onClick={handleQuickPay}
              disabled={cardBusy}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0 rounded-xl bg-emerald-600 px-4 py-1.5 font-black text-xs uppercase tracking-wider text-white transition-all duration-300 hover:bg-emerald-700 disabled:opacity-50"
              lang="si"
            >
              {paying ? "…" : T.quickPayBtn}
            </motion.button>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

export default function LorryHirePage() {
  /** @type {[Hire[], import('react').Dispatch<import('react').SetStateAction<Hire[]>>]} */
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** @type {[string | null, import('react').Dispatch<import('react').SetStateAction<string | null>>]} */
  const [deletingId, setDeletingId] = useState(null);
  /** @type {[string | null, import('react').Dispatch<import('react').SetStateAction<string | null>>]} */
  const [error, setError] = useState(null);
  /** @type {['reports' | 'new', import('react').Dispatch<import('react').SetStateAction<'reports' | 'new'>>]} */
  const [tab, setTab] = useState("reports");
  /** @type {['all' | 'settled' | 'pending', import('react').Dispatch<import('react').SetStateAction<'all' | 'settled' | 'pending'>>]} */
  const [settlementFilter, setSettlementFilter] = useState("all");
  /** @type {[string | null, import('react').Dispatch<import('react').SetStateAction<string | null>>]} */
  const [editingId, setEditingId] = useState(null);
  /** @type {[HireForm, import('react').Dispatch<import('react').SetStateAction<HireForm>>]} */
  const [form, setForm] = useState({ ...INITIAL_FORM });
  /** @type {import('react').MutableRefObject<HireForm>} */
  const formRef = useRef(form);
  /** @type {import('react').RefObject<HTMLDivElement>} */
  const pageTopRef = useRef(null);

  const resetFormState = useCallback(() => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
  }, []);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const stats = useMemo(() => dashboardStats(hires), [hires]);

  const filteredHires = useMemo(() => {
    if (settlementFilter === "settled") return hires.filter((h) => hirePayment(h).settled);
    if (settlementFilter === "pending") return hires.filter((h) => !hirePayment(h).settled);
    return hires;
  }, [hires, settlementFilter]);

  const formPaymentPreview = useMemo(() => {
    const fare = toNum(form.hire_rate);
    const paid = toNum(form.paid_amount);
    return hirePayment({ hire_rate: fare, paid_amount: paid, is_settled: false });
  }, [form.hire_rate, form.paid_amount]);

  const livePreview = useMemo(
    () =>
      hireFinance({
        hire_rate: toNum(form.hire_rate),
        diesel_cost: toNum(form.diesel_cost),
        driver_wage: toNum(form.driver_wage),
        helper_wage: toNum(form.helper_wage),
        other_expenses: toNum(form.other_expenses),
      }),
    [form]
  );

  /** @type {(key: keyof HireForm, val: string | boolean) => void} */
  const setField = useCallback((key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setHires(await loadHires());
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

  /** @type {(hire: Hire) => void} */
  const startEdit = useCallback((hire) => {
    setEditingId(hire.id);
    setForm(hireToForm(hire));
    setTab("new");
    setError(null);
    requestAnimationFrame(() => {
      pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  /** @type {(hire: Hire) => Promise<void>} */
  const removeHire = useCallback(
    async (hire) => {
      if (!window.confirm(T.confirmDelete)) return;
      setDeletingId(hire.id);
      setError(null);
      const wasEditing = editingId === hire.id;
      try {
        await deleteHireById(hire.id);
        if (wasEditing) resetFormState();
        await refresh();
      } catch (err) {
        console.error("Supabase Delete Error Detailed:", err);
        setError(err instanceof Error ? err.message : "Delete failed");
      } finally {
        setDeletingId(null);
      }
    },
    [refresh, editingId, resetFormState]
  );

  /** @param {import('react').FormEvent<HTMLFormElement>} e */
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const raw = { ...formRef.current };
    const fd = new FormData(e.currentTarget);
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string" && k in INITIAL_FORM) {
        raw[/** @type {keyof HireForm} */ (k)] = v;
      }
    }
    if (!String(raw.lorry_number ?? "").trim()) {
      setError("Lorry number is required");
      return;
    }
    if (!String(raw.hirer_name ?? "").trim()) {
      setError("Hirer name is required");
      return;
    }
    if (toNum(raw.hire_rate) <= 0) {
      setError("Enter agreed hire rate");
      return;
    }

    setSaving(true);
    try {
      if (editingId) await updateHire(editingId, raw);
      else await insertHire(raw);
      await refresh();
      resetFormState();
      setTab("reports");
    } catch (err) {
      console.error("Supabase Save Error Detailed:", err);
      setError(
        err instanceof Error
          ? err.message
          : editingId
            ? "Update failed"
            : "Failed to save hire"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      ref={pageTopRef}
      variants={pageEnter}
      initial="hidden"
      animate="show"
      className="w-full max-w-[100%] min-h-screen bg-[#F8F9FA] px-10 py-12 text-neutral-950 lg:px-20"
    >
      <header className="mb-12 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl" lang="si">
          {T.pageTitle}
        </h1>

        <div className="w-full shrink-0 rounded-2xl bg-neutral-200/50 p-2 shadow-inner backdrop-blur-xl xl:max-w-2xl">
          <div className="relative flex w-full">
            {[
              { id: /** @type {'reports'|'new'} */ ("reports"), label: T.tabReports },
              { id: /** @type {'reports'|'new'} */ ("new"), label: T.tabNew },
            ].map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="relative flex min-h-[52px] flex-1 items-center justify-center rounded-xl px-4 py-3"
                >
                  {on ? (
                    <motion.span
                      layoutId="lorryHireTabPill"
                      className="absolute inset-0 rounded-xl bg-white/95 shadow-lg ring-1 ring-white/80 backdrop-blur-md"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span
                    className={`relative z-10 whitespace-nowrap text-center text-[13px] font-bold leading-tight sm:text-[15px] ${
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
      </header>

      {error ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
          className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-[13px] font-bold text-red-700"
        >
          {error}
        </motion.p>
      ) : null}

      <motion.div
        variants={pageEnter}
        className="mb-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4"
      >
        <BentoMetric accent="orange" title={T.statCount} value={stats.totalCount} icon={Hash} />
        <BentoMetric
          accent="neutral"
          title={T.statRevenue}
          amount={stats.totalRevenue}
          icon={Wallet}
        />
        <BentoMetric
          accent="emerald"
          title={T.statProfit}
          amount={stats.totalProfit}
          icon={Sparkles}
        />
        <BentoPendingMetric title={T.statPending} amount={stats.pendingReceivable} />
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "reports" ? (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="w-full"
          >
            <div className="mb-6 w-full rounded-2xl bg-neutral-200/50 p-2 shadow-inner backdrop-blur-xl">
              <div className="relative flex w-full flex-wrap gap-1 sm:flex-nowrap">
                {[
                  { id: /** @type {'all'|'settled'|'pending'} */ ("all"), label: T.filterAll },
                  { id: /** @type {'all'|'settled'|'pending'} */ ("settled"), label: T.filterSettled },
                  { id: /** @type {'all'|'settled'|'pending'} */ ("pending"), label: T.filterPending },
                ].map((f) => {
                  const on = settlementFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSettlementFilter(f.id)}
                      className="relative flex min-h-[48px] flex-1 items-center justify-center rounded-xl px-3 py-2.5"
                    >
                      {on ? (
                        <motion.span
                          layoutId="lorryHireSettleFilterPill"
                          className="absolute inset-0 rounded-xl bg-white/95 shadow-lg ring-1 ring-white/80 backdrop-blur-md"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      ) : null}
                      <span
                        className={`relative z-10 whitespace-nowrap text-center text-[12px] font-bold leading-tight sm:text-[13px] ${
                          on ? "text-neutral-950" : "text-neutral-500"
                        }`}
                        lang="si"
                      >
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="min-h-[280px] animate-pulse rounded-[28px] bg-white/80"
                  />
                ))}
              </div>
            ) : filteredHires.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex w-full flex-col items-center justify-center rounded-[28px] border border-neutral-100 bg-white py-32 shadow-[0_12px_40px_rgba(0,0,0,0.02)]"
              >
                <Package className="h-14 w-14 text-neutral-300" />
                <p className="mt-5 text-xl font-black text-neutral-600" lang="si">
                  {T.empty}
                </p>
              </motion.div>
            ) : (
              <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
                {filteredHires.map((hire, i) => (
                  <HireCard
                    key={hire.id}
                    hire={hire}
                    index={i}
                    busy={deletingId === hire.id}
                    onEdit={() => startEdit(hire)}
                    onDelete={() => removeHire(hire)}
                    onAfterQuickPay={refresh}
                    onQuickPayError={setError}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : null}

        {tab === "new" ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.32 }}
            onSubmit={onSubmit}
            noValidate
            whileHover={{ boxShadow: "0 20px 50px rgba(0,0,0,0.04)" }}
            className={`w-full rounded-[28px] border border-neutral-100 bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.02)] transition-all duration-300 lg:p-12 ${
              editingId ? "ring-2 ring-[#10B981]/40" : ""
            }`}
          >
            <FormMainHeading />
            <div className="grid w-full gap-12 xl:grid-cols-3">
              <section className="min-w-0 space-y-6">
                <SectionTag title={T.sectionBasic} />
                <div className="grid gap-5">
                  <Field label={T.lorry}>
                    <div className="relative min-w-0">
                      <Truck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <input
                        name="lorry_number"
                        className={`${INPUT} pl-12 font-mono`}
                        value={form.lorry_number}
                        onChange={(ev) => setField("lorry_number", ev.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label={T.hirer}>
                    <div className="relative min-w-0">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <input
                        name="hirer_name"
                        className={`${INPUT} pl-12`}
                        value={form.hirer_name}
                        onChange={(ev) => setField("hirer_name", ev.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label={T.driver}>
                    <input
                      name="driver_name"
                      className={INPUT}
                      value={form.driver_name}
                      onChange={(ev) => setField("driver_name", ev.target.value)}
                    />
                  </Field>
                  <DateField
                    id="depart_date"
                    label={T.formStartDate}
                    name="depart_date"
                    value={form.depart_date}
                    onChange={(v) => setField("depart_date", v)}
                  />
                  <DateField
                    id="return_date"
                    label={T.formEndDate}
                    name="return_date"
                    value={form.return_date}
                    onChange={(v) => setField("return_date", v)}
                  />
                </div>
              </section>

              <section className="min-w-0 space-y-6">
                <SectionTag title={T.sectionTrip} />
                <div className="grid gap-5">
                  <Field label={T.startKm}>
                    <div className="relative min-w-0">
                      <Gauge className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <input
                        name="start_km"
                        type="number"
                        min="0"
                        className={`${INPUT} pl-12`}
                        value={form.start_km}
                        onChange={(ev) => setField("start_km", ev.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label={T.endKm}>
                    <input
                      name="end_km"
                      type="number"
                      min="0"
                      className={INPUT}
                      value={form.end_km}
                      onChange={(ev) => setField("end_km", ev.target.value)}
                    />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2 sm:col-span-2">
                    <Field label={T.totalFare}>
                      <div className="relative min-w-0">
                        <Coins className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <input
                          name="hire_rate"
                          type="number"
                          min="0"
                          className={`${INPUT} pl-12`}
                          value={form.hire_rate}
                          onChange={(ev) => setField("hire_rate", ev.target.value)}
                        />
                      </div>
                    </Field>
                    <Field label={T.paidAmount}>
                      <div className="relative min-w-0">
                        <Wallet className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <input
                          name="paid_amount"
                          type="number"
                          min="0"
                          className={`${INPUT} pl-12`}
                          value={form.paid_amount}
                          onChange={(ev) => setField("paid_amount", ev.target.value)}
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              </section>

              <section className="min-w-0 space-y-6">
                <SectionTag title={T.sectionCosts} />
                <div className="grid gap-5">
                  <Field label={T.dieselCost}>
                    <div className="relative min-w-0">
                      <Fuel className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <input
                        name="diesel_cost"
                        type="number"
                        min="0"
                        className={`${INPUT} pl-12`}
                        value={form.diesel_cost}
                        onChange={(ev) => setField("diesel_cost", ev.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label={T.driverWage}>
                    <input
                      name="driver_wage"
                      type="number"
                      min="0"
                      className={INPUT}
                      value={form.driver_wage}
                      onChange={(ev) => setField("driver_wage", ev.target.value)}
                    />
                  </Field>
                  <Field label={T.helperWage}>
                    <input
                      name="helper_wage"
                      type="number"
                      min="0"
                      className={INPUT}
                      value={form.helper_wage}
                      onChange={(ev) => setField("helper_wage", ev.target.value)}
                    />
                  </Field>
                  <Field label={T.extraCost}>
                    <input
                      name="other_expenses"
                      type="number"
                      min="0"
                      className={INPUT}
                      value={form.other_expenses}
                      onChange={(ev) => setField("other_expenses", ev.target.value)}
                    />
                  </Field>
                </div>

                <div
                  className={`rounded-2xl px-5 py-4 ring-1 ${
                    formPaymentPreview.settled
                      ? "bg-[#ECFDF5] text-[#10B981] ring-[#A5D6A7]/60"
                      : "bg-[#FFF7ED] text-[#E65100] ring-[#FFE0B2]/80"
                  }`}
                >
                  <p className="text-[13px] font-black" lang="si">
                    {formPaymentPreview.settled ? T.filterSettled : T.filterPending}
                  </p>
                  <p className="mt-2 break-words text-[12px] font-bold leading-snug" lang="si">
                    {paymentBadgeText({
                      hire_rate: formPaymentPreview.fare,
                      paid_amount: formPaymentPreview.paid,
                      is_settled: formPaymentPreview.settled,
                    })}
                  </p>
                </div>

                <motion.div
                  layout
                  className={`rounded-[20px] p-5 font-bold ${
                    livePreview.netProfit >= 0
                      ? "border border-[#A5D6A7] bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] text-[#1B5E20] shadow-sm"
                      : "bg-[#FFF7ED] text-[#F97316]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-lg" lang="si">
                      {livePreview.netProfit >= 0 ? T.netProfit : T.netLoss}
                    </span>
                    <span className="shrink-0 text-2xl font-black tabular-nums">
                      {money(livePreview.netProfit)}
                    </span>
                  </div>
                </motion.div>
              </section>
            </div>

            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-10 inline-flex w-full min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-[#10B981] px-10 py-4 text-[15px] font-black text-white shadow-lg shadow-[#10B981]/25 transition-all duration-300 hover:bg-[#059669] disabled:opacity-50 sm:w-auto"
              lang="si"
            >
              <ArrowUpRight className="h-5 w-5 shrink-0" />
              {editingId ? T.update : T.save}
            </motion.button>
          </motion.form>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
