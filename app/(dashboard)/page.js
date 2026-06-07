"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Bell,
  CheckCircle2,
  Truck,
  Shield,
  FileBadge,
  Wrench,
  Gauge,
  Scale,
  HandCoins,
  Landmark,
  Route,
  Users,
  CreditCard,
  FileText,
  Car,
  Receipt,
  Building2,
  Boxes,
  Fuel,
  Sparkles,
  TrendingUp,
  Package,
  Wallet,
  X,
} from "lucide-react";
import { BuyingSellingStockModal } from "@/components/dashboard/BuyingSellingStockModal";
import {
  ADD_NEW_VARIETY,
  buildBssPayload,
  getBssAdditionalExpenses,
  getBssBuyingWeight,
  getBssNetProfit,
  getBssPaymentStatus,
  getBssSellingWeight,
  getBssTotalSellingAmount,
  getBssVehicleNo,
  normalizeBssRow,
  resolveBssVariety,
  sumBssActiveBuyingWeight,
  sumBssOutstandingReceivables,
} from "@/lib/buying-selling-stock";
import { DashboardAuthBar } from "@/components/dashboard/DashboardAuthBar";

const DB_INWARD = "බඩු ගේන්න";
const DB_OUTWARD = "බඩු බාන්න";

const STATUS_COMPLETED = "completed";
const STATUS_RECEIVABLE = "pending_receivable";
const STATUS_PAYABLE = "pending_payable";
const SETTLE_EPSILON = 0.5;
const COMPLIANCE_DAYS = 14;
const SERVICE_KM_MARGIN = 500;

const LOAN_RECEIVABLE = "receivable";
const LOAN_PAYABLE = "payable";
const BANK_ACTIVE = "active";

const EASE_FLOW = [0.22, 1, 0.36, 1];

const GLASS_PANEL =
  "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl";

const MODULE_THEMES = {
  "/trading": { primary: "#34d399", dark: "#059669", border: "border-emerald-400/30" },
  "/lorry-hire": { primary: "#38bdf8", dark: "#0284c7", border: "border-sky-400/30" },
  "/hand-loans": { primary: "#fbbf24", dark: "#d97706", border: "border-amber-400/30" },
  "/staff": { primary: "#818cf8", dark: "#4f46e5", border: "border-indigo-400/30" },
  "/bank-loans": { primary: "#fcd34d", dark: "#ca8a04", border: "border-yellow-400/30" },
  "/cheques": { primary: "#e879f9", dark: "#c026d3", border: "border-fuchsia-400/30" },
  "/vehicles": { primary: "#fb923c", dark: "#ea580c", border: "border-orange-400/30" },
  "/expenses": { primary: "#fb7185", dark: "#e11d48", border: "border-rose-400/30" },
  "/deposits": { primary: "#22d3ee", dark: "#0891b2", border: "border-cyan-400/30" },
  "/inventory": { primary: "#f97316", dark: "#c2410c", border: "border-orange-500/30" },
  "/diesel": { primary: "#60a5fa", dark: "#2563eb", border: "border-blue-400/30" },
};

const KPI_GLOW = {
  sky: ["#0ea5e9", "#38bdf8", "#22d3ee", "#0ea5e9"],
  neutral: ["#64748b", "#94a3b8", "#cbd5e1", "#64748b"],
  amber: ["#f59e0b", "#fbbf24", "#fb923c", "#f59e0b"],
  emerald: ["#10b981", "#34d399", "#6ee7b7", "#10b981"],
  rose: ["#fb7185", "#f43f5e", "#fda4af", "#fb7185"],
  cyan: ["#06b6d4", "#22d3ee", "#67e8f9", "#06b6d4"],
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_FLOW } },
};

const statsSectionStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.12 },
  },
};

const statsItemReveal = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.48, ease: EASE_FLOW },
  },
};

const kpiGridStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.28 },
  },
};

const kpiItemReveal = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: EASE_FLOW },
  },
};

const moduleGridStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.2 },
  },
};

const moduleItemReveal = {
  hidden: { opacity: 0, y: 36, scale: 0.82 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 22, mass: 0.85 },
  },
};

function ScrollReveal({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.12, margin: "-40px 0px -20px 0px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE_FLOW },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const MODULES = [
  {
    href: "/trading",
    title: "Trip Management",
    sub: "Trips & Loads",
    icon: Route,
    gradient: "from-violet-500/15 via-violet-50/80 to-white",
    border: "border-violet-200/60",
    iconBg: "bg-violet-500 text-white shadow-lg shadow-violet-500/25",
  },
  {
    href: "/lorry-hire",
    title: "Lorry Hire Log",
    sub: "Lorry Hire",
    icon: Truck,
    gradient: "from-sky-500/15 via-sky-50/80 to-white",
    border: "border-sky-200/60",
    iconBg: "bg-sky-500 text-white shadow-lg shadow-sky-500/25",
  },
  {
    href: "/hand-loans",
    title: "Hand Loans",
    sub: "Hand Loans",
    icon: HandCoins,
    gradient: "from-emerald-500/15 via-emerald-50/80 to-white",
    border: "border-emerald-200/60",
    iconBg: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25",
  },
  {
    href: "/staff",
    title: "Staff & Payroll",
    sub: "Staff & Payroll",
    icon: Users,
    gradient: "from-indigo-500/15 via-indigo-50/80 to-white",
    border: "border-indigo-200/60",
    iconBg: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25",
  },
  {
    href: "/bank-loans",
    title: "Bank Loans",
    sub: "Bank Loans",
    icon: Landmark,
    gradient: "from-blue-600/15 via-blue-50/80 to-white",
    border: "border-blue-200/60",
    iconBg: "bg-blue-600 text-white shadow-lg shadow-blue-600/25",
  },
  {
    href: "/cheques",
    title: "Cheque Registry",
    sub: "Cheques",
    icon: CreditCard,
    gradient: "from-fuchsia-500/15 via-fuchsia-50/80 to-white",
    border: "border-fuchsia-200/60",
    iconBg: "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25",
  },
  {
    href: "/vehicles",
    title: "Vehicle Fleet Care",
    sub: "Fleet",
    icon: Car,
    gradient: "from-amber-500/15 via-amber-50/80 to-white",
    border: "border-amber-200/60",
    iconBg: "bg-amber-500 text-white shadow-lg shadow-amber-500/25",
  },
  {
    href: "/expenses",
    title: "Expenses & Utilities",
    sub: "Expense Hub",
    icon: Receipt,
    gradient: "from-teal-500/15 via-teal-50/80 to-white",
    border: "border-teal-200/60",
    iconBg: "bg-teal-600 text-white shadow-lg shadow-teal-600/25",
  },
  {
    href: "/deposits",
    title: "Bank Deposits",
    sub: "Deposits",
    icon: Building2,
    gradient: "from-cyan-500/15 via-cyan-50/80 to-white",
    border: "border-cyan-200/60",
    iconBg: "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25",
  },
  {
    href: "/inventory",
    title: "Spare Parts Inventory",
    sub: "Spare Parts",
    icon: Boxes,
    gradient: "from-orange-500/15 via-orange-50/80 to-white",
    border: "border-orange-200/60",
    iconBg: "bg-orange-500 text-white shadow-lg shadow-orange-500/25",
  },
  {
    href: "/diesel",
    title: "Fuel Tank Control",
    sub: "Fuel Control",
    icon: Fuel,
    gradient: "from-slate-600/15 via-slate-50/80 to-white",
    border: "border-slate-200/60",
    iconBg: "bg-slate-700 text-white shadow-lg shadow-slate-700/25",
  },
];

function supabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

const supabase = createClient(
  supabaseUrl(),
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

async function selectFirstAvailableTable(tableCandidates, columns) {
  for (const table of tableCandidates) {
    const { data, error } = await supabase.from(table).select(columns);
    if (!error) return { table, rows: data ?? [] };
  }
  return { table: null, rows: [] };
}

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

function moneyPlain(n) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(
    Math.abs(Math.round(Number(n) || 0))
  );
}

function moneyFullLkr(n) {
  return `Rs. ${moneyPlain(n)}`;
}

function moneyFullLkrPrecise(n) {
  return `Rs. ${new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)}`;
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

function formatSinhalaLakhCrore(amount) {
  const n = Math.abs(Number(amount) || 0);
  const sign = amount < 0 ? "-" : "";
  const sub = moneyFullLkr(amount);

  if (n < 100_000) return { main: `${sign}${moneyPlain(n)}`, sub };
  if (n < 10_000_000) {
    const lakhs = n / 100_000;
    return { main: `${sign}Lakh ${String(Math.round(lakhs * 10) / 10)}`, sub };
  }
  const crores = Math.floor(n / 10_000_000);
  const remainder = n % 10_000_000;
  const lakhPart = Math.round(remainder / 100_000);
  let main = `${sign}Crore ${crores}`;
  if (lakhPart > 0) main += ` Lakh ${lakhPart}`;
  return { main, sub };
}

function isInwardBuyingTrip(tripType) {
  const t = String(tripType ?? "").trim();
  return (
    t === DB_INWARD ||
    t.includes("ගේන්න") ||
    t.toLowerCase() === "inward" ||
    t === "Inward"
  );
}

function isOutwardTripType(type) {
  const s = String(type ?? "").trim();
  return (
    s === DB_OUTWARD ||
    s === "Outward" ||
    s.toLowerCase() === "outward" ||
    s.includes("බාන්න")
  );
}

function isMaizeProductType(productType) {
  const t = String(productType ?? "").trim().toLowerCase();
  return t.includes("maize") || t.includes("corn") || t.includes("බඩඉරිඟු");
}

function isPaddyProductType(productType) {
  return !isMaizeProductType(productType);
}

function tripRowNetProfit(row) {
  const goods = toNum(row.total_kg) * toNum(row.price_per_kg);
  const logistics =
    toNum(row.diesel_cost ?? row.fuel_cost) +
    toNum(row.driver_wage) +
    toNum(row.helper_wage) +
    toNum(row.road_expenses);
  if (isOutwardTripType(row.trip_type)) return goods - logistics;
  return 0;
}

/** Outward paddy/corn sale margin before company-wide expenses */
function tripSalesGrossMargin(row) {
  if (!isOutwardTripType(row.trip_type)) return 0;
  return tripRowNetProfit(row);
}

function tripSalesBuyerLabel(row) {
  const product = String(row.paddy_type ?? "Paddy").trim() || "Paddy";
  const buyer = String(row.buyer_name ?? "").trim();
  if (buyer) return `${product} / ${buyer}`;
  return `${product} / ${tripDisplayLabel(row)}`;
}

function tripDieselExpenseAmount(row) {
  return toNum(row.diesel_cost ?? row.fuel_cost);
}

function tripDieselExpenseLiters(row) {
  return toNum(row.diesel_liters);
}

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntilDate(dateStr) {
  if (!dateStr) return null;
  const today = startOfDay();
  const target = startOfDay(new Date(`${dateStr}T12:00:00`));
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatPlateDisplay(vehicle) {
  const province = String(vehicle.province_code ?? "").toUpperCase();
  const series = String(vehicle.series_code ?? "").toUpperCase();
  const number = String(vehicle.sequence_number ?? "").replace(/\D/g, "");
  if (!province && !series && !number) return "—";
  return `${province} ⏐ ${series} - ${number}`;
}

function tripDisplayLabel(row) {
  const supplier = String(row.supplier_name ?? "").trim();
  const lorry = String(row.lorry_number ?? "").trim();
  const driver = String(row.driver_name ?? "").trim();
  if (supplier) return supplier;
  if (lorry) return lorry;
  if (driver) return driver;
  return row.trip_reference || "Trip";
}

function computeSettlement(row) {
  const actual_weight = toNum(row.actual_weight ?? row.total_kg);
  const buying_price_per_kg = toNum(row.buying_price_per_kg ?? row.price_per_kg);
  const expected_total_cost =
    Math.round(actual_weight * buying_price_per_kg * 100) / 100;
  const advance_paid = toNum(row.advance_paid);
  const diff = Math.round((advance_paid - expected_total_cost) * 100) / 100;

  let settlement_status = STATUS_COMPLETED;
  if (Math.abs(diff) > SETTLE_EPSILON) {
    settlement_status =
      advance_paid > expected_total_cost ? STATUS_RECEIVABLE : STATUS_PAYABLE;
  }

  return {
    id: String(row.id),
    display_label: tripDisplayLabel(row),
    created_at: String(row.created_at ?? ""),
    settlement_status,
    deviation_amount: Math.abs(diff),
    expected_total_cost,
    advance_paid,
    lorry_number: String(row.lorry_number ?? ""),
  };
}

function computeLoanFinance(loan, repayments) {
  const totalPaid = repayments.reduce((s, r) => s + toNum(r.paid_amount), 0);
  const remainingPrincipal = Math.max(0, toNum(loan.loan_amount) - totalPaid);
  const monthlyRate =
    loan.interest_type === "yearly"
      ? toNum(loan.interest_rate) / 12 / 100
      : toNum(loan.interest_rate) / 100;

  if (!loan.started_date || monthlyRate <= 0) {
    return { totalOutstanding: remainingPrincipal };
  }

  const start = new Date(`${loan.started_date}T12:00:00`);
  const end = new Date();
  if (end < start) return { totalOutstanding: remainingPrincipal };

  const reps = [...repayments]
    .map((r) => ({
      paid_amount: toNum(r.paid_amount),
      d: new Date(`${r.payment_date || String(r.created_at).slice(0, 10)}T12:00:00`),
    }))
    .sort((a, b) => a.d.getTime() - b.d.getTime());

  let balance = toNum(loan.loan_amount);
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

  return { totalOutstanding: Math.max(0, remainingPrincipal + accruedInterest) };
}

function buildVehicleComplianceAlerts(vehicles) {
  const alerts = [];

  for (const v of vehicles) {
    const plate = formatPlateDisplay(v);

    for (const key of ["license_expire_date", "insurance_expire_date"]) {
      const days = daysUntilDate(v[key]);
      if (days == null || days > COMPLIANCE_DAYS) continue;
      const label =
        key === "license_expire_date" ? "License Expiry" : "Insurance Expiry";
      alerts.push({
        id: `${v.id}-${key}`,
        plate,
        message:
          days <= 0
            ? `Truck ${plate}: ${label} expired. Immediate action required.`
            : `Truck ${plate}: ${label} in ${days} day(s).`,
        severity: days <= 0 ? "critical" : "warn",
        icon: key === "license_expire_date" ? FileBadge : Shield,
      });
    }

    const serviceDays = daysUntilDate(v.service_due_date);
    if (serviceDays != null && serviceDays <= COMPLIANCE_DAYS) {
      alerts.push({
        id: `${v.id}-service-date`,
        plate,
        message:
          serviceDays <= 0
            ? `Truck ${plate}: Maintenance due date has passed.`
            : `Truck ${plate}: Maintenance due in ${serviceDays} day(s).`,
        severity: serviceDays <= 0 ? "critical" : "warn",
        icon: Wrench,
      });
    }

    const dueKm = toNum(v.service_due_km);
    const currentKm = toNum(v.current_km);
    if (dueKm > 0) {
      const kmGap = dueKm - currentKm;
      if (kmGap <= 0) {
        alerts.push({
          id: `${v.id}-service-km`,
          plate,
          message: `Truck ${plate}: Maintenance Due (KM limit reached) (${moneyPlain(currentKm)} / ${moneyPlain(dueKm)} km).`,
          severity: "critical",
          icon: Gauge,
        });
      } else if (kmGap <= SERVICE_KM_MARGIN) {
        alerts.push({
          id: `${v.id}-service-km-near`,
          plate,
          message: `Truck ${plate}: Maintenance Due soon — ${moneyPlain(kmGap)} km remaining.`,
          severity: "warn",
          icon: Gauge,
        });
      }
    }
  }

  return alerts;
}

function ControlGridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-[#070708]"
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(244,63,94,0.08),transparent_50%)]" />
    </div>
  );
}

function GlassEnergy({ colors, duration = 18 }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -inset-[45%] opacity-70 blur-3xl"
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      style={{
        background: `conic-gradient(from 0deg, ${colors.join(", ")})`,
      }}
    />
  );
}

function BrandHero() {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_FLOW }}
      className={`${GLASS_PANEL} flex flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10`}
    >
      <GlassEnergy colors={["#38bdf8", "#8b5cf6", "#f59e0b", "#38bdf8"]} duration={22} />
      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
          <div className="absolute inset-0 rounded-full bg-cyan-400/25 blur-2xl" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/15 bg-white/5 p-3 shadow-[0_0_40px_rgba(56,189,248,0.25)]">
            <Image
              src="/sriketh-logo.png"
              alt="Sri Keth"
              width={96}
              height={96}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/40">
            Sri Keth ERP
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Sri Keth
          </h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-white/50">
            Advanced Business Control Center
          </p>
        </div>
      </div>
      <div className="relative flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 shadow-[0_0_24px_rgba(52,211,153,0.2)]">
        <Sparkles className="h-5 w-5 text-emerald-400" strokeWidth={2.2} />
        <span className="text-xs font-bold text-emerald-200" lang="si">
          Live Operations Dashboard
        </span>
      </div>
    </motion.header>
  );
}

function KpiCard({ title, value, sub, tone = "neutral", icon: Icon, hero = false, onClick }) {
  const palette = KPI_GLOW[tone] ?? KPI_GLOW.neutral;
  const valueGlow =
    tone === "emerald"
      ? "text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.55)]"
      : tone === "sky"
        ? "text-sky-300 drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]"
        : tone === "amber"
          ? "text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
          : tone === "rose"
            ? "text-rose-300 drop-shadow-[0_0_20px_rgba(251,113,133,0.5)]"
            : tone === "cyan"
              ? "text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.55)]"
              : "text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.25)]";

  return (
    <motion.div
      variants={kpiItemReveal}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: EASE_FLOW } }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`${GLASS_PANEL} ${hero ? "min-h-[200px] p-7 sm:min-h-[220px] sm:p-8" : "p-5 sm:p-6"}`}
    >
      <GlassEnergy colors={palette} duration={hero ? 14 : 20} />
      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          {Icon ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/90">
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
          ) : null}
          <p
            className="text-[10px] font-bold uppercase tracking-wide text-white/50"
            lang="si"
          >
            {title}
          </p>
        </div>
        <p
          className={`font-black tracking-tight ${valueGlow} ${
            hero
              ? "font-mono text-4xl sm:text-5xl lg:text-6xl"
              : "font-mono text-3xl sm:text-4xl"
          }`}
          lang="si"
        >
          {value}
        </p>
        {sub ? (
          <p className="mt-2 text-xs font-semibold text-white/40">{sub}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

function GrossProfitHero({ value, sub, onClick }) {
  return (
    <motion.div
      variants={statsItemReveal}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`${GLASS_PANEL} min-h-[240px] p-7 sm:min-h-[260px] sm:p-9`}
    >
      <GlassEnergy
        colors={["#10b981", "#34d399", "#6ee7b7", "#10b981"]}
        duration={12}
      />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
            <TrendingUp className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">
            Gross Profit
          </p>
        </div>
        <div className="mt-6">
          <p
            className="font-mono text-5xl font-black leading-none tracking-tighter text-white drop-shadow-[0_0_48px_rgba(52,211,153,0.65)] sm:text-6xl md:text-7xl lg:text-8xl"
            lang="si"
          >
            {value}
          </p>
          {sub ? (
            <p className="mt-3 font-mono text-sm font-semibold text-white/45 sm:text-base">
              {sub}
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

const ALERT_HUB_PANEL =
  "rounded-3xl border border-white/12 bg-zinc-950/92 backdrop-blur-xl";

const ALERT_CARD_BASE =
  "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl";

const ALERT_PRIORITY = {
  high: {
    edge: "border-l-[4px] border-l-rose-500",
    iconBg: "bg-rose-500/15 text-rose-400",
    dot: "bg-rose-500",
    ping: "bg-rose-500",
  },
  medium: {
    edge: "border-l-[4px] border-l-amber-500",
    iconBg: "bg-amber-500/15 text-amber-400",
    dot: "bg-amber-500",
    ping: null,
  },
};

function PriorityIndicator({ priority }) {
  const style = ALERT_PRIORITY[priority] ?? ALERT_PRIORITY.medium;
  return (
    <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0" aria-hidden>
      {style.ping ? (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${style.ping} opacity-50`}
        />
      ) : null}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${style.dot}`} />
    </span>
  );
}

function AlertNode({ node, settlingId, onSettle, index }) {
  const priority = node.priority ?? "medium";
  const style = ALERT_PRIORITY[priority] ?? ALERT_PRIORITY.medium;
  const Icon = node.icon;
  const settling = node.trip && settlingId === node.trip.id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + index * 0.04, duration: 0.35, ease: EASE_FLOW }}
      className={`${ALERT_CARD_BASE} ${style.edge}`}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex items-start gap-3 sm:items-center">
          <PriorityIndicator priority={priority} />
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
          >
            <Icon className="h-5 w-5" strokeWidth={2.4} />
          </span>
        </div>
        <div className="min-w-0 flex-1 sm:pl-0">
          {node.title ? (
            <p
              className="text-[11px] font-black uppercase tracking-wide text-white/75"
              lang="si"
            >
              {node.title}
            </p>
          ) : null}
          {node.subMessage ? (
            <>
              <p className="text-base font-black leading-snug text-white">
                {node.message}
              </p>
              <p className="mt-1.5 font-mono text-sm font-black tracking-tight text-white">
                {node.subMessage}
              </p>
            </>
          ) : (
            <p
              className={`font-black leading-snug text-white ${node.title ? "mt-1 text-base" : "text-base"}`}
              lang="si"
            >
              {node.message}
            </p>
          )}
        </div>
        {node.trip ? (
          <button
            type="button"
            onClick={() => onSettle(node.trip)}
            disabled={settling}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/20 disabled:opacity-60"
          >
            {settling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>Mark as Settled</span>
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}

function NodeAlertHub({
  vehicleAlerts,
  settlingId,
  onSettle,
  badgeCount = 0,
}) {
  const nodes = useMemo(() => {
    const list = [];

    vehicleAlerts.forEach((a) => {
      list.push({
        id: a.id,
        priority: a.severity === "critical" ? "high" : "medium",
        trip: null,
        message: a.message,
        icon: a.icon,
      });
    });

    return list;
  }, [vehicleAlerts]);

  const hasAlerts = nodes.length > 0;

  return (
    <section className={`${ALERT_HUB_PANEL} p-6 sm:p-8`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-zinc-900/80 text-amber-400">
            <Bell className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-lg font-black text-white" lang="si">
              Smart Alert Center
            </h2>
          </div>
        </div>
        {badgeCount > 0 ? (
          <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs font-black text-rose-100">
            {badgeCount}
          </span>
        ) : null}
      </div>

      {!hasAlerts ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-zinc-900/50 py-16 text-center">
          <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-400" />
          <p className="text-sm font-bold text-white/80">
            All clear — no active alerts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4">
          {nodes.map((node, index) => (
            <AlertNode
              key={node.id}
              node={node}
              index={index}
              settlingId={settlingId}
              onSettle={onSettle}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function buildBssSettlementNotifications(records) {
  const active = (records ?? []).filter((r) => r.is_active !== false);
  const notifications = [];

  for (const row of active) {
    const normalized = normalizeBssRow(row);
    const vehicleNo = getBssVehicleNo(normalized);

    if (getBssPaymentStatus(normalized) === "Pending") {
      notifications.push({
        id: row.id,
        type: "receivable",
        difference: getBssTotalSellingAmount(normalized),
        buyerName: String(normalized.buyer_name ?? "").trim() || "Unknown Buyer",
        lorryNumber: vehicleNo,
      });
    }

    const supplierBalance = normalized.supplier_balance;
    const supplierName = String(normalized.supplier_name ?? "").trim() || "Supplier";
    if (supplierBalance < -SETTLE_EPSILON) {
      notifications.push({
        id: `${row.id}-supplier-overpaid`,
        type: "payable",
        difference: Math.abs(supplierBalance),
        buyerName: supplierName,
        lorryNumber: vehicleNo,
        supplierRecovery: true,
      });
    } else if (supplierBalance > SETTLE_EPSILON) {
      notifications.push({
        id: `${row.id}-supplier-balance`,
        type: "payable",
        difference: supplierBalance,
        buyerName: supplierName,
        lorryNumber: vehicleNo,
      });
    }
  }

  return notifications.sort((a, b) => {
    if (a.type !== b.type) return a.type === "payable" ? -1 : 1;
    return b.difference - a.difference;
  });
}

function SettlementNotificationRow({ notification, index, onViewSettle }) {
  const isReceivable = notification.type === "receivable";
  const message = isReceivable
    ? `Rs. ${moneyPlain(notification.difference)} outstanding from buyer ${notification.buyerName} (Vehicle: ${notification.lorryNumber}) — payment pending`
    : notification.supplierRecovery
      ? `Rs. ${moneyPlain(notification.difference)} recover from supplier ${notification.buyerName} (Vehicle: ${notification.lorryNumber}) — supplier overpaid`
      : `Rs. ${moneyPlain(notification.difference)} outstanding payable to supplier ${notification.buyerName} (Vehicle: ${notification.lorryNumber})`;

  const settleId = String(notification.id).split("-")[0];

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.32, ease: EASE_FLOW }}
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5 ${
        isReceivable
          ? "border-emerald-400/25 bg-emerald-500/[0.07]"
          : "border-rose-400/25 bg-rose-500/[0.07]"
      }`}
    >
      <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white/90">
        {message}
      </p>
      <button
        type="button"
        onClick={() => onViewSettle(settleId)}
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:border-emerald-400/40 hover:bg-emerald-500/15 hover:text-emerald-100"
      >
        View / Settle
      </button>
    </motion.li>
  );
}

function SettlementNotificationCenter({ notifications, onViewSettle }) {
  const hasItems = notifications.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE_FLOW }}
      className={`${GLASS_PANEL} p-5 sm:p-6`}
    >
      <GlassEnergy
        colors={["#10b981", "#f43f5e", "#34d399", "#fb7185"]}
        duration={30}
      />
      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-black tracking-tight text-white sm:text-lg">
            🔔 Live Settlement Notifications
          </h2>
          {hasItems ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/55">
              {notifications.length} open
            </span>
          ) : null}
        </div>

        {!hasItems ? (
          <p className="text-sm font-semibold text-emerald-300/90">
            All buying &amp; selling payments and supplier balances are up to date.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {notifications.map((notification, index) => (
              <SettlementNotificationRow
                key={notification.id}
                notification={notification}
                index={index}
                onViewSettle={onViewSettle}
              />
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  );
}

const HISTORY_MODAL_META = {
  grossProfit: {
    title: "Gross Profit - Detailed History Log",
    columns: ["Date", "Product / Buyer", "Quantity", "Revenue (Rs.)"],
  },
  netProfit: {
    title: "Net Profit - Detailed History Log",
    columns: ["Date", "Metric", "Amount (Rs.)"],
  },
  totalExpenses: {
    title: "Total Expenses - Detailed History Log",
    columns: ["Date", "Expense Category & Detail", "Source Module", "Amount (Rs.)"],
  },
  totalPaddyStock: {
    title: "Total Paddy Stock - Detailed History Log",
    columns: ["Date", "Vehicle / Lorry", "Action (Load/Unload)", "Net Quantity (KG)"],
  },
  totalMaizeStock: {
    title: "Total Maize Stock - Detailed History Log",
    columns: ["Date", "Vehicle / Lorry", "Action (Load/Unload)", "Quantity (KG)"],
  },
  receivables: {
    title: "Pending Receivables - Detailed History Log",
    columns: ["Date", "Counterparty / Truck", "Outstanding (Rs.)"],
  },
  payables: {
    title: "Pending Payables - Detailed History Log",
    columns: ["Date", "Counterparty / Truck", "Outstanding (Rs.)"],
  },
  activeCapital: {
    title: "Active Capital - Detailed History Log",
    columns: ["Date", "Description", "Amount (Rs.)"],
  },
};

function HistoryModal({ activeKey, logs, onClose }) {
  const meta = activeKey ? HISTORY_MODAL_META[activeKey] : null;
  const rows = activeKey ? logs[activeKey] ?? [] : [];

  return (
    <AnimatePresence>
      {activeKey && meta ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.24, ease: EASE_FLOW }}
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
              <div>
                <h3 className="text-lg font-black text-white sm:text-xl">{meta.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/45">
                  Live chronological contributors
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

            <div className="max-h-[62vh] overflow-auto px-6 py-5 sm:px-8">
              {rows.length === 0 ? (
                <p className="py-10 text-center text-sm font-semibold text-white/55">
                  No history available.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead className="bg-white/10">
                      <tr>
                        {meta.columns.map((c) => (
                          <th
                            key={c}
                            className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-white/75"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-t border-white/10">
                          {row.cells.map((cell, idx) => (
                            <td
                              key={`${row.id}-${idx}`}
                              className={`px-4 py-3 text-sm ${
                                idx === row.cells.length - 1
                                  ? activeKey === "totalExpenses"
                                    ? "font-mono font-bold text-rose-200"
                                    : activeKey === "totalPaddyStock"
                                      ? String(cell).trim().startsWith("-")
                                        ? "font-mono font-bold text-rose-200"
                                        : "font-mono font-bold text-emerald-200"
                                    : activeKey === "totalMaizeStock"
                                      ? String(cell).trim().startsWith("-")
                                        ? "font-mono font-bold text-rose-200"
                                        : "font-mono font-bold text-emerald-200"
                                    : activeKey === "grossProfit"
                                      ? "font-mono font-bold text-emerald-200"
                                      : "font-mono font-bold text-white"
                                  : "font-semibold text-white/90"
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function getModuleTheme(href) {
  return MODULE_THEMES[href] ?? MODULE_THEMES["/trading"];
}

function ProtrudingModuleIcon({ Icon, theme, hovered }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-[52%]">
      <div
        className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl sm:h-[5rem] sm:w-[5rem]"
        style={{
          transform: "translateZ(32px)",
          background: `linear-gradient(145deg, ${theme.primary} 0%, ${theme.dark} 52%, ${theme.primary}cc 100%)`,
          boxShadow: hovered
            ? `0 16px 48px ${theme.primary}99, 0 0 0 1px rgba(255,255,255,0.2) inset`
            : `0 12px 36px ${theme.primary}66, 0 0 0 1px rgba(255,255,255,0.15) inset`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-[3px] rounded-[0.85rem] bg-gradient-to-br from-white/35 via-transparent to-black/20"
        />
        <div
          aria-hidden
          className="absolute -inset-1 rounded-2xl opacity-70 blur-md"
          style={{ background: theme.primary }}
        />
        <Icon
          className="relative h-9 w-9 text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.55)] sm:h-10 sm:w-10"
          strokeWidth={2.1}
        />
      </div>
    </div>
  );
}

function ModuleCard({ mod }) {
  const Icon = mod.icon;
  const theme = getModuleTheme(mod.href);
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [10, -10]), {
    stiffness: 260,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 260,
    damping: 24,
  });
  const glowOpacity = useSpring(hovered ? 1 : 0.55, { stiffness: 300, damping: 28 });

  const handlePointerMove = (event) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      variants={moduleItemReveal}
      className="relative pt-12 sm:pt-14"
      style={{ perspective: 1100 }}
    >
      <Link href={mod.href} className="group block">
        <motion.div
          ref={cardRef}
          onMouseMove={handlePointerMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handlePointerLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className={`relative min-h-[148px] overflow-visible rounded-3xl border bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 sm:min-h-[160px] ${theme.border} ${
            hovered ? "border-white/25" : "border-white/10"
          }`}
        >
          <ProtrudingModuleIcon Icon={Icon} theme={theme} hovered={hovered} />

          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-3xl"
            style={{
              background: `radial-gradient(ellipse 90% 120% at 50% 0%, ${theme.primary}55, transparent 72%)`,
              opacity: glowOpacity,
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 h-24 w-28 rounded-br-3xl opacity-50 transition-opacity duration-300 group-hover:opacity-80"
            style={{
              background: `radial-gradient(circle at 100% 100%, ${theme.primary}44, transparent 68%)`,
            }}
          />

          <div
            className="relative z-10 flex min-h-[148px] flex-col items-center justify-end px-4 pb-5 pt-14 text-center sm:min-h-[160px] sm:pb-6 sm:pt-16"
            style={{ transform: "translateZ(8px)" }}
          >
            <p
              className="text-sm font-black leading-snug text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:text-[15px]"
              lang="si"
            >
              {mod.title}
            </p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              {mod.sub}
            </p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

const DAY_CASH_THEME = {
  primary: "#22d3ee",
  dark: "#0891b2",
  border: "border-cyan-400/30",
};

function DayCashModuleCard() {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [10, -10]), {
    stiffness: 260,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 260,
    damping: 24,
  });
  const glowOpacity = useSpring(hovered ? 1 : 0.55, { stiffness: 300, damping: 28 });

  const handlePointerMove = (event) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      variants={moduleItemReveal}
      className="relative pt-12 sm:pt-14"
      style={{ perspective: 1100 }}
    >
      <Link href="/day-cash" className="group block w-full text-left">
        <motion.div
          ref={cardRef}
          onMouseMove={handlePointerMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handlePointerLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className={`relative min-h-[148px] overflow-visible rounded-3xl border bg-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 sm:min-h-[160px] ${DAY_CASH_THEME.border} ${
            hovered ? "border-white/25" : "border-white/10"
          }`}
        >
          <ProtrudingModuleIcon Icon={Wallet} theme={DAY_CASH_THEME} hovered={hovered} />

          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-3xl"
            style={{
              background: `radial-gradient(ellipse 90% 120% at 50% 0%, ${DAY_CASH_THEME.primary}55, transparent 72%)`,
              opacity: glowOpacity,
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 h-24 w-28 rounded-br-3xl opacity-50 transition-opacity duration-300 group-hover:opacity-80"
            style={{
              background: `radial-gradient(circle at 100% 100%, ${DAY_CASH_THEME.primary}44, transparent 68%)`,
            }}
          />

          <div
            className="relative z-10 flex min-h-[148px] flex-col items-center justify-end px-4 pb-5 pt-14 text-center sm:min-h-[160px] sm:pb-6 sm:pt-16"
            style={{ transform: "translateZ(8px)" }}
          >
            <p className="text-sm font-black leading-snug text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:text-[15px]">
              Day Cash
            </p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Daily Cash Flow
            </p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function DashboardHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlingId, setSettlingId] = useState("");
  const [activeHistoryModal, setActiveHistoryModal] = useState(null);
  const [kpis, setKpis] = useState({
    paddyKg: 0,
    paddyValue: 0,
    maizeKg: 0,
    grossProfit: 0,
    netProfit: 0,
    totalExpenses: 0,
    handReceivable: 0,
    handPayable: 0,
    bankOutstanding: 0,
    fuelSpend: 0,
    inventoryValue: 0,
    buyingSellingKg: 0,
    bssOutstandingReceivables: 0,
  });
  const [buyingSellingOpen, setBuyingSellingOpen] = useState(false);
  const [buyingSellingFocusId, setBuyingSellingFocusId] = useState(null);
  const [buyingSellingSubmitting, setBuyingSellingSubmitting] = useState(false);
  const [buyingSellingPaymentSettlingId, setBuyingSellingPaymentSettlingId] = useState(null);
  const [buyingSellingDeletingId, setBuyingSellingDeletingId] = useState(null);
  const [buyingSellingRecords, setBuyingSellingRecords] = useState([]);
  const [customPaddyTypes, setCustomPaddyTypes] = useState([]);
  const [historyLogs, setHistoryLogs] = useState({
    grossProfit: [],
    netProfit: [],
    totalExpenses: [],
    totalPaddyStock: [],
    totalMaizeStock: [],
    receivables: [],
    payables: [],
    activeCapital: [],
  });
  const [allExpenses, setAllExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [vehicleAlerts, setVehicleAlerts] = useState([]);

  const receivables = useMemo(
    () => settlements.filter((s) => s.settlement_status === STATUS_RECEIVABLE),
    [settlements]
  );
  const payables = useMemo(
    () => settlements.filter((s) => s.settlement_status === STATUS_PAYABLE),
    [settlements]
  );
  const grossProfitFmt = useMemo(
    () => formatSinhalaLakhCrore(kpis.grossProfit),
    [kpis.grossProfit]
  );
  const netProfitFmt = useMemo(
    () => formatSinhalaLakhCrore(kpis.netProfit),
    [kpis.netProfit]
  );
  const totalExpensesFromState = useMemo(
    () => allExpenses.reduce((sum, item) => sum + toNum(item.amount), 0),
    [allExpenses]
  );

  const refresh = useCallback(async () => {
    const [
      tripsRes,
      expensesRes,
      hiresRes,
      loansRes,
      repsRes,
      handRes,
      vehiclesRes,
      inventoryRes,
      dieselPurchasesRes,
      bankDepositsRes,
      staffRes,
      staffAdvancesRes,
      buyingSellingRes,
      customPaddyTypesRes,
    ] = await Promise.all([
      supabase.from("trips").select("*"),
      supabase
        .from("utility_expenses")
        .select("amount, billing_date, expense_type, warehouse_name, bill_number, created_at"),
      supabase.from("lorry_hires").select("*"),
      supabase.from("bank_loans").select("*"),
      supabase.from("loan_repayments").select("*"),
      supabase.from("hand_loans").select("*"),
      supabase.from("vehicles").select("*"),
      supabase.from("inventory").select("quantity, unit_cost"),
      supabase.from("diesel_purchases").select("id, liters_added, cost_per_liter, purchased_at"),
      supabase.from("bank_deposits").select("id, amount, deposited_at, reference_note, created_at"),
      supabase.from("staff").select("id, name"),
      supabase.from("staff_advances").select("id, staff_id, amount, description, created_at"),
      supabase.from("buying_selling_stock").select("*").order("created_at", { ascending: false }),
      supabase.from("custom_paddy_types").select("id, name").order("name"),
    ]);

    const [expensesTableRes, payrollTableRes, maintenanceTableRes, dieselTableRes] =
      await Promise.all([
        selectFirstAvailableTable(
          ["expenses", "utility_expenses"],
          "id, amount, billing_date, expense_type, warehouse_name, description, created_at"
        ),
        selectFirstAvailableTable(
          ["payroll", "staff_transactions"],
          "id, amount, staff_name, transaction_type, description, created_at, paid_date"
        ),
        selectFirstAvailableTable(
          ["vehicle_maintenance"],
          "id, amount, lorry_number, description, maintenance_date, created_at"
        ),
        selectFirstAvailableTable(
          ["diesel_purchases", "fuel_log"],
          "id, liters_added, liters, cost_per_liter, amount, purchased_at, log_date, created_at"
        ),
      ]);

    if (tripsRes.error) throw tripsRes.error;

    const trips = tripsRes.data ?? [];
    let fuelSpend = 0;
    let paddyKgIn = 0;
    let paddyKgOut = 0;
    let maizeKgIn = 0;
    let maizeKgOut = 0;
    let paddyValue = 0;
    const settlementRows = [];
    const grossProfitSaleRows = [];

    for (const row of trips) {
      fuelSpend += toNum(row.diesel_cost ?? row.fuel_cost);
      const saleMargin = tripSalesGrossMargin(row);
      if (saleMargin > 0) {
        grossProfitSaleRows.push({
          id: `sale-${row.id}`,
          date: row.created_at,
          productBuyer: tripSalesBuyerLabel(row),
          quantity: toNum(row.total_kg),
          revenue: saleMargin,
        });
      }

      const kg = toNum(row.actual_weight ?? row.total_kg);
      const isMaize = isMaizeProductType(row.paddy_type);
      if (isInwardBuyingTrip(row.trip_type)) {
        const rate = toNum(row.buying_price_per_kg ?? row.price_per_kg);
        if (isMaize) maizeKgIn += kg;
        else paddyKgIn += kg;
        paddyValue += kg * rate;

        const computed = computeSettlement(row);
        if (computed.settlement_status !== STATUS_COMPLETED) {
          settlementRows.push(computed);
          const stored = String(row.settlement_status ?? STATUS_COMPLETED);
          if (stored !== computed.settlement_status) {
            await supabase
              .from("trips")
              .update({ settlement_status: computed.settlement_status })
              .eq("id", row.id);
          }
        }
      }
      if (isOutwardTripType(row.trip_type)) {
        if (isMaize) maizeKgOut += kg;
        else paddyKgOut += kg;
      }
    }

    if (!hiresRes.error) {
      for (const h of hiresRes.data ?? []) {
        fuelSpend += toNum(h.diesel_cost);
      }
    }

    let overhead = 0;
    const utilityExpenseRows = [];
    if (!expensesRes.error) {
      for (const e of expensesRes.data ?? []) {
        const amount = toNum(e.amount);
        overhead += amount;
        if (amount > 0) {
          utilityExpenseRows.push({
            id: `util-${e.created_at ?? e.billing_date ?? Math.random()}`,
            date: e.billing_date || e.created_at || null,
            description: `${String(e.expense_type ?? "utility_expense")} (${String(e.warehouse_name ?? "General")})`,
            amount,
          });
        }
      }
    }

    let inventoryValue = 0;
    if (!inventoryRes.error) {
      for (const i of inventoryRes.data ?? []) {
        inventoryValue += toNum(i.quantity) * toNum(i.unit_cost);
      }
    }

    const stockExpenditure = paddyValue + inventoryValue;
    const buyingSellingRows = (buyingSellingRes.error ? [] : buyingSellingRes.data ?? []).map(
      normalizeBssRow
    );
    const paddyTypeNames = (customPaddyTypesRes.error ? [] : customPaddyTypesRes.data ?? []).map(
      (r) => String(r.name ?? "").trim()
    ).filter(Boolean);
    setCustomPaddyTypes(paddyTypeNames);
    setBuyingSellingRecords(buyingSellingRows);

    const buyingSellingKg = sumBssActiveBuyingWeight(
      buyingSellingRows.filter((r) => r.is_active !== false)
    );

    const bssOutstandingReceivables = sumBssOutstandingReceivables(buyingSellingRows);

    const bssGrossProfit = buyingSellingRows.reduce(
      (sum, r) => sum + getBssNetProfit(r),
      0
    );
    const bssGrossProfitRows = buyingSellingRows
      .filter((r) => getBssNetProfit(r) !== 0)
      .map((r) => ({
        id: `bss-gp-${r.id}`,
        date: r.created_at,
        productBuyer: `${String(r.commodity_type ?? "Stock")} / ${String(r.buyer_name ?? "Buyer")}`,
        quantity: getBssBuyingWeight(r),
        revenue: getBssNetProfit(r),
      }));

    const bssExpenseRows = buyingSellingRows
      .filter((r) => getBssAdditionalExpenses(r) > 0)
      .map((r) => ({
        id: `bss-exp-${r.id}`,
        date: r.created_at,
        categoryDetail: `Buying & Selling Additional Expenses - ${getBssVehicleNo(r)} (${String(r.buyer_name || "Buyer")})`,
        sourceModule: "Buying & Selling Stock",
        amount: getBssAdditionalExpenses(r),
      }));

    const tripGrossProfit = trips.reduce((sum, row) => sum + tripSalesGrossMargin(row), 0);
    const grossProfit = tripGrossProfit + bssGrossProfit;
    const grossProfitRows = [...grossProfitSaleRows, ...bssGrossProfitRows].sort(
      (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
    );

    let handReceivable = 0;
    let handPayable = 0;
    if (!handRes.error) {
      for (const l of handRes.data ?? []) {
        if (l.is_settled) continue;
        if (l.loan_type === LOAN_RECEIVABLE) handReceivable += toNum(l.amount);
        else handPayable += toNum(l.amount);
      }
    }

    let bankOutstanding = 0;
    if (!loansRes.error) {
      const reps = repsRes.error ? [] : repsRes.data ?? [];
      const byLoan = new Map();
      for (const r of reps) {
        const lid = String(r.loan_id);
        if (!byLoan.has(lid)) byLoan.set(lid, []);
        byLoan.get(lid).push(r);
      }
      for (const loan of loansRes.data ?? []) {
        if (String(loan.status) !== BANK_ACTIVE) continue;
        const finance = computeLoanFinance(loan, byLoan.get(String(loan.id)) ?? []);
        bankOutstanding += finance.totalOutstanding;
      }
    }

    const vehicles = vehiclesRes.error ? [] : (vehiclesRes.data ?? []);
    setVehicleAlerts(buildVehicleComplianceAlerts(vehicles));
    setSettlements(settlementRows);

    const staffNameById = new Map(
      ((staffRes.error ? [] : staffRes.data ?? [])).map((s) => [String(s.id), String(s.name ?? "").trim()])
    );

    const utilitiesRows = ((expensesTableRes.rows.length > 0
      ? expensesTableRes.rows
      : utilityExpenseRows.map((r) => ({
          id: r.id,
          amount: r.amount,
          billing_date: r.date,
          expense_type: r.description,
          warehouse_name: "",
          description: "",
          created_at: r.date,
        })))
    ).map((r) => ({
      id: r.id,
      date: r.billing_date || r.created_at || null,
      categoryDetail: `Utility - ${String(r.description || r.expense_type || "General")} (${String(
        r.warehouse_name || "General"
      )})`,
      sourceModule: "Expenses & Utilities",
      amount: toNum(r.amount),
    }));

    const livePayrollRows =
      payrollTableRes.rows.length > 0
        ? payrollTableRes.rows.map((p) => ({
            id: `payroll-${p.id}`,
            date: p.paid_date || p.created_at || null,
            categoryDetail: `${String(p.staff_name || "Staff")} - ${String(
              p.transaction_type || "Payroll"
            )}`,
            sourceModule: "Staff & Payroll",
            amount: toNum(p.amount),
          }))
        : [];

    const payrollFallbackRows = [
      ...trips
        .filter((t) => toNum(t.driver_wage) > 0 || toNum(t.helper_wage) > 0)
        .flatMap((t) => {
          const rows = [];
          if (toNum(t.driver_wage) > 0) {
            rows.push({
              id: `trip-pay-driver-${t.id}`,
              date: t.created_at,
              categoryDetail: `${String(t.driver_name || "Driver")} - Payroll`,
              sourceModule: "Staff & Payroll",
              amount: toNum(t.driver_wage),
            });
          }
          if (toNum(t.helper_wage) > 0) {
            rows.push({
              id: `trip-pay-helper-${t.id}`,
              date: t.created_at,
              categoryDetail: `${String(t.helper_name || "Helper")} - Payroll`,
              sourceModule: "Staff & Payroll",
              amount: toNum(t.helper_wage),
            });
          }
          return rows;
        }),
      ...((hiresRes.error ? [] : hiresRes.data ?? [])
        .filter((h) => toNum(h.driver_wage) > 0 || toNum(h.helper_wage) > 0)
        .flatMap((h) => {
          const rows = [];
          if (toNum(h.driver_wage) > 0) {
            rows.push({
              id: `hire-pay-driver-${h.id}`,
              date: h.created_at,
              categoryDetail: `${String(h.driver_name || "Driver")} - Payroll`,
              sourceModule: "Staff & Payroll",
              amount: toNum(h.driver_wage),
            });
          }
          if (toNum(h.helper_wage) > 0) {
            rows.push({
              id: `hire-pay-helper-${h.id}`,
              date: h.created_at,
              categoryDetail: `Helper - Payroll (${String(h.lorry_number ?? "N/A")})`,
              sourceModule: "Staff & Payroll",
              amount: toNum(h.helper_wage),
            });
          }
          return rows;
        })),
      ...((staffAdvancesRes.error ? [] : staffAdvancesRes.data ?? []).map((a) => ({
        id: `adv-${a.id}`,
        date: a.created_at,
        categoryDetail: `${staffNameById.get(String(a.staff_id)) || "Staff"} - Advance`,
        sourceModule: "Staff & Payroll",
        amount: toNum(a.amount),
      }))),
    ];
    const payrollRows = livePayrollRows.length > 0 ? livePayrollRows : payrollFallbackRows;

    const maintenanceRows = maintenanceTableRes.rows.map((m) => ({
      id: `maint-${m.id}`,
      date: m.maintenance_date || m.created_at || null,
      categoryDetail: `${String(m.lorry_number || "N/A")} - Maintenance`,
      sourceModule: "Vehicle Fleet Care",
      amount: toNum(m.amount),
    }));

    const dieselRows = (dieselTableRes.rows.length > 0
      ? dieselTableRes.rows
      : dieselPurchasesRes.error
        ? []
        : dieselPurchasesRes.data ?? []
    ).map((d) => ({
      id: `fuel-${d.id}`,
      date: d.purchased_at || d.log_date || d.created_at || null,
      categoryDetail: `Diesel Fuel Purchase (${moneyPlain(toNum(d.liters_added ?? d.liters))}L)`,
      sourceModule: "Fuel Tank Control",
      amount:
        toNum(d.amount) > 0
          ? toNum(d.amount)
          : toNum(d.liters_added ?? d.liters) * toNum(d.cost_per_liter),
    }));

    const tripDieselRows = trips
      .filter((t) => tripDieselExpenseAmount(t) > 0)
      .map((t) => ({
        id: `trip-diesel-${t.id}`,
        date: t.created_at,
        categoryDetail: `Trip ${String(t.lorry_number || "N/A")} - Diesel Cost (${moneyPlain(tripDieselExpenseLiters(t))}L)`,
        sourceModule: "Trip Management",
        amount: tripDieselExpenseAmount(t),
      }));

    const tripCostRows = trips
      .filter((t) => toNum(t.road_expenses) > 0)
      .map((t) => ({
        id: `trip-cost-${t.id}`,
        date: t.created_at,
        categoryDetail: `Trip ${String(t.trip_reference || t.id)} Expenses`,
        sourceModule: "Trip Management",
        amount: toNum(t.road_expenses),
      }));

    const expenseHistoryRows = [
      ...utilitiesRows,
      ...payrollRows,
      ...maintenanceRows,
      ...tripDieselRows,
      ...dieselRows,
      ...tripCostRows,
      ...bssExpenseRows,
    ]
      .filter((r) => toNum(r.amount) > 0)
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
    setAllExpenses(expenseHistoryRows);
    const totalExpenses = expenseHistoryRows.reduce((sum, row) => sum + toNum(row.amount), 0);
    const netProfit = grossProfit - totalExpenses;

    const receivableRows = settlementRows
      .filter((s) => s.settlement_status === STATUS_RECEIVABLE)
      .map((s) => ({
        id: `recv-${s.id}`,
        date: s.created_at,
        description: `${s.display_label}${s.lorry_number ? ` / ${s.lorry_number}` : ""}`,
        amount: s.deviation_amount,
      }))
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

    const payableRows = settlementRows
      .filter((s) => s.settlement_status === STATUS_PAYABLE)
      .map((s) => ({
        id: `pay-${s.id}`,
        date: s.created_at,
        description: `${s.display_label}${s.lorry_number ? ` / ${s.lorry_number}` : ""}`,
        amount: s.deviation_amount,
      }))
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

    const paddyStockRows = trips
      .filter((t) => isPaddyProductType(t.paddy_type))
      .map((t) => ({
        id: `paddy-${t.id}`,
        date: t.created_at,
        lorry: String(t.lorry_number ?? "—"),
        action: isInwardBuyingTrip(t.trip_type) ? "Load" : "Unload",
        weight: toNum(t.actual_weight ?? t.total_kg),
      }))
      .filter((t) => t.weight > 0)
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .slice(0, 40);

    const maizeStockRows = trips
      .filter((t) => isMaizeProductType(t.paddy_type))
      .map((t) => ({
        id: `maize-${t.id}`,
        date: t.created_at,
        lorry: String(t.lorry_number ?? "—"),
        action: isInwardBuyingTrip(t.trip_type) ? "Load" : "Unload",
        weight: toNum(t.actual_weight ?? t.total_kg),
      }))
      .filter((t) => t.weight > 0)
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

    const activeCapitalRows = [
      ...((bankDepositsRes.error ? [] : bankDepositsRes.data ?? []).map((d) => ({
        id: `dep-${d.id}`,
        date: d.deposited_at || d.created_at,
        description: String(d.reference_note ?? "Bank Deposit"),
        amount: toNum(d.amount),
      }))),
      {
        id: "liq-floating",
        date: new Date().toISOString(),
        description: "Floating Cash Liquidity (Receivables - Payables)",
        amount: handReceivable - handPayable,
      },
    ].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

    const summaryDate = new Date().toISOString();
    setHistoryLogs({
      grossProfit: grossProfitRows.map((r) => ({
        id: r.id,
        cells: [
          formatDateTime(r.date),
          r.productBuyer,
          `${moneyPlain(r.quantity)} kg`,
          moneyFullLkrPrecise(r.revenue),
        ],
      })),
      netProfit: [
        {
          id: "gp",
          cells: [formatDateTime(summaryDate), "Gross Profit", moneyFullLkr(grossProfit)],
        },
        {
          id: "exp",
          cells: [formatDateTime(summaryDate), "Total Expenses", moneyFullLkr(totalExpenses)],
        },
        {
          id: "np",
          cells: [formatDateTime(summaryDate), "Net Profit", moneyFullLkr(netProfit)],
        },
      ],
      totalExpenses: expenseHistoryRows.map((r) => ({
        id: r.id,
        cells: [
          formatDateTime(r.date),
          r.categoryDetail,
          r.sourceModule,
          moneyFullLkrPrecise(r.amount),
        ],
      })),
      totalPaddyStock: paddyStockRows.map((r) => ({
        id: r.id,
        cells: [
          formatDateTime(r.date),
          r.lorry,
          r.action,
          `${r.action === "Load" ? "+" : "-"} ${moneyPlain(r.weight)} KG`,
        ],
      })),
      totalMaizeStock: maizeStockRows.map((r) => ({
        id: r.id,
        cells: [
          formatDateTime(r.date),
          r.lorry,
          r.action,
          `${r.action === "Load" ? "+" : "-"} ${moneyPlain(r.weight)} KG`,
        ],
      })),
      receivables: receivableRows.map((r) => ({
        id: r.id,
        cells: [formatDateTime(r.date), r.description, moneyFullLkr(r.amount)],
      })),
      payables: payableRows.map((r) => ({
        id: r.id,
        cells: [formatDateTime(r.date), r.description, moneyFullLkr(r.amount)],
      })),
      activeCapital: activeCapitalRows.map((r) => ({
        id: r.id,
        cells: [formatDateTime(r.date), r.description, moneyFullLkr(r.amount)],
      })),
    });

    setKpis({
      paddyKg: paddyKgIn - paddyKgOut,
      paddyValue,
      maizeKg: maizeKgIn - maizeKgOut,
      grossProfit,
      netProfit,
      totalExpenses,
      handReceivable,
      handPayable,
      bankOutstanding,
      fuelSpend,
      inventoryValue,
      buyingSellingKg,
      bssOutstandingReceivables,
    });
  }, []);

  const handleBuyingSellingSubmit = useCallback(
    async (form, metrics, editingId) => {
      setBuyingSellingSubmitting(true);
      setError("");
      try {
        const varietyValue = resolveBssVariety(form);
        const payload = buildBssPayload(form, metrics, varietyValue);

        if (form.commodity_type === "Paddy" && form.variety_select === ADD_NEW_VARIETY) {
          const { error: typeErr } = await supabase
            .from("custom_paddy_types")
            .insert({ name: varietyValue });
          if (typeErr && !String(typeErr.message).includes("duplicate")) throw typeErr;
        }

        if (editingId) {
          const { error: updateErr } = await supabase
            .from("buying_selling_stock")
            .update(payload)
            .eq("id", editingId);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabase.from("buying_selling_stock").insert(payload);
          if (insertErr) throw insertErr;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(dbError(err));
        return false;
      } finally {
        setBuyingSellingSubmitting(false);
      }
    },
    [refresh]
  );

  const handleBuyingSellingDelete = useCallback(
    async (recordId) => {
      setBuyingSellingDeletingId(recordId);
      setError("");
      try {
        const { error: deleteErr } = await supabase
          .from("buying_selling_stock")
          .delete()
          .eq("id", recordId);
        if (deleteErr) throw deleteErr;
        await refresh();
        return true;
      } catch (err) {
        setError(dbError(err));
        return false;
      } finally {
        setBuyingSellingDeletingId(null);
      }
    },
    [refresh]
  );

  const closeBuyingSellingModal = useCallback(() => {
    setBuyingSellingOpen(false);
    setBuyingSellingFocusId(null);
  }, []);

  const handleBuyingSellingPaymentSettle = useCallback(
    async (recordId) => {
      setBuyingSellingPaymentSettlingId(recordId);
      setError("");
      try {
        const settledAt = new Date().toISOString();
        const { error: updateErr } = await supabase
          .from("buying_selling_stock")
          .update({
            payment_status: "Settled",
            advance_settlement_status: "settled",
            settled_at: settledAt,
          })
          .eq("id", recordId);
        if (updateErr) throw updateErr;

        setBuyingSellingRecords((prev) => {
          const next = prev.map((row) =>
            row.id === recordId
              ? {
                  ...row,
                  payment_status: "Settled",
                  advance_settlement_status: "settled",
                  settled_at: settledAt,
                }
              : row
          );
          setKpis((kpiPrev) => ({
            ...kpiPrev,
            bssOutstandingReceivables: sumBssOutstandingReceivables(next),
          }));
          return next;
        });

        await refresh();
        return true;
      } catch (err) {
        setError(dbError(err));
        return false;
      } finally {
        setBuyingSellingPaymentSettlingId(null);
      }
    },
    [refresh]
  );

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

  const handleMarkSettled = async (trip) => {
    setSettlingId(trip.id);
    setError("");
    try {
      const { error: updErr } = await supabase
        .from("trips")
        .update({ settlement_status: STATUS_COMPLETED })
        .eq("id", trip.id);
      if (updErr) throw updErr;
      setSettlements((prev) => prev.filter((s) => s.id !== trip.id));
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSettlingId("");
    }
  };

  const alertCount = vehicleAlerts.length;

  const bssSettlementNotifications = useMemo(
    () => buildBssSettlementNotifications(buyingSellingRecords),
    [buyingSellingRecords]
  );

  const handleViewBssSettlement = useCallback((recordId) => {
    setBuyingSellingFocusId(recordId);
    setBuyingSellingOpen(true);
  }, []);

  const openBuyingSellingModal = useCallback(() => {
    setBuyingSellingFocusId(null);
    setBuyingSellingOpen(true);
  }, []);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-full min-h-screen px-4 py-8 text-white sm:px-8 lg:px-16 lg:py-12"
    >
      <ControlGridBackdrop />

      <div className="relative z-10 mx-auto max-w-[1600px]">
        <div className="mb-5 flex justify-end">
          <DashboardAuthBar variant="dark" />
        </div>
        <BrandHero />
        <HistoryModal
          activeKey={activeHistoryModal}
          logs={historyLogs}
          onClose={() => setActiveHistoryModal(null)}
        />
        <BuyingSellingStockModal
          open={buyingSellingOpen}
          onClose={closeBuyingSellingModal}
          records={buyingSellingRecords}
          paddyTypes={customPaddyTypes}
          onSubmit={handleBuyingSellingSubmit}
          onDelete={handleBuyingSellingDelete}
          onPaymentSettle={handleBuyingSellingPaymentSettle}
          submitting={buyingSellingSubmitting}
          paymentSettlingId={buyingSellingPaymentSettlingId}
          deletingId={buyingSellingDeletingId}
          focusRecordId={buyingSellingFocusId}
        />

        {error ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        ) : null}

        {loading ? (
          <div className="mt-20 flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            <SettlementNotificationCenter
              notifications={bssSettlementNotifications}
              onViewSettle={handleViewBssSettlement}
            />

            <motion.section
              initial="hidden"
              animate="show"
              variants={statsSectionStagger}
            >
              <GrossProfitHero
                value={grossProfitFmt.main}
                sub={grossProfitFmt.sub}
                onClick={() => setActiveHistoryModal("grossProfit")}
              />
              <p className="mb-5 mt-3 text-center text-[10px] font-semibold text-white/35 sm:text-left">
                Trip sales + buying &amp; selling stock income before general expenses
              </p>

              <motion.div
                className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
                initial="hidden"
                animate="show"
                variants={kpiGridStagger}
              >
                <KpiCard
                  title="Total Expenses"
                  value={moneyFullLkr(totalExpensesFromState)}
                  sub="Utilities + Trip Diesel + Maintenance + Fuel Stock"
                  tone="rose"
                  icon={Receipt}
                  hero
                  onClick={() => setActiveHistoryModal("totalExpenses")}
                />
                <KpiCard
                  title="Net Profit"
                  value={netProfitFmt.main}
                  sub={netProfitFmt.sub}
                  tone="cyan"
                  icon={TrendingUp}
                  hero
                  onClick={() => setActiveHistoryModal("netProfit")}
                />
              </motion.div>
              <p className="mb-6 text-center text-[10px] font-semibold text-white/35 sm:text-left">
                Gross Profit − Total Expenses = Net Profit
              </p>

              <motion.div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                initial="hidden"
                animate="show"
                variants={kpiGridStagger}
              >
                <KpiCard
                  title="Total Paddy Stock"
                  value={`${moneyPlain(kpis.paddyKg)} kg`}
                  sub={moneyFullLkr(kpis.paddyValue)}
                  tone="sky"
                  icon={Scale}
                  onClick={() => setActiveHistoryModal("totalPaddyStock")}
                />
                <KpiCard
                  title="Total Maize Stock"
                  value={`${moneyPlain(kpis.maizeKg)} kg`}
                  sub="Net Remaining Stock"
                  tone="amber"
                  icon={Scale}
                  onClick={() => setActiveHistoryModal("totalMaizeStock")}
                />
                <KpiCard
                  title="Buying & Selling Stock"
                  value={`${moneyPlain(kpis.buyingSellingKg)} kg`}
                  sub="Active trade weight"
                  tone="emerald"
                  icon={Package}
                  onClick={openBuyingSellingModal}
                />
                <KpiCard
                  title="Total Outstanding Receivables"
                  value={moneyFullLkr(kpis.bssOutstandingReceivables)}
                  sub="Pending buyer payments from stock sales"
                  tone="emerald"
                  icon={HandCoins}
                  onClick={openBuyingSellingModal}
                />
                <KpiCard
                  title="Pending Receivables"
                  value={moneyFullLkr(kpis.handReceivable)}
                  tone="neutral"
                  icon={HandCoins}
                  onClick={() => setActiveHistoryModal("receivables")}
                />
                <KpiCard
                  title="Pending Payables"
                  value={moneyFullLkr(kpis.handPayable)}
                  tone="amber"
                  icon={HandCoins}
                  onClick={() => setActiveHistoryModal("payables")}
                />
                <KpiCard
                  title="Active Capital"
                  value={moneyFullLkr(kpis.bankOutstanding)}
                  tone="neutral"
                  icon={Landmark}
                  onClick={() => setActiveHistoryModal("activeCapital")}
                />
              </motion.div>
            </motion.section>

            <ScrollReveal>
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.52, ease: EASE_FLOW }}
              >
                <NodeAlertHub
                  vehicleAlerts={vehicleAlerts}
                  settlingId={settlingId}
                  onSettle={handleMarkSettled}
                  badgeCount={alertCount}
                />
              </motion.section>
            </ScrollReveal>

            <section>
              <h2 className="mb-8 text-lg font-black text-white">
                Executive Module Grid
              </h2>
              <motion.div
                className="grid grid-cols-1 gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                initial="hidden"
                animate="show"
                variants={moduleGridStagger}
              >
                {MODULES.map((mod) => (
                  <ModuleCard key={mod.href} mod={mod} />
                ))}
                <DayCashModuleCard />
              </motion.div>
            </section>
          </div>
        )}
      </div>
    </motion.main>
  );
}
