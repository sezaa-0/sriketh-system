"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Trash2,
  Fuel,
  Droplets,
  History,
  PackagePlus,
  Gauge,
} from "lucide-react";

const STOCK_ID = 1;

const TAB_PURCHASE = "purchase";
const TAB_CONSUME = "consume";

const LEDGER_PURCHASES = "purchases";
const LEDGER_USAGE = "usage";

const TRIP_LOAD = "load";
const TRIP_HIRE = "hire";

const TABLE_TRIPS = "trips";
const TABLE_LOADS = "loads";
const TABLE_HIRES = "lorry_hires";

const T = {
  pageTitle: "Fuel Tank Control",
  pageSub: "Diesel Bulk Management & Fuel Consumption Tracker",
  currentStock: "Current Diesel Stock",
  avgCostPerLiter: "Average Cost per Liter",
  totalAssetValue: "Total Stock Value",
  tankLabel: "Private Diesel Tank",
  tabPurchase: "Add Diesel Stock",
  tabPurchaseEn: "Bulk Purchase",
  tabConsume: "Fuel Issuing to Lorries",
  tabConsumeEn: "Fuel Consumption",
  litersAdded: "Liters Added",
  costPerLiter: "Cost per Liter (Rs.)",
  purchaseDate: "Purchase Date",
  totalCost: "Total Cost (Auto)",
  savePurchase: "Save Stock",
  selectVehicle: "Select Vehicle",
  litersIssued: "Issued Liters",
  tripType: "Trip Type",
  tripLoad: "Load Trip",
  tripHire: "Lorry Hire",
  tripId: "Trip / Hire ID",
  selectTrip: "Select Trip",
  saveConsume: "Record Fuel Usage",
  ledgerPurchases: "Stock Purchases",
  ledgerUsage: "Fuel Usage",
  emptyPurchases: "No purchase records",
  emptyUsage: "No usage records",
  insufficientFuel: "Insufficient fuel in tank. Current:",
  noVehicles: "Register a vehicle first (/vehicles)",
  selectTripRequired: "Select a trip or hire",
  litersRequired: "Liters must be greater than 0",
  deletePurchaseConfirm:
    "Deleting this purchase recalculates tank stock. Continue?",
  deleteUsageConfirm:
    "Deleting this usage returns fuel to the tank and clears linked trip fuel costs. Continue?",
  mappedTrip: "Mapped Trip",
  autoTripCost: "Auto-updated cost on trip record",
};

const INITIAL_PURCHASE_FORM = {
  liters_added: "",
  cost_per_liter: "",
  purchased_at: "",
};

const INITIAL_CONSUME_FORM = {
  vehicle_id: "",
  liters_issued: "",
  trip_type: TRIP_LOAD,
  trip_target_id: "",
};

const CARD =
  "rounded-3xl border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]";

const INPUT =
  "w-full min-w-0 bg-[#EFEFEF]/70 border-0 rounded-2xl p-4 font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none";

const ICON_BTN =
  "rounded-xl p-2 text-neutral-400 transition-all hover:bg-neutral-50 hover:text-rose-600";

const PLATE_BADGE =
  "inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-xl border-2 border-amber-500/30 bg-amber-400/10 px-3 py-1.5 text-center font-mono text-xs font-black uppercase tracking-wider text-neutral-800 sm:text-sm";

const pageEnter = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
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
  const msg = dbError(err).toLowerCase();
  return msg.includes("does not exist") || msg.includes("could not find");
}

function toNum(v) {
  if (v == null || String(v).trim() === "") return 0;
  const n = parseFloat(String(v).trim());
  return Number.isNaN(n) ? 0 : n;
}

function moneyPlain(n) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(
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
    return { main: `${sign}Lakh ${String(Math.round(lakhs * 10) / 10)}`, sub };
  }

  const crores = Math.floor(n / 10_000_000);
  const remainder = n % 10_000_000;
  const lakhPart = Math.round(remainder / 100_000);
  let main = `${sign}Crore ${crores}`;
  if (lakhPart > 0) main += ` Lakh ${lakhPart}`;
  return { main, sub };
}

function todayDateValue() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function computeWacCostPerLiter(currentLiters, currentAvg, addedLiters, addedCost) {
  const l0 = Math.max(0, toNum(currentLiters));
  const c0 = Math.max(0, toNum(currentAvg));
  const l1 = Math.max(0, toNum(addedLiters));
  const c1 = Math.max(0, toNum(addedCost));
  const total = l0 + l1;
  if (total <= 0) return c1;
  return Math.round(((l0 * c0 + l1 * c1) / total) * 100) / 100;
}

function reverseWacAfterRemovingBatch(currentLiters, currentAvg, removedLiters, removedCost) {
  const q = toNum(currentLiters);
  const c = toNum(currentAvg);
  const q1 = toNum(removedLiters);
  const c1 = toNum(removedCost);
  const q0 = q - q1;
  if (q0 <= 0) return { liters: 0, avg: 0 };
  const c0 = (q * c - q1 * c1) / q0;
  return { liters: Math.max(0, q0), avg: Math.round(Math.max(0, c0) * 100) / 100 };
}

function formatPlateProvince(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}

function formatPlateSeries(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
}

function formatPlateSequence(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 4);
}

function formatPlateDisplay(vehicle) {
  if (!vehicle) return "—";
  const province = formatPlateProvince(vehicle.province_code);
  const series = formatPlateSeries(vehicle.series_code);
  const number = formatPlateSequence(vehicle.sequence_number);
  if (!province && !series && !number) return "—";
  if (!province || !series || !number) {
    return [province, series, number].filter(Boolean).join(" ") || "—";
  }
  return `${province} ⏐ ${series} - ${number}`;
}

function plateSortKey(vehicle) {
  return [
    formatPlateProvince(vehicle.province_code),
    formatPlateSeries(vehicle.series_code),
    formatPlateSequence(vehicle.sequence_number).padStart(4, "0"),
  ].join("|");
}

function mapStock(row) {
  return {
    id: Number(row.id ?? STOCK_ID),
    total_liters: Math.max(0, toNum(row.total_liters)),
    avg_cost_per_liter: Math.max(0, toNum(row.avg_cost_per_liter)),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapPurchase(row) {
  return {
    id: String(row.id),
    liters_added: toNum(row.liters_added),
    cost_per_liter: toNum(row.cost_per_liter),
    total_cost: toNum(row.total_cost),
    purchased_at: String(row.purchased_at ?? "").slice(0, 10),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapVehicle(row) {
  return {
    id: String(row.id),
    province_code: formatPlateProvince(row.province_code),
    series_code: formatPlateSeries(row.series_code),
    sequence_number: formatPlateSequence(row.sequence_number),
  };
}

function mapUsage(row, vehiclesById) {
  const vehicle = vehiclesById.get(String(row.vehicle_id)) ?? null;
  return {
    id: String(row.id),
    vehicle_id: String(row.vehicle_id),
    liters_issued: toNum(row.liters_issued),
    cost_per_liter_at_issue: toNum(row.cost_per_liter_at_issue),
    total_diesel_cost: toNum(row.total_diesel_cost),
    trip_type: String(row.trip_type ?? TRIP_LOAD),
    trip_table: String(row.trip_table ?? TABLE_TRIPS),
    trip_target_id: String(row.trip_target_id),
    issued_at: String(row.issued_at ?? new Date().toISOString()),
    created_at: String(row.created_at ?? new Date().toISOString()),
    vehicle,
  };
}

function mapTripOption(row, table) {
  const ref = row.trip_reference ?? row.hire_reference ?? row.id;
  const lorry = row.lorry_number ?? "";
  const label = [ref, lorry].filter(Boolean).join(" · ") || String(row.id).slice(0, 8);
  return {
    id: String(row.id),
    table,
    trip_type: table === TABLE_HIRES ? TRIP_HIRE : TRIP_LOAD,
    label,
  };
}

function SriLankanPlateBadge({ vehicle }) {
  const text = formatPlateDisplay(vehicle);
  return (
    <span className={PLATE_BADGE} title={text}>
      {text}
    </span>
  );
}

function TankGauge({ stock }) {
  const liters = stock.total_liters;
  const asset = liters * stock.avg_cost_per_liter;
  const f = formatSinhalaLakhCrore(asset);
  const gaugePct = Math.min(100, Math.round((liters / 15000) * 100));

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${CARD} overflow-hidden border-sky-100/90 bg-gradient-to-br from-white via-sky-50/25 to-white`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/80 bg-sky-50 text-sky-700">
              <Fuel className="h-6 w-6" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-800/70" lang="si">
                {T.tankLabel}
              </p>
              <p className="text-xs font-semibold text-neutral-500">{T.pageSub}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-100 bg-white/90 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500" lang="si">
                {T.currentStock}
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-neutral-950">
                {moneyPlain(liters)}
                <span className="ml-1 text-lg text-neutral-500">L</span>
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white/90 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500" lang="si">
                {T.avgCostPerLiter}
              </p>
              <p className="mt-2 text-xl font-black text-neutral-900">
                Rs. {moneyPlain(stock.avg_cost_per_liter)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/80" lang="si">
                {T.totalAssetValue}
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-700" lang="si">
                {f.main}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-400">{f.sub}</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col justify-end lg:w-48">
          <div className="relative mx-auto h-40 w-20 overflow-hidden rounded-3xl border-2 border-sky-200/60 bg-neutral-100/80 shadow-inner">
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-600 to-sky-400"
              initial={false}
              animate={{ height: `${Math.max(4, gaugePct)}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Gauge className="h-8 w-8 text-white/40" strokeWidth={1.5} />
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] font-bold text-neutral-400">
            Tank Level · {gaugePct}%
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function DieselFormTabs({ activeTab, onChange }) {
  const tabs = [
    { id: TAB_PURCHASE, label: T.tabPurchase, labelEn: T.tabPurchaseEn, icon: PackagePlus },
    { id: TAB_CONSUME, label: T.tabConsume, labelEn: T.tabConsumeEn, icon: Droplets },
  ];

  return (
    <div className="mb-6 flex rounded-2xl bg-neutral-200/50 p-1.5">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-3 sm:flex-row sm:justify-center sm:gap-2 ${
              active ? "text-neutral-950" : "text-neutral-500"
            }`}
          >
            {active ? (
              <motion.span
                layoutId="dieselTabPill"
                className="absolute inset-0 rounded-xl bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              <span className="text-xs font-bold sm:text-sm" lang="si">
                {tab.label}
              </span>
              <span className="hidden text-[10px] font-semibold text-neutral-400 sm:inline">
                ({tab.labelEn})
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LedgerTabs({ active, onChange, purchaseCount, usageCount }) {
  const tabs = [
    { id: LEDGER_PURCHASES, label: T.ledgerPurchases, count: purchaseCount },
    { id: LEDGER_USAGE, label: T.ledgerUsage, count: usageCount },
  ];

  return (
    <div className="mb-4 flex rounded-2xl bg-neutral-200/50 p-1">
      {tabs.map((tab) => {
        const on = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold ${
              on ? "text-neutral-950" : "text-neutral-500"
            }`}
          >
            {on ? (
              <motion.span
                layoutId="dieselLedgerPill"
                className="absolute inset-0 rounded-xl bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10" lang="si">
              {tab.label}
            </span>
            <span
              className={`relative z-10 rounded-full px-2 py-0.5 text-[10px] font-black ${
                on ? "bg-neutral-950 text-white" : "bg-neutral-300/80 text-neutral-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PurchaseRow({ row, onDelete }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
        <PackagePlus className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-neutral-950">
          +{moneyPlain(row.liters_added)} L @ Rs. {moneyPlain(row.cost_per_liter)}
        </p>
        <p className="mt-1 text-xs font-bold text-emerald-700">
          {moneyFullLkr(row.total_cost)}
        </p>
        <p className="mt-1 text-[10px] font-semibold text-neutral-400">{row.purchased_at}</p>
      </div>
      <button type="button" onClick={() => onDelete(row)} className={ICON_BTN} aria-label={T.deletePurchaseConfirm}>
        <Trash2 className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </motion.li>
  );
}

function UsageRow({ row, tripLabel, onDelete }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
          <Droplets className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          {row.vehicle ? <SriLankanPlateBadge vehicle={row.vehicle} /> : null}
          <p className="mt-2 text-sm font-bold text-neutral-900">
            {moneyPlain(row.liters_issued)} L → {moneyFullLkr(row.total_diesel_cost)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-neutral-500">
            {T.mappedTrip}: {tripLabel}
          </p>
          <p className="text-[10px] font-semibold text-neutral-400">
            {new Date(row.issued_at).toLocaleString("si-LK")}
          </p>
        </div>
      </div>
      <button type="button" onClick={() => onDelete(row)} className={ICON_BTN} aria-label={T.deleteUsageConfirm}>
        <Trash2 className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </motion.li>
  );
}

async function detectLoadTable() {
  const { error } = await supabase.from(TABLE_LOADS).select("id").limit(1);
  if (!error) return TABLE_LOADS;
  if (isMissingTableError(error)) return TABLE_TRIPS;
  throw error;
}

async function updateTripFuel(table, tripId, liters, cost) {
  if (table === TABLE_HIRES) {
    const { error } = await supabase
      .from(TABLE_HIRES)
      .update({ diesel_cost: cost })
      .eq("id", tripId);
    if (error) throw error;
    return;
  }

  const payload = { diesel_cost: cost, diesel_liters: liters };
  const { error: loadsErr } = await supabase.from(table).update(payload).eq("id", tripId);
  if (!loadsErr) return;
  if (table === TABLE_LOADS && isMissingTableError(loadsErr)) {
    const { error: tripsErr } = await supabase.from(TABLE_TRIPS).update(payload).eq("id", tripId);
    if (tripsErr) throw tripsErr;
    return;
  }
  throw loadsErr;
}

async function clearTripFuel(table, tripId) {
  return updateTripFuel(table, tripId, 0, 0);
}

async function persistStock(stock) {
  const { data, error } = await supabase
    .from("diesel_stock")
    .upsert(
      {
        id: STOCK_ID,
        total_liters: stock.total_liters,
        avg_cost_per_liter: stock.avg_cost_per_liter,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapStock(data);
}

export default function DieselPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formTab, setFormTab] = useState(TAB_PURCHASE);
  const [ledgerTab, setLedgerTab] = useState(LEDGER_USAGE);
  const [stock, setStock] = useState({ id: STOCK_ID, total_liters: 0, avg_cost_per_liter: 0, updated_at: "" });
  const [purchases, setPurchases] = useState([]);
  const [usage, setUsage] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tripOptions, setTripOptions] = useState([]);
  const [loadTable, setLoadTable] = useState(TABLE_TRIPS);
  const [purchaseForm, setPurchaseForm] = useState(() => ({
    ...INITIAL_PURCHASE_FORM,
    purchased_at: todayDateValue(),
  }));
  const [consumeForm, setConsumeForm] = useState(INITIAL_CONSUME_FORM);

  const vehiclesById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const sortedVehicles = useMemo(
    () => [...vehicles].sort((a, b) => plateSortKey(a).localeCompare(plateSortKey(b), "si")),
    [vehicles]
  );

  const purchasePreviewTotal = useMemo(() => {
    return toNum(purchaseForm.liters_added) * toNum(purchaseForm.cost_per_liter);
  }, [purchaseForm.liters_added, purchaseForm.cost_per_liter]);

  const filteredTripOptions = useMemo(
    () => tripOptions.filter((o) => o.trip_type === consumeForm.trip_type),
    [tripOptions, consumeForm.trip_type]
  );

  const tripLabelByKey = useMemo(() => {
    const m = new Map();
    for (const o of tripOptions) {
      m.set(`${o.table}:${o.id}`, o.label);
    }
    return m;
  }, [tripOptions]);

  const refresh = useCallback(async () => {
    const detectedLoadTable = await detectLoadTable();
    setLoadTable(detectedLoadTable);

    const [stockRes, purchRes, usageRes, vehRes, tripsRes, hiresRes] = await Promise.all([
      supabase.from("diesel_stock").select("*").eq("id", STOCK_ID).maybeSingle(),
      supabase.from("diesel_purchases").select("*").order("purchased_at", { ascending: false }),
      supabase
        .from("diesel_usage")
        .select("*")
        .order("issued_at", { ascending: false }),
      supabase
        .from("vehicles")
        .select("id, province_code, series_code, sequence_number")
        .order("created_at", { ascending: false }),
      supabase
        .from(detectedLoadTable)
        .select("id, trip_reference, lorry_number, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from(TABLE_HIRES)
        .select("id, hire_reference, lorry_number, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    if (stockRes.error && !isMissingTableError(stockRes.error)) throw stockRes.error;
    if (purchRes.error) throw purchRes.error;
    if (usageRes.error) throw usageRes.error;
    if (vehRes.error) throw vehRes.error;
    if (tripsRes.error && !isMissingTableError(tripsRes.error)) throw tripsRes.error;
    if (hiresRes.error) throw hiresRes.error;

    const stockRow = stockRes.data
      ? mapStock(stockRes.data)
      : { id: STOCK_ID, total_liters: 0, avg_cost_per_liter: 0, updated_at: new Date().toISOString() };

    const vehList = (vehRes.data ?? []).map(mapVehicle);
    const usageList = (usageRes.data ?? []).map((r) => mapUsage(r, new Map(vehList.map((v) => [v.id, v]))));

    const options = [];
    for (const row of tripsRes.data ?? []) {
      options.push(mapTripOption(row, detectedLoadTable));
    }
    for (const row of hiresRes.data ?? []) {
      options.push(mapTripOption(row, TABLE_HIRES));
    }

    setStock(stockRow);
    setPurchases((purchRes.data ?? []).map(mapPurchase));
    setUsage(usageList);
    setVehicles(vehList);
    setTripOptions(options);

    setConsumeForm((prev) => {
      const typeOpts = options.filter((o) => o.trip_type === prev.trip_type);
      const validTrip = typeOpts.some((o) => o.id === prev.trip_target_id);
      const validVeh = vehList.some((v) => v.id === prev.vehicle_id);
      return {
        ...prev,
        vehicle_id: validVeh ? prev.vehicle_id : vehList[0]?.id ?? "",
        trip_target_id: validTrip ? prev.trip_target_id : typeOpts[0]?.id ?? "",
      };
    });
  }, []);

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

  const handlePurchase = async (ev) => {
    ev.preventDefault();
    const liters = toNum(purchaseForm.liters_added);
    const costPer = toNum(purchaseForm.cost_per_liter);
    const date = String(purchaseForm.purchased_at ?? "").trim() || todayDateValue();

    if (liters <= 0) {
      setError(T.litersRequired);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const totalCost = Math.round(liters * costPer * 100) / 100;
      const newLiters = stock.total_liters + liters;
      const newAvg = computeWacCostPerLiter(
        stock.total_liters,
        stock.avg_cost_per_liter,
        liters,
        costPer
      );

      const { data: purchRow, error: purchErr } = await supabase
        .from("diesel_purchases")
        .insert({
          liters_added: liters,
          cost_per_liter: costPer,
          total_cost: totalCost,
          purchased_at: date,
        })
        .select("*")
        .single();
      if (purchErr) throw purchErr;

      const updatedStock = await persistStock({
        total_liters: newLiters,
        avg_cost_per_liter: newAvg,
      });

      setStock(updatedStock);
      setPurchases((prev) => [mapPurchase(purchRow), ...prev]);
      setPurchaseForm({ ...INITIAL_PURCHASE_FORM, purchased_at: todayDateValue() });
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConsume = async (ev) => {
    ev.preventDefault();
    const liters = toNum(consumeForm.liters_issued);
    const vehId = consumeForm.vehicle_id;
    const tripId = consumeForm.trip_target_id;
    const tripType = consumeForm.trip_type;

    if (!vehId) {
      setError(T.noVehicles);
      return;
    }
    if (!tripId) {
      setError(T.selectTripRequired);
      return;
    }
    if (liters <= 0) {
      setError(T.litersRequired);
      return;
    }
    if (liters > stock.total_liters) {
      setError(`${T.insufficientFuel} ${moneyPlain(stock.total_liters)} L`);
      return;
    }

    const tripTable = tripType === TRIP_HIRE ? TABLE_HIRES : loadTable;

    setSaving(true);
    setError("");
    try {
      const costPer = stock.avg_cost_per_liter;
      const totalCost = Math.round(liters * costPer * 100) / 100;
      const newLiters = stock.total_liters - liters;
      const now = new Date().toISOString();

      await updateTripFuel(tripTable, tripId, liters, totalCost);

      const { data: usageRow, error: usageErr } = await supabase
        .from("diesel_usage")
        .insert({
          vehicle_id: vehId,
          liters_issued: liters,
          cost_per_liter_at_issue: costPer,
          total_diesel_cost: totalCost,
          trip_type: tripType,
          trip_table: tripTable,
          trip_target_id: tripId,
          issued_at: now,
        })
        .select("*")
        .single();
      if (usageErr) throw usageErr;

      const updatedStock = await persistStock({
        total_liters: newLiters,
        avg_cost_per_liter: stock.avg_cost_per_liter,
      });

      const mapped = mapUsage(usageRow, vehiclesById);
      setStock(updatedStock);
      setUsage((prev) => [mapped, ...prev]);
      setConsumeForm((f) => ({ ...f, liters_issued: "" }));
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePurchase = async (row) => {
    if (!window.confirm(T.deletePurchaseConfirm)) return;
    setError("");
    try {
      const reversed = reverseWacAfterRemovingBatch(
        stock.total_liters,
        stock.avg_cost_per_liter,
        row.liters_added,
        row.cost_per_liter
      );
      const newLiters = Math.max(0, reversed.liters);

      const { error: delErr } = await supabase
        .from("diesel_purchases")
        .delete()
        .eq("id", row.id);
      if (delErr) throw delErr;

      const updatedStock = await persistStock({
        total_liters: newLiters,
        avg_cost_per_liter: reversed.avg,
      });

      setStock(updatedStock);
      setPurchases((prev) => prev.filter((p) => p.id !== row.id));
    } catch (err) {
      setError(dbError(err));
    }
  };

  const handleDeleteUsage = async (row) => {
    if (!window.confirm(T.deleteUsageConfirm)) return;
    setError("");
    try {
      await clearTripFuel(row.trip_table, row.trip_target_id);

      const restoredLiters = stock.total_liters + row.liters_issued;
      const restoredAvg = computeWacCostPerLiter(
        stock.total_liters,
        stock.avg_cost_per_liter,
        row.liters_issued,
        row.cost_per_liter_at_issue
      );

      const { error: delErr } = await supabase.from("diesel_usage").delete().eq("id", row.id);
      if (delErr) throw delErr;

      const updatedStock = await persistStock({
        total_liters: restoredLiters,
        avg_cost_per_liter: restoredAvg,
      });

      setStock(updatedStock);
      setUsage((prev) => prev.filter((u) => u.id !== row.id));
    } catch (err) {
      setError(dbError(err));
    }
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
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="space-y-8">
          <TankGauge stock={stock} />

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start">
            <section className={CARD}>
              <DieselFormTabs activeTab={formTab} onChange={setFormTab} />

              <AnimatePresence mode="wait">
                {formTab === TAB_PURCHASE ? (
                  <motion.form
                    key="purchase"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handlePurchase}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                          {T.litersAdded}
                        </span>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={purchaseForm.liters_added}
                          onChange={(e) =>
                            setPurchaseForm((f) => ({ ...f, liters_added: e.target.value }))
                          }
                          className={INPUT}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                          {T.costPerLiter}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={purchaseForm.cost_per_liter}
                          onChange={(e) =>
                            setPurchaseForm((f) => ({ ...f, cost_per_liter: e.target.value }))
                          }
                          className={INPUT}
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                        {T.purchaseDate}
                      </span>
                      <input
                        type="date"
                        value={purchaseForm.purchased_at}
                        onChange={(e) =>
                          setPurchaseForm((f) => ({ ...f, purchased_at: e.target.value }))
                        }
                        className={INPUT}
                      />
                    </label>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/80" lang="si">
                        {T.totalCost}
                      </p>
                      <p className="mt-1 text-xl font-black text-emerald-800">
                        {moneyFullLkr(purchasePreviewTotal)}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-neutral-500" lang="si">
                        Average cost per liter updates using WAC
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-black text-white transition hover:bg-neutral-800 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <PackagePlus className="h-5 w-5" strokeWidth={2.2} />
                      )}
                      <span lang="si">{T.savePurchase}</span>
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="consume"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleConsume}
                    className="space-y-4"
                  >
                    {vehicles.length === 0 ? (
                      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900" lang="si">
                        {T.noVehicles}
                      </p>
                    ) : null}

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                        {T.selectVehicle}
                      </span>
                      <select
                        value={consumeForm.vehicle_id}
                        onChange={(e) =>
                          setConsumeForm((f) => ({ ...f, vehicle_id: e.target.value }))
                        }
                        className={`${INPUT} font-mono text-sm`}
                        disabled={vehicles.length === 0}
                      >
                        {sortedVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {formatPlateDisplay(v)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                        {T.litersIssued}
                      </span>
                      <input
                        type="number"
                        min={0.01}
                        max={stock.total_liters || undefined}
                        step="0.01"
                        value={consumeForm.liters_issued}
                        onChange={(e) =>
                          setConsumeForm((f) => ({ ...f, liters_issued: e.target.value }))
                        }
                        className={INPUT}
                        disabled={vehicles.length === 0}
                      />
                      <p className="mt-2 text-[10px] font-semibold text-neutral-500">
                        {T.currentStock}: {moneyPlain(stock.total_liters)} L · @ Rs.{" "}
                        {moneyPlain(stock.avg_cost_per_liter)}/L
                      </p>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                        {T.tripType}
                      </span>
                      <select
                        value={consumeForm.trip_type}
                        onChange={(e) => {
                          const trip_type = e.target.value;
                          const first = tripOptions.find((o) => o.trip_type === trip_type);
                          setConsumeForm((f) => ({
                            ...f,
                            trip_type,
                            trip_target_id: first?.id ?? "",
                          }));
                        }}
                        className={INPUT}
                      >
                        <option value={TRIP_LOAD}>{T.tripLoad}</option>
                        <option value={TRIP_HIRE}>{T.tripHire}</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                        {T.selectTrip}
                      </span>
                      <select
                        value={consumeForm.trip_target_id}
                        onChange={(e) =>
                          setConsumeForm((f) => ({ ...f, trip_target_id: e.target.value }))
                        }
                        className={INPUT}
                      >
                        {filteredTripOptions.length === 0 ? (
                          <option value="">{T.selectTripRequired}</option>
                        ) : (
                          filteredTripOptions.map((o) => (
                            <option key={`${o.table}-${o.id}`} value={o.id}>
                              {o.label}
                            </option>
                          ))
                        )}
                      </select>
                      <p className="mt-2 text-[10px] font-semibold text-neutral-500">
                        {T.tripId}:{" "}
                        <span className="font-mono font-bold text-neutral-700">
                          {consumeForm.trip_target_id || "—"}
                        </span>
                      </p>
                    </label>

                    <button
                      type="submit"
                      disabled={saving || vehicles.length === 0 || !consumeForm.trip_target_id}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-black text-white transition hover:bg-neutral-800 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Droplets className="h-5 w-5" strokeWidth={2.2} />
                      )}
                      <span lang="si">{T.saveConsume}</span>
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </section>

            <section className={`${CARD} flex max-h-[min(640px,62vh)] flex-col`}>
              <div className="mb-2 flex items-center gap-2">
                <History className="h-5 w-5 text-neutral-700" strokeWidth={2.2} />
                <h2 className="text-lg font-black text-neutral-950">Ledger</h2>
              </div>

              <LedgerTabs
                active={ledgerTab}
                onChange={setLedgerTab}
                purchaseCount={purchases.length}
                usageCount={usage.length}
              />

              <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {ledgerTab === LEDGER_PURCHASES ? (
                    purchases.length === 0 ? (
                      <p className="py-12 text-center text-sm font-bold text-neutral-400" lang="si">
                        {T.emptyPurchases}
                      </p>
                    ) : (
                      purchases.map((row) => (
                        <PurchaseRow key={row.id} row={row} onDelete={handleDeletePurchase} />
                      ))
                    )
                  ) : usage.length === 0 ? (
                    <p className="py-12 text-center text-sm font-bold text-neutral-400" lang="si">
                      {T.emptyUsage}
                    </p>
                  ) : (
                    usage.map((row) => (
                      <UsageRow
                        key={row.id}
                        row={row}
                        tripLabel={
                          tripLabelByKey.get(`${row.trip_table}:${row.trip_target_id}`) ??
                          `${row.trip_table} · ${row.trip_target_id.slice(0, 8)}`
                        }
                        onDelete={handleDeleteUsage}
                      />
                    ))
                  )}
                </AnimatePresence>
              </ul>
            </section>
          </div>
        </div>
      )}
    </motion.main>
  );
}
