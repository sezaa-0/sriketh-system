"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Zap,
  Droplets,
  Warehouse,
  TrendingUp,
  Receipt,
  Building2,
} from "lucide-react";

const EXP_ALL = "all";
const WH_ALL = "all";
const EXP_ELECTRICITY = "electricity";
const EXP_WATER = "water";
const EXP_MAINTENANCE = "warehouse_maintenance";

const DB_OUTWARD = "බඩු බාන්න";

const WAREHOUSES = [
  "Warehouse 01",
  "Warehouse 02",
  "Warehouse 03",
  "Warehouse 04",
  "Warehouse 05",
  "Warehouse 06",
];

const T = {
  pageTitle: "Expenses & Utilities",
  pageSub: "Utility Expenses & Ultimate Profit Dashboard",
  ultimateProfit: "Ultimate Net Profit",
  ultimateLoss: "Ultimate Net Loss",
  operationalRevenue: "Total Operational Revenue",
  loadProfit: "Load Profit",
  hireProfit: "Hire Profit",
  overhead: "Total Utility Expenses",
  warehouseBreakdown: "Warehouse-wise Breakdown",
  formTitle: "Expense Entry",
  expenseType: "Expense Type",
  warehouse: "Warehouse",
  billNumber: "Bill / Account Number",
  billingDate: "Billing Date",
  amount: "Amount",
  save: "Save Expense",
  ledgerTitle: "Expense Ledger",
  emptyLedger: "No registered expenses",
  emptyFilter: "No expenses match selected filters",
  filterWarehouse: "Warehouse",
  filteredWarehouseTotal: "Selected Warehouse Total Expense",
  ledgerMatchCount: "Records",
  deleteConfirm: "Do you want to permanently delete this expense record?",
  filterAll: "All",
  typeElectricity: "Electricity Bill",
  typeWater: "Water Bill",
  typeMaintenance: "Maintenance",
};

const EXPENSE_TYPES = [
  {
    id: EXP_ELECTRICITY,
    label: T.typeElectricity,
    labelEn: "Electricity",
    icon: Zap,
  },
  {
    id: EXP_WATER,
    label: T.typeWater,
    labelEn: "Water",
    icon: Droplets,
  },
  {
    id: EXP_MAINTENANCE,
    label: T.typeMaintenance,
    labelEn: "Warehouse Maintenance",
    icon: Warehouse,
  },
];

const TYPE_FILTER_PILLS = [
  { id: EXP_ALL, labelSi: T.filterAll, labelEn: "All" },
  { id: EXP_ELECTRICITY, labelSi: T.typeElectricity, labelEn: "Electricity" },
  { id: EXP_WATER, labelSi: T.typeWater, labelEn: "Water" },
  {
    id: EXP_MAINTENANCE,
    labelSi: T.typeMaintenance,
    labelEn: "Maintenance",
  },
];

const WAREHOUSE_FILTER_PILLS = [
  { id: WH_ALL, label: T.filterAll },
  ...WAREHOUSES.map((name) => ({ id: name, label: name })),
];

const FILTER_PILL_ACTIVE =
  "border-neutral-950 bg-neutral-950 text-white shadow-sm";
const FILTER_PILL_INACTIVE =
  "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50";

const INITIAL_FORM = {
  expense_type: EXP_ELECTRICITY,
  warehouse_name: WAREHOUSES[0],
  bill_number: "",
  billing_date: "",
  amount: "",
};

const INPUT =
  "w-full min-w-0 bg-[#EFEFEF]/70 border-0 rounded-2xl p-4 font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none";

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
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardHoverMotion = {
  y: -4,
  scale: 1.005,
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
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

function isMissingTableError(err) {
  const msg = String(err?.message ?? err?.details ?? "").toLowerCase();
  return (
    err?.code === "42P01" ||
    err?.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find the table")
  );
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
  const sign = amount < 0 ? "-" : "";
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

function isOutwardTripType(type) {
  const s = String(type ?? "").trim();
  return (
    s === DB_OUTWARD ||
    s === "Outward" ||
    s.toLowerCase() === "outward" ||
    s.includes("බාන්න")
  );
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

function loadRowNetProfit(row) {
  if (row.net_profit != null && row.net_profit !== "") {
    return toNum(row.net_profit);
  }

  const kg = toNum(row.total_kg ?? row.weight_kg ?? row.quantity_kg);
  const sell = toNum(row.selling_price_per_kg);
  const buy = toNum(
    row.purchase_price_per_kg ?? row.buying_price_per_kg ?? row.price_per_kg
  );
  const logistics =
    toNum(row.diesel_cost ?? row.fuel_cost) +
    toNum(row.driver_wage) +
    toNum(row.helper_wage) +
    toNum(row.road_expenses ?? row.other_expenses);

  if (sell > 0 && buy >= 0 && kg > 0) {
    return kg * (sell - buy) - logistics;
  }

  if (row.trip_type != null || row.load_type != null) {
    return tripRowNetProfit({
      trip_type: row.trip_type ?? row.load_type,
      total_kg: kg,
      price_per_kg: sell || buy,
      diesel_cost: row.diesel_cost,
      driver_wage: row.driver_wage,
      helper_wage: row.helper_wage,
      road_expenses: row.road_expenses,
    });
  }

  return 0;
}

function hireRowNetProfit(row) {
  const expenses =
    toNum(row.diesel_cost) +
    toNum(row.driver_wage) +
    toNum(row.helper_wage) +
    toNum(row.other_expenses);
  return toNum(row.hire_rate) - expenses;
}

async function sumLoadsNetProfit() {
  const { data, error } = await supabase.from("loads").select("*");
  if (error) {
    if (isMissingTableError(error)) return sumTripsNetProfit();
    throw error;
  }
  let total = 0;
  for (const row of data ?? []) {
    total += loadRowNetProfit(row);
  }
  return total;
}

async function sumTripsNetProfit() {
  const { data, error } = await supabase.from("trips").select("*");
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
  let total = 0;
  for (const row of data ?? []) {
    total += tripRowNetProfit(row);
  }
  return total;
}

async function sumHiresNetProfit() {
  const { data, error } = await supabase.from("lorry_hires").select("*");
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
  let total = 0;
  for (const row of data ?? []) {
    total += hireRowNetProfit(row);
  }
  return total;
}

function expenseTypeMeta(type) {
  return (
    EXPENSE_TYPES.find((t) => t.id === type) ?? EXPENSE_TYPES[0]
  );
}

function mapExpense(row) {
  const type = EXPENSE_TYPES.some((t) => t.id === String(row.expense_type ?? "").trim())
    ? String(row.expense_type).trim()
    : EXP_ELECTRICITY;
  const warehouse = WAREHOUSES.includes(String(row.warehouse_name ?? "").trim())
    ? String(row.warehouse_name).trim()
    : WAREHOUSES[0];
  return {
    id: String(row.id),
    expense_type: type,
    warehouse_name: warehouse,
    bill_number: String(row.bill_number ?? "").trim(),
    billing_date: row.billing_date ? String(row.billing_date) : "",
    amount: Number(row.amount ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function buildExpensePayload(form) {
  const type = EXPENSE_TYPES.some((t) => t.id === form.expense_type)
    ? form.expense_type
    : EXP_ELECTRICITY;
  return {
    expense_type: type,
    warehouse_name: WAREHOUSES.includes(form.warehouse_name)
      ? form.warehouse_name
      : WAREHOUSES[0],
    bill_number: String(form.bill_number ?? "").trim(),
    billing_date: toDateOrNull(form.billing_date),
    amount: toNum(form.amount),
  };
}

function FinancialDisplay({ amount, size = "md", positiveClass, negativeClass }) {
  const f = formatSinhalaLakhCrore(amount);
  const positive = Number(amount) >= 0;
  const mainClass =
    size === "hero"
      ? "text-4xl font-black tracking-tight sm:text-5xl"
      : size === "lg"
        ? "text-2xl font-black tracking-tight"
        : "text-xl font-black tracking-tight";
  const tone = positive
    ? positiveClass ?? "text-emerald-700"
    : negativeClass ?? "text-rose-700";

  return (
    <div className="min-w-0">
      <p className={`${mainClass} ${tone}`} lang="si">
        {f.main}
      </p>
      <p className="mt-1 text-xs font-semibold text-neutral-400">{f.sub}</p>
    </div>
  );
}

function UltimateProfitCard({ summary }) {
  const positive = summary.ultimateNetProfit >= 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 overflow-hidden rounded-3xl border p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 ${
        positive
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-white"
          : "border-rose-200 bg-gradient-to-br from-rose-50/90 via-white to-white"
      }`}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
            <TrendingUp className="h-4 w-4" />
            {T.pageSub}
          </p>
          <h2
            className={`mt-2 text-lg font-black sm:text-xl ${
              positive ? "text-emerald-900" : "text-rose-900"
            }`}
            lang="si"
          >
            {positive ? T.ultimateProfit : T.ultimateLoss}
          </h2>
          <FinancialDisplay
            amount={summary.ultimateNetProfit}
            size="hero"
            positiveClass="text-emerald-700"
            negativeClass="text-rose-700"
          />
        </div>
        <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-100 bg-white/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
              {T.operationalRevenue}
            </p>
            <FinancialDisplay amount={summary.operationalRevenue} size="sm" />
            <p className="mt-2 text-[10px] font-semibold text-neutral-500">
              {T.loadProfit}: {formatSinhalaLakhCrore(summary.loadProfit).main}
            </p>
            <p className="text-[10px] font-semibold text-neutral-500">
              {T.hireProfit}: {formatSinhalaLakhCrore(summary.hireProfit).main}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800/80">
              {T.overhead}
            </p>
            <FinancialDisplay amount={summary.overheadTotal} size="sm" />
          </div>
          <div
            className={`rounded-2xl border p-4 ${
              positive
                ? "border-emerald-100 bg-emerald-50/40"
                : "border-rose-100 bg-rose-50/40"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
              Net
            </p>
            <p
              className={`text-lg font-black ${
                positive ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {positive ? "+" : "−"}
              {formatSinhalaLakhCrore(Math.abs(summary.ultimateNetProfit)).main}
            </p>
          </div>
        </div>
      </div>

      {summary.warehouseTotals.length > 0 ? (
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
            <Building2 className="h-4 w-4" />
            {T.warehouseBreakdown}
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.warehouseTotals.map((w) => (
              <span
                key={w.name}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 shadow-sm"
              >
                <span lang="si">{w.name}</span>
                <span className="text-neutral-400">:</span>
                <span>{moneyFullLkr(w.total)}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}

function FilterPill({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition-all ${active ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE} ${className}`}
    >
      {children}
    </button>
  );
}

function LedgerFilters({
  expenseFilter,
  onExpenseFilterChange,
  warehouseFilter,
  onWarehouseFilterChange,
}) {
  return (
    <div className="mb-4 space-y-3">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          {T.expenseType}
        </p>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTER_PILLS.map((pill) => (
            <FilterPill
              key={pill.id}
              active={expenseFilter === pill.id}
              onClick={() => onExpenseFilterChange(pill.id)}
            >
              <span lang="si">{pill.labelSi}</span>
              <span className="opacity-70"> ({pill.labelEn})</span>
            </FilterPill>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          {T.filterWarehouse}
        </p>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max flex-wrap gap-2 sm:min-w-0">
            {WAREHOUSE_FILTER_PILLS.map((pill) => (
              <FilterPill
                key={pill.id}
                active={warehouseFilter === pill.id}
                onClick={() => onWarehouseFilterChange(pill.id)}
              >
                <span lang="si">{pill.label}</span>
              </FilterPill>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function filterExpenses(list, expenseFilter, warehouseFilter) {
  return list.filter((e) => {
    const typeOk =
      expenseFilter === EXP_ALL || e.expense_type === expenseFilter;
    const warehouseOk =
      warehouseFilter === WH_ALL || e.warehouse_name === warehouseFilter;
    return typeOk && warehouseOk;
  });
}

function ExpenseRow({ expense, onDelete }) {
  const meta = expenseTypeMeta(expense.expense_type);
  const Icon = meta.icon;

  return (
    <motion.article
      layout
      variants={staggerChild}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -24, scale: 0.98 }}
      whileHover={cardHoverMotion}
      className="flex min-w-0 items-center gap-4 rounded-3xl border border-neutral-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          expense.expense_type === EXP_ELECTRICITY
            ? "bg-amber-50 text-amber-700"
            : expense.expense_type === EXP_WATER
              ? "bg-sky-50 text-sky-700"
              : "bg-neutral-100 text-neutral-700"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-neutral-950" lang="si">
            {meta.label}
          </p>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
            {expense.warehouse_name}
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {T.billNumber}: {expense.bill_number || "—"} · {formatDate(expense.billing_date)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-lg font-black text-neutral-950">
          {moneyFullLkr(expense.amount)}
        </p>
        <p className="text-[10px] font-bold text-neutral-400" lang="si">
          {formatSinhalaLakhCrore(expense.amount).main}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(expense)}
        className={ICON_BTN}
        aria-label={T.deleteConfirm}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </motion.article>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loadProfit, setLoadProfit] = useState(0);
  const [hireProfit, setHireProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expenseFilter, setExpenseFilter] = useState(EXP_ALL);
  const [warehouseFilter, setWarehouseFilter] = useState(WH_ALL);

  const summary = useMemo(() => {
    const overheadTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const operationalRevenue = loadProfit + hireProfit;
    const ultimateNetProfit = operationalRevenue - overheadTotal;

    const warehouseMap = new Map();
    for (const w of WAREHOUSES) warehouseMap.set(w, 0);
    for (const e of expenses) {
      warehouseMap.set(
        e.warehouse_name,
        (warehouseMap.get(e.warehouse_name) ?? 0) + e.amount
      );
    }
    const warehouseTotals = Array.from(warehouseMap.entries())
      .map(([name, total]) => ({ name, total }))
      .filter((w) => w.total > 0)
      .sort((a, b) => b.total - a.total);

    return {
      loadProfit,
      hireProfit,
      operationalRevenue,
      overheadTotal,
      ultimateNetProfit,
      warehouseTotals,
    };
  }, [expenses, loadProfit, hireProfit]);

  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, expenseFilter, warehouseFilter),
    [expenses, expenseFilter, warehouseFilter]
  );

  const filteredLedgerTotal = useMemo(
    () => filteredExpenses.reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );

  const hasActiveLedgerFilters =
    expenseFilter !== EXP_ALL || warehouseFilter !== WH_ALL;

  const refreshExpenses = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from("utility_expenses")
      .select("*")
      .order("billing_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (fetchErr) throw fetchErr;
    return (data ?? []).map(mapExpense);
  }, []);

  const refreshProfits = useCallback(async () => {
    const [loadsTotal, hiresTotal] = await Promise.all([
      sumLoadsNetProfit(),
      sumHiresNetProfit(),
    ]);
    setLoadProfit(loadsTotal);
    setHireProfit(hiresTotal);
  }, []);

  const refresh = useCallback(async () => {
    const list = await refreshExpenses();
    setExpenses(list);
    await refreshProfits();
  }, [refreshExpenses, refreshProfits]);

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

  const saveExpense = async (ev) => {
    ev.preventDefault();
    if (!toNum(form.amount)) {
      setError("Amount is required");
      return;
    }
    setSaving(true);
    setError("");
    const payload = buildExpensePayload(form);
    try {
      const { data, error: insErr } = await supabase
        .from("utility_expenses")
        .insert(payload)
        .select("*")
        .single();
      if (insErr) throw insErr;
      const created = mapExpense(data);
      setExpenses((prev) => [created, ...prev]);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(T.deleteConfirm)) return;
    setError("");
    try {
      const { error: delErr } = await supabase
        .from("utility_expenses")
        .delete()
        .eq("id", expense.id);
      if (delErr) throw delErr;
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    } catch (err) {
      setError(dbError(err));
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
        <>
          <UltimateProfitCard summary={summary} />

          <div className="grid w-full gap-8 xl:grid-cols-[1.15fr_minmax(0,1fr)]">
            <motion.section
              variants={staggerChild}
              initial="hidden"
              animate="show"
              className="h-fit rounded-3xl border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] xl:sticky xl:top-8"
            >
              <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-neutral-950">
                <Plus className="h-5 w-5" />
                <span lang="si">{T.formTitle}</span>
              </h2>

              <form onSubmit={saveExpense} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.expenseType}
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {EXPENSE_TYPES.map((type) => {
                      const active = form.expense_type === type.id;
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, expense_type: type.id }))
                          }
                          className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-xs font-bold transition-all ${
                            active
                              ? "border-neutral-950 bg-neutral-950 text-white"
                              : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-center leading-tight" lang="si">
                            {type.label}
                          </span>
                          <span className="text-[9px] font-semibold opacity-70">
                            ({type.labelEn})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.warehouse}
                  </label>
                  <select
                    className={INPUT}
                    value={form.warehouse_name}
                    onChange={(ev) =>
                      setForm((f) => ({ ...f, warehouse_name: ev.target.value }))
                    }
                  >
                    {WAREHOUSES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.billNumber}
                  </label>
                  <input
                    className={INPUT}
                    value={form.bill_number}
                    onChange={(ev) =>
                      setForm((f) => ({ ...f, bill_number: ev.target.value }))
                    }
                    placeholder="ACC-0000"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.billingDate}
                  </label>
                  <input
                    type="date"
                    className={INPUT}
                    value={form.billing_date}
                    onChange={(ev) =>
                      setForm((f) => ({ ...f, billing_date: ev.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                    {T.amount}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={INPUT}
                    value={form.amount}
                    onChange={(ev) =>
                      setForm((f) => ({ ...f, amount: ev.target.value }))
                    }
                    placeholder="0"
                  />
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
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="flex items-center gap-2 text-lg font-black text-neutral-950">
                  <Receipt className="h-5 w-5 shrink-0" />
                  <span lang="si">{T.ledgerTitle}</span>
                </h2>
                {warehouseFilter !== WH_ALL ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      {T.filteredWarehouseTotal}
                      <span className="ml-1 normal-case text-neutral-700">
                        ({warehouseFilter})
                      </span>
                    </p>
                    <p className="font-mono text-base font-black text-neutral-950">
                      {moneyFullLkr(filteredLedgerTotal)}
                    </p>
                    <p className="text-[10px] font-semibold text-neutral-400" lang="si">
                      {formatSinhalaLakhCrore(filteredLedgerTotal).main}
                      {hasActiveLedgerFilters
                        ? ` · ${filteredExpenses.length} ${T.ledgerMatchCount}`
                        : ""}
                    </p>
                  </motion.div>
                ) : hasActiveLedgerFilters ? (
                  <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-bold text-neutral-600">
                    {filteredExpenses.length} {T.ledgerMatchCount}
                  </span>
                ) : null}
              </div>

              <LedgerFilters
                expenseFilter={expenseFilter}
                onExpenseFilterChange={setExpenseFilter}
                warehouseFilter={warehouseFilter}
                onWarehouseFilterChange={setWarehouseFilter}
              />

              {expenses.length === 0 ? (
                <p className="py-16 text-center text-lg font-bold text-neutral-400" lang="si">
                  {T.emptyLedger}
                </p>
              ) : filteredExpenses.length === 0 ? (
                <p className="py-16 text-center text-lg font-bold text-neutral-400" lang="si">
                  {T.emptyFilter}
                </p>
              ) : (
                <motion.div className="flex flex-col gap-3" layout>
                  <AnimatePresence mode="popLayout">
                    {filteredExpenses.map((expense) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>
          </div>
        </>
      )}
    </motion.main>
  );
}
