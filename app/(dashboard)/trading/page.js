"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Warehouse,
  Coins,
  Truck,
  User,
  Users,
  MapPin,
  TrendingUp,
  Package,
  ArrowUpRight,
  Pencil,
  Trash2,
  Plus,
  X,
  ChevronDown,
  Search,
} from "lucide-react";

const ROLE_DRIVER = "driver";
const ROLE_HELPER = "helper";

const WAREHOUSE_OPTIONS = [
  "Warehouse 01",
  "Warehouse 02",
  "Warehouse 03",
  "Warehouse 04",
  "Warehouse 05",
  "Warehouse 06",
];

// ─── Database trip types (Supabase check constraint) ───────────────────────────
const DB_INWARD = "බඩු ගේන්න";
const DB_OUTWARD = "බඩු බාන්න";
const PADDY_WEE = "වී";
const PADDY_MAIZE = "බඩඉරිඟු";

// ─── UI copy (Sinhala only, short) ───────────────────────────────────────────
const T = {
  pageTitle: "Trip Management",
  tabReports: "📊 All Reports",
  tabNew: "➕ New Entry",
  statInventory: "Warehouse Stock Board",
  colWarehouse: "Warehouse",
  colWeeStock: "Paddy Stock",
  colMaizeStock: "Maize Stock",
  noWarehouses: "No warehouses",
  statOutwardCount: "Total Dispatched Loads",
  statTotalProfit: "Total Profit Earned",
  switchInward: "🌾 Load Inward",
  switchOutward: "🚛 Load Outward",
  badgeInward: "🌾 Inward Load (to warehouse)",
  badgeOutward: "🚛 Outward Load (for sale)",
  tripType: "Trip Type",
  sectionBasic: "Basic Details",
  sectionStock: "Stock Details",
  sectionExpenses: "Trip Expenses",
  lorry: "Lorry Number",
  paddy: "Paddy Type",
  warehouse: "Warehouse",
  driver: "Driver",
  helpers: "Helpers",
  buyer: "Buyer",
  totalKg: "Total Kilograms",
  weight: "Total Weight",
  priceKg: "Price per Kg",
  startKm: "Start KM",
  endKm: "End KM",
  dieselL: "Diesel Liters",
  dieselCost: "Diesel Cost",
  driverWage: "Driver Wage",
  helperWage: "Helper Wage",
  extraCost: "Additional Cost",
  costs: "Total Costs",
  investment: "Total Investment",
  netProfit: "Net Profit",
  netLoss: "Net Loss",
  save: "Save Entry",
  update: "Update Entry",
  filterAll: "All",
  filterInward: "🌾 Inward",
  filterOutward: "🚛 Outward",
  empty: "No records",
  confirmDelete: "Do you want to permanently delete this record?",
};

const INITIAL_FORM = {
  trip_type: DB_INWARD,
  paddy_type: PADDY_WEE,
  warehouse_name: "",
  lorry_number: "",
  driver_name: "",
  helper_names: "",
  total_kg: "",
  price_per_kg: "",
  start_km: "",
  end_km: "",
  diesel_liters: "",
  diesel_cost: "",
  driver_wage: "",
  helper_wage: "",
  road_expenses: "",
  buyer_name: "",
};

const INPUT =
  "w-full bg-[#F5F5F7] border-0 rounded-xl px-4 py-3 text-[15px] text-neutral-950 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all outline-none";

const cardHoverMotion = {
  y: -6,
  scale: 1.01,
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

// ─── Supabase ────────────────────────────────────────────────────────────────
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

/** @param {unknown} v */
function toNum(v) {
  if (v == null || String(v).trim() === "") return 0;
  const n = parseFloat(String(v).trim());
  return Number.isNaN(n) ? 0 : n;
}

/** @param {unknown} type */
function isInward(type) {
  const s = String(type ?? "").trim();
  return s === DB_INWARD || s === "Inward" || s.toLowerCase() === "inward";
}

/** @param {unknown} type */
function isOutward(type) {
  const s = String(type ?? "").trim();
  return s === DB_OUTWARD || s === "Outward" || s.toLowerCase() === "outward";
}

/** @param {unknown} type */
function normalizeTripType(type) {
  return isOutward(type) ? DB_OUTWARD : DB_INWARD;
}

/** @param {unknown} value */
function isMaizePaddy(value) {
  const s = String(value ?? "").trim();
  return (
    s === PADDY_MAIZE ||
    s === "Maize" ||
    s.toLowerCase() === "maize" ||
    s.includes("බඩ")
  );
}

/** Preserve custom paddy labels; normalize only legacy maize detection for display fallbacks */
function normalizePaddyType(value) {
  const s = String(value ?? "").trim();
  if (!s) return PADDY_WEE;
  if (isMaizePaddy(s)) return PADDY_MAIZE;
  return s;
}

/** @param {Record<string, unknown>} row */
function mapTrip(row) {
  return {
    id: String(row.id),
    trip_reference: row.trip_reference ? String(row.trip_reference) : "",
    trip_type: normalizeTripType(row.trip_type),
    paddy_type: String(row.paddy_type ?? PADDY_WEE).trim() || PADDY_WEE,
    warehouse_name: String(row.warehouse_name ?? "").trim(),
    buyer_name: row.buyer_name != null ? String(row.buyer_name).trim() : "",
    lorry_number: String(row.lorry_number ?? "").trim(),
    driver_name: String(row.driver_name ?? "").trim(),
    helper_names: String(row.helper_names ?? "").trim(),
    total_kg: Number(row.total_kg ?? 0),
    price_per_kg: Number(row.price_per_kg ?? 0),
    start_km: Number(row.start_km ?? 0),
    end_km: Number(row.end_km ?? 0),
    diesel_liters: Number(row.diesel_liters ?? 0),
    diesel_cost: Number(row.diesel_cost ?? row.fuel_cost ?? 0),
    driver_wage: Number(row.driver_wage ?? 0),
    helper_wage: Number(row.helper_wage ?? 0),
    road_expenses: Number(row.road_expenses ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

/** @param {ReturnType<mapTrip>} trip */
function finance(trip) {
  const goods = trip.total_kg * trip.price_per_kg;
  const logistics =
    trip.diesel_cost + trip.driver_wage + trip.helper_wage + trip.road_expenses;
  const outward = isOutward(trip.trip_type);
  return {
    goods,
    logistics,
    investment: goods + logistics,
    netProfit: outward ? goods - logistics : 0,
    outward,
  };
}

const MAX_WAREHOUSES = 6;

/**
 * @param {ReturnType<mapTrip>[]} trips
 * @returns {{ name: string, weeKg: number, maizeKg: number }[]}
 */
function buildWarehouseInventory(trips) {
  /** @type {Map<string, { weeIn: number, weeOut: number, maizeIn: number, maizeOut: number }>} */
  const map = new Map();

  for (const t of trips) {
    const name = String(t.warehouse_name ?? "").trim();
    if (!name) continue;

    if (!map.has(name)) {
      map.set(name, { weeIn: 0, weeOut: 0, maizeIn: 0, maizeOut: 0 });
    }
    const row = map.get(name);
    const maize = isMaizePaddy(t.paddy_type);
    const kgAmt = t.total_kg;

    if (isInward(t.trip_type)) {
      if (maize) row.maizeIn += kgAmt;
      else row.weeIn += kgAmt;
    } else if (isOutward(t.trip_type)) {
      if (maize) row.maizeOut += kgAmt;
      else row.weeOut += kgAmt;
    }
  }

  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      weeKg: v.weeIn - v.weeOut,
      maizeKg: v.maizeIn - v.maizeOut,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "si"))
    .slice(0, MAX_WAREHOUSES);
}

/** @param {ReturnType<mapTrip>[]} trips */
function dashboardStats(trips) {
  let outwardCount = 0;
  let totalProfit = 0;

  for (const t of trips) {
    if (isOutward(t.trip_type)) {
      outwardCount += 1;
      totalProfit += finance(t).netProfit;
    }
  }

  return { outwardLoadCount: outwardCount, totalProfit };
}

async function nextTripRef() {
  const prefix = `TRIP-${new Date().getFullYear()}-`;
  const { data, error } = await supabase
    .from("trips")
    .select("trip_reference")
    .ilike("trip_reference", `${prefix}%`);
  if (error) return `${prefix}${Date.now()}`;
  const nums = (data ?? [])
    .map((r) => {
      const m = String(r.trip_reference).match(/TRIP-\d{4}-(\d+)$/i);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/** @param {typeof INITIAL_FORM} form */
function insertPayload(form) {
  const outward = isOutward(form.trip_type);
  return {
    trip_type: normalizeTripType(form.trip_type),
    paddy_type: String(form.paddy_type ?? "").trim() || PADDY_WEE,
    warehouse_name: String(form.warehouse_name ?? "").trim(),
    buyer_name: outward && String(form.buyer_name ?? "").trim()
      ? String(form.buyer_name).trim()
      : null,
    lorry_number: String(form.lorry_number ?? "").trim(),
    driver_name: String(form.driver_name ?? "").trim(),
    helper_names: String(form.helper_names ?? "").trim(),
    total_kg: toNum(form.total_kg),
    price_per_kg: toNum(form.price_per_kg),
    start_km: toNum(form.start_km),
    end_km: toNum(form.end_km),
    diesel_liters: toNum(form.diesel_liters),
    diesel_cost: toNum(form.diesel_cost),
    driver_wage: toNum(form.driver_wage),
    helper_wage: toNum(form.helper_wage),
    road_expenses: toNum(form.road_expenses),
  };
}

async function loadTrips() {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase Fetch Error Detailed:", error);
    throw new Error(dbError(error));
  }
  return (data ?? []).map(mapTrip);
}

async function loadStaffLists() {
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, role")
    .order("name", { ascending: true });
  if (error) {
    console.error("Supabase Staff Fetch Error:", error);
    throw new Error(dbError(error));
  }
  const rows = data ?? [];
  return {
    drivers: rows.filter((r) => String(r.role ?? "").trim() === ROLE_DRIVER),
    helpers: rows.filter((r) => String(r.role ?? "").trim() === ROLE_HELPER),
  };
}

async function loadDistinctPaddyTypes() {
  const { data, error } = await supabase.from("trips").select("paddy_type");
  if (error) {
    console.error("Supabase Paddy Types Fetch Error:", error);
    throw new Error(dbError(error));
  }
  const set = new Set([PADDY_WEE, PADDY_MAIZE]);
  for (const row of data ?? []) {
    const v = String(row.paddy_type ?? "").trim();
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "si"));
}

/** @param {typeof INITIAL_FORM} form */
async function saveTrip(form) {
  const trip_reference = await nextTripRef();
  const payload = { trip_reference, ...insertPayload(form) };
  let { data, error } = await supabase.from("trips").insert(payload).select().single();
  if (error?.code === "23505") {
    ({ data, error } = await supabase
      .from("trips")
      .insert({ ...payload, trip_reference: `TRIP-${Date.now()}` })
      .select()
      .single());
  }
  if (error) {
    console.error("Supabase Insert Error Detailed:", error, payload);
    throw new Error(dbError(error));
  }
  if (!data) throw new Error("Entry was not saved");
  return mapTrip(data);
}

/** @param {string} id @param {typeof INITIAL_FORM} form */
async function updateTrip(id, form) {
  const payload = insertPayload(form);
  const { data, error } = await supabase
    .from("trips")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Supabase Update Error Detailed:", error, payload);
    throw new Error(dbError(error));
  }
  if (!data) throw new Error("Update failed");
  return mapTrip(data);
}

/** @param {string} id */
async function deleteTripById(id) {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) {
    console.error("Supabase Delete Error Detailed:", error);
    throw new Error(dbError(error));
  }
}

/** @param {unknown} str */
function parseHelpers(str) {
  if (!str || !String(str).trim()) return [];
  return String(str)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** @param {string[]} helpers */
function joinHelpers(helpers) {
  return helpers.map((s) => s.trim()).filter(Boolean).join(", ");
}

/** @param {ReturnType<mapTrip>} trip */
function tripToForm(trip) {
  const str = (n) => (n === 0 ? "" : String(n));
  return {
    trip_type: trip.trip_type,
    paddy_type: trip.paddy_type,
    warehouse_name: trip.warehouse_name,
    lorry_number: trip.lorry_number,
    driver_name: trip.driver_name,
    helper_names: "",
    total_kg: str(trip.total_kg),
    price_per_kg: str(trip.price_per_kg),
    start_km: str(trip.start_km),
    end_km: str(trip.end_km),
    diesel_liters: str(trip.diesel_liters),
    diesel_cost: str(trip.diesel_cost),
    driver_wage: str(trip.driver_wage),
    helper_wage: str(trip.helper_wage),
    road_expenses: str(trip.road_expenses),
    buyer_name: trip.buyer_name ?? "",
  };
}

function money(n) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
}

function kg(n) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(n);
}

/** @param {string | null | undefined} value */
function formatHistoryDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

// ─── Inline UI ─────────────────────────────────────────────────────────────────
function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[13px] font-semibold text-neutral-950" lang="si">
        {label}
      </label>
      {children}
    </div>
  );
}

const COMBO_PANEL =
  "absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.1)]";

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {import('lucide-react').LucideIcon} [props.icon]
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {{ value: string, label: string, sub?: string }[]} props.options
 * @param {string} [props.placeholder]
 * @param {string} [props.className]
 */
function SearchableCombobox({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sub && o.sub.toLowerCase().includes(q))
    );
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev) => {
      if (wrapRef.current && !wrapRef.current.contains(ev.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const inner = (
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`${INPUT} flex w-full items-center justify-between gap-2 text-left ${
            Icon ? "pl-10" : ""
          }`}
        >
          {Icon ? (
            <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          ) : null}
          <span
            className={`min-w-0 flex-1 truncate ${
              selected ? "font-semibold text-neutral-950" : "text-neutral-400"
            }`}
            lang="si"
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={COMBO_PANEL}
            >
              <div className="border-b border-neutral-100 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(ev) => setQuery(ev.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-xl bg-[#F5F5F7] py-2.5 pl-9 pr-3 text-sm font-semibold text-neutral-950 outline-none ring-0 focus:bg-white focus:ring-2 focus:ring-neutral-950"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>
              <ul className="max-h-52 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-sm font-medium text-neutral-400" lang="si">
                    No matches found
                  </li>
                ) : (
                  filtered.map((opt) => {
                    const active = opt.value === value;
                    return (
                      <li key={opt.value}>
                        <button
                          type="button"
                          onClick={() => {
                            onChange(opt.value);
                            setOpen(false);
                            setQuery("");
                          }}
                          className={`flex w-full flex-col px-4 py-2.5 text-left transition-colors ${
                            active
                              ? "bg-[#E8F5E9] text-[#1B5E20]"
                              : "text-neutral-900 hover:bg-neutral-50"
                          }`}
                        >
                          <span className="text-sm font-bold" lang="si">
                            {opt.label}
                          </span>
                          {opt.sub ? (
                            <span className="text-[11px] font-medium text-neutral-500">
                              {opt.sub}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
  );

  if (!label) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <Field label={label} className={className}>
      {inner}
    </Field>
  );
}

/**
 * @param {Object} props
 * @param {string[]} props.helpers
 * @param {{ id: string, name: string }[]} props.staffHelpers
 * @param {(name: string) => void} props.onAdd
 * @param {(index: number) => void} props.onRemove
 */
function HelpersField({ helpers, staffHelpers, onAdd, onRemove }) {
  const helperOptions = useMemo(
    () =>
      staffHelpers.map((s) => ({
        value: s.name,
        label: s.name,
        sub: "Helper / Crew",
      })),
    [staffHelpers]
  );

  return (
    <Field label={T.helpers} className="sm:col-span-2">
      <SearchableCombobox
        label=""
        icon={Users}
        value=""
        onChange={(name) => {
          if (name) onAdd(name);
        }}
        options={helperOptions.filter(
          (o) => !helpers.some((h) => h.toLowerCase() === o.value.toLowerCase())
        )}
        placeholder="Select a helper..."
      />
      {helpers.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {helpers.map((name, index) => (
            <span
              key={`${name}-${index}`}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-sm font-bold text-neutral-900"
            >
              <span lang="si">{name}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-full p-0.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-[#E65100]"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </Field>
  );
}

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(v: string) => void} props.onChange
 * @param {string[]} props.types
 * @param {(name: string) => void} props.onAddType
 */
function PaddyTypeField({ value, onChange, types, onAddType }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const confirmAdd = () => {
    const name = draft.trim();
    if (!name) return;
    onAddType(name);
    onChange(name);
    setDraft("");
    setAdding(false);
  };

  return (
    <Field label={T.paddy}>
      <div className="flex max-w-lg flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <Package className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <select
            name="paddy_type"
            value={value}
            onChange={(ev) => onChange(ev.target.value)}
            className={`${INPUT} appearance-none pl-10 pr-10 font-bold`}
            lang="si"
          >
            {types.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
        <button
          type="button"
          onClick={() => {
            setAdding((a) => !a);
            setDraft("");
          }}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-[#2E7D32] shadow-sm transition-all hover:border-[#A5D6A7] hover:bg-[#E8F5E9] active:scale-95"
          aria-label="Add new paddy type"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
      <AnimatePresence>
        {adding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex gap-2 rounded-2xl border border-[#A5D6A7] bg-[#E8F5E9]/50 p-3">
              <input
                type="text"
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    confirmAdd();
                  }
                }}
                placeholder="New paddy type..."
                className={`${INPUT} flex-1 bg-white`}
                lang="si"
                autoFocus
              />
              <button
                type="button"
                onClick={confirmAdd}
                className="rounded-xl bg-[#2E7D32] px-4 py-2 text-xs font-black text-white"
                lang="si"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-neutral-600"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Field>
  );
}

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(v: string) => void} props.onChange
 */
function WarehouseSelect({ value, onChange }) {
  return (
    <Field label={T.warehouse}>
      <div className="relative">
        <Warehouse className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <select
          name="warehouse_name"
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          className={`${INPUT} appearance-none pl-10 pr-10 font-bold`}
          lang="si"
        >
          <option value="" disabled>
            Select warehouse
          </option>
          {WAREHOUSE_OPTIONS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
    </Field>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-neutral-200/70" />
        <p className="shrink-0 text-[13px] font-bold text-neutral-950" lang="si">
          {title}
        </p>
        <div className="h-px flex-1 bg-neutral-200/70" />
      </div>
      {children}
    </section>
  );
}

/** @param {number} kgVal */
function StockKgCell({ kgVal }) {
  if (kgVal === 0) {
    return <span className="text-[13px] font-semibold text-neutral-300 tabular-nums">0 KG</span>;
  }
  const negative = kgVal < 0;
  return (
    <span
      className={`text-[13px] font-bold tabular-nums ${
        negative ? "text-[#E65100]" : "text-[#2E7D32]"
      }`}
    >
      {kg(kgVal)} KG
    </span>
  );
}

/** @param {{ name: string, weeKg: number, maizeKg: number }[]} rows */
function StockInventoryBoard({ rows, loading }) {
  return (
    <motion.div
      whileHover={cardHoverMotion}
      className="min-h-[180px] min-w-0 overflow-visible rounded-[28px] border border-[#A5D6A7] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.02)] ring-1 ring-[#E8F5E9] transition-shadow duration-300"
    >
      <p className="text-[13px] font-bold text-[#2E7D32]" lang="si">
        {T.statInventory}
      </p>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-[#F5F5F7]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-center text-[14px] font-medium text-neutral-400" lang="si">
          {T.noWarehouses}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-100">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 bg-[#F5F5F7] px-3 py-2.5 text-[11px] font-bold text-neutral-500">
            <span lang="si">{T.colWarehouse}</span>
            <span className="text-right" lang="si">
              {T.colWeeStock}
            </span>
            <span className="text-right" lang="si">
              {T.colMaizeStock}
            </span>
          </div>
          <ul className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <li
                key={row.name}
                className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 px-3 py-3 transition-colors hover:bg-[#FAFAFA]"
              >
                <span className="truncate text-[14px] font-bold text-neutral-800" lang="si">
                  {row.name}
                </span>
                <span className="text-right">
                  <StockKgCell kgVal={row.weeKg} />
                </span>
                <span className="text-right">
                  <StockKgCell kgVal={row.maizeKg} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ title, value, sub, accent, className = "" }) {
  const styles = {
    green: "border-[#C8E6C9]/80 bg-white ring-1 ring-[#E8F5E9]",
    orange: "border-[#FFE0B2]/80 bg-white ring-1 ring-[#FFF3E0]",
    emerald: "border-[#A5D6A7] bg-gradient-to-br from-[#E8F5E9] to-white ring-2 ring-[#C8E6C9]/60",
  };
  const titleColor = {
    green: "text-[#2E7D32]",
    orange: "text-[#E65100]",
    emerald: "text-[#1B5E20]",
  };

  return (
    <motion.div
      whileHover={cardHoverMotion}
      className={`min-h-[180px] min-w-0 overflow-visible rounded-[28px] border-2 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.02)] transition-shadow duration-300 ${styles[accent]} ${className}`}
    >
      <p className={`text-[13px] font-bold leading-snug ${titleColor[accent]}`} lang="si">
        {title}
      </p>
      <p className="mt-4 break-words text-4xl font-black tracking-tight text-neutral-950 tabular-nums lg:text-5xl">
        {value}
      </p>
      {sub ? (
        <p className="mt-2 text-[12px] font-medium text-neutral-500" lang="si">
          {sub}
        </p>
      ) : null}
    </motion.div>
  );
}

function MiniMetric({ icon: Icon, label, value, badge = false }) {
  return (
    <div className="flex min-w-[120px] flex-1 items-start gap-3 rounded-xl bg-[#F5F5F7] px-3.5 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-neutral-500" lang="si">
          {label}
        </p>
        <p
          className={`normal-case text-[14px] font-semibold leading-snug text-neutral-950 ${
            badge ? "whitespace-nowrap" : "break-words"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/** @param {ReturnType<mapTrip>} trip @param {number} i @param {() => void} onEdit @param {() => void} onDelete @param {boolean} busy */
function RecordCard({ trip, i, onEdit, onDelete, busy }) {
  const f = finance(trip);
  const inward = !f.outward;
  const when = new Date(trip.created_at).toLocaleDateString("si-LK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={cardHoverMotion}
      className={`relative w-full min-w-0 overflow-hidden rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col justify-between ${
        inward ? "border-l-8 border-l-[#10B981]" : "border-l-8 border-l-[#F97316]"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-5">
        <div className="space-y-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              inward
                ? "bg-[#E8F5E9] text-[#2E7D32]"
                : "bg-[#FFF3E0] text-[#E65100]"
            }`}
            lang="si"
          >
            {inward ? T.badgeInward : T.badgeOutward}
          </span>
          <div className="flex gap-2 text-[11px] text-neutral-400">
            {trip.trip_reference ? <span className="font-mono">{trip.trip_reference}</span> : null}
            {trip.trip_reference ? <span>·</span> : null}
            <time>{when}</time>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className={`rounded-xl p-2 text-neutral-400 transition-colors hover:bg-[#E8F5E9] ${
              inward ? "hover:text-[#2E7D32]" : "hover:bg-[#FFF3E0] hover:text-[#E65100]"
            }`}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-[#E65100]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="font-mono font-bold bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-xl text-neutral-800">
            {trip.lorry_number || "—"}
          </span>
        </div>
      </div>

      <div className="mt-5 w-full min-w-0 space-y-4">
        <div className="w-full min-w-0">
          <p className="text-[12px] font-bold text-neutral-500" lang="si">
            {T.weight}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-neutral-950 tabular-nums">
            {kg(trip.total_kg)}
            <span className="ml-1 text-lg font-bold text-neutral-400">KG</span>
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-stretch justify-between gap-3">
          <MiniMetric icon={Scale} label={T.paddy} value={trip.paddy_type} badge />
          <MiniMetric
            icon={Warehouse}
            label={T.warehouse}
            value={trip.warehouse_name || "—"}
            badge
          />
          <MiniMetric
            icon={Coins}
            label={T.priceKg}
            value={`${money(trip.price_per_kg)}/kg`}
          />

          {f.logistics > 0 ? (
            <div className="min-w-[120px] flex-1 rounded-xl bg-[#F5F5F7] px-4 py-2.5">
              <p className="text-[11px] font-semibold text-neutral-500" lang="si">
                {T.costs}
              </p>
              <p className="break-words text-[15px] font-bold tabular-nums text-neutral-950">
                {money(f.logistics)}
              </p>
            </div>
          ) : null}

          {inward ? (
            <div className="min-w-[120px] flex-1 rounded-[18px] border border-neutral-200/80 bg-[#F5F5F7] p-4">
              <p className="text-[13px] font-bold text-neutral-600" lang="si">
                {T.investment}
              </p>
              <p className="mt-2 break-words text-2xl font-extrabold tabular-nums text-neutral-950">
                {money(f.investment)}
              </p>
            </div>
          ) : (
            <div
              className={`min-w-[120px] flex-1 rounded-[18px] border p-4 font-bold tabular-nums ${
                f.netProfit >= 0
                  ? "bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E20]"
                  : "bg-[#FFF3E0] border-[#FFE0B2] text-[#E65100]"
              }`}
            >
              <div className="flex w-full flex-col items-start justify-start gap-2">
                <span className="flex items-center gap-2 text-base sm:text-lg" lang="si">
                  <TrendingUp className="h-5 w-5 shrink-0" />
                  {f.netProfit >= 0 ? T.netProfit : T.netLoss}
                </span>
                <span className="w-full min-w-0 break-words text-left text-xl">
                  {f.netProfit >= 0 ? "+" : ""}
                  {money(f.netProfit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Array<{id:string,date:string,lorry:string,paddyAction:string,weight:number,profit:number}>} props.rows
 * @param {() => void} props.onClose
 */
function TripHistoryBreakdownModal({ open, rows, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close history modal"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-lg"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/15 px-5 py-4 sm:px-7">
              <div>
                <h3 className="text-lg font-black text-white sm:text-xl">
                  Trip Management - Detailed History Log
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/55">
                  Chronological trip profitability breakdown
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto px-5 py-5 sm:px-7">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/20 backdrop-blur-xl">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead className="bg-white/10">
                    <tr>
                      {[
                        "Date",
                        "Vehicle / Lorry",
                        "Paddy Type & Action",
                        "Weight (KG)",
                        "Trip Profit (Rs.)",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-white/80"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-16 text-center text-sm font-semibold text-white/60"
                        >
                          No trip history records found for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row.id} className="border-t border-white/10">
                          <td className="px-4 py-3 text-sm font-semibold text-white/90">
                            {row.date}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-black text-white">
                            {row.lorry}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-white/90">
                            {row.paddyAction}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-black text-white">
                            {kg(row.weight)}
                          </td>
                          <td
                            className={`px-4 py-3 font-mono text-sm font-black ${
                              row.profit > 0
                                ? "text-emerald-300"
                                : row.profit < 0
                                  ? "text-amber-300"
                                  : "text-white"
                            }`}
                          >
                            {money(row.profit)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TradingPage() {
  const [trips, setTrips] = useState(/** @type {ReturnType<mapTrip>[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(/** @type {string | null} */ (null));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [tab, setTab] = useState(/** @type {"reports" | "new"} */ ("reports"));
  const [historyFilter, setHistoryFilter] = useState(
    /** @type {"all" | "inward" | "outward"} */ ("all")
  );
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(/** @type {string | null} */ (null));
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [currentHelpers, setCurrentHelpers] = useState(/** @type {string[]} */ ([]));
  const [staffDrivers, setStaffDrivers] = useState(
    /** @type {{ id: string, name: string }[]} */ ([])
  );
  const [staffHelpers, setStaffHelpers] = useState(
    /** @type {{ id: string, name: string }[]} */ ([])
  );
  const [paddyTypes, setPaddyTypes] = useState(/** @type {string[]} */ ([PADDY_WEE, PADDY_MAIZE]));
  const formRef = useRef(form);
  const helpersRef = useRef(currentHelpers);
  const pageTopRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const resetFormState = useCallback(() => {
    setForm({ ...INITIAL_FORM });
    setCurrentHelpers([]);
  }, []);

  const driverOptions = useMemo(
    () =>
      staffDrivers.map((s) => ({
        value: s.name,
        label: s.name,
        sub: "Driver",
      })),
    [staffDrivers]
  );

  const addPaddyType = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPaddyTypes((prev) => {
      if (prev.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed].sort((a, b) => a.localeCompare(b, "si"));
    });
  }, []);

  const paddyOptions = useMemo(() => {
    const set = new Set(paddyTypes);
    const current = String(form.paddy_type ?? "").trim();
    if (current) set.add(current);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "si"));
  }, [paddyTypes, form.paddy_type]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    helpersRef.current = currentHelpers;
  }, [currentHelpers]);

  const inventory = useMemo(() => buildWarehouseInventory(trips), [trips]);
  const stats = useMemo(() => dashboardStats(trips), [trips]);

  const filteredTrips = useMemo(() => {
    if (historyFilter === "inward") {
      return trips.filter((t) => isInward(t.trip_type));
    }
    if (historyFilter === "outward") {
      return trips.filter((t) => isOutward(t.trip_type));
    }
    return trips;
  }, [trips, historyFilter]);

  const historyRows = useMemo(() => {
    return [...filteredTrips]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((trip) => {
        const inward = isInward(trip.trip_type);
        const action = inward ? "Loading" : "Unloading";
        return {
          id: trip.id,
          date: formatHistoryDate(trip.created_at),
          lorry: trip.lorry_number || "—",
          paddyAction: `${trip.paddy_type || "Paddy"} - ${action}`,
          weight: trip.total_kg,
          profit: finance(trip).netProfit,
        };
      });
  }, [filteredTrips]);

  const setField = useCallback((key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [tripList, staffLists, paddyList] = await Promise.all([
        loadTrips(),
        loadStaffLists(),
        loadDistinctPaddyTypes(),
      ]);
      setTrips(tripList);
      setStaffDrivers(
        staffLists.drivers.map((r) => ({ id: String(r.id), name: String(r.name ?? "").trim() }))
      );
      setStaffHelpers(
        staffLists.helpers.map((r) => ({ id: String(r.id), name: String(r.name ?? "").trim() }))
      );
      setPaddyTypes(paddyList);
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

  const startEdit = useCallback((trip) => {
    setEditingId(trip.id);
    setForm(tripToForm(trip));
    setCurrentHelpers(parseHelpers(trip.helper_names));
    setTab("new");
    setError(null);
    requestAnimationFrame(() => {
      pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const addHelper = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCurrentHelpers((prev) => {
      if (prev.some((h) => h.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
  }, []);

  const removeHelperAt = useCallback((index) => {
    setCurrentHelpers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeTrip = useCallback(
    async (trip) => {
      if (!window.confirm(T.confirmDelete)) return;
      setDeletingId(trip.id);
      setError(null);
      const wasEditing = editingId === trip.id;
      try {
        await deleteTripById(trip.id);
        if (wasEditing) {
          setEditingId(null);
          resetFormState();
        }
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const raw = { ...formRef.current };
    const fd = new FormData(e.currentTarget);
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") raw[k] = v;
    }

    if (!String(raw.lorry_number ?? "").trim()) {
      setError("Lorry number is required");
      return;
    }
    if (!String(raw.warehouse_name ?? "").trim()) {
      setError("Warehouse is required");
      return;
    }
    if (!String(raw.paddy_type ?? "").trim()) {
      setError("Please select a paddy type");
      return;
    }

    const payload = {
      ...raw,
      trip_type: normalizeTripType(raw.trip_type),
      warehouse_name: String(raw.warehouse_name).trim(),
      lorry_number: String(raw.lorry_number).trim(),
      driver_name: String(raw.driver_name ?? "").trim(),
      helper_names: joinHelpers(helpersRef.current),
      buyer_name: String(raw.buyer_name ?? "").trim(),
      total_kg: toNum(raw.total_kg),
      price_per_kg: toNum(raw.price_per_kg),
      start_km: toNum(raw.start_km),
      end_km: toNum(raw.end_km),
      diesel_liters: toNum(raw.diesel_liters),
      diesel_cost: toNum(raw.diesel_cost),
      driver_wage: toNum(raw.driver_wage),
      helper_wage: toNum(raw.helper_wage),
      road_expenses: toNum(raw.road_expenses),
    };

    if (payload.total_kg <= 0 || payload.price_per_kg <= 0) {
      setError("Please fill weight and price");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateTrip(editingId, payload);
      } else {
        await saveTrip(payload);
      }
      await refresh();
      resetFormState();
      setEditingId(null);
      setTab("reports");
    } catch (err) {
      console.error("Supabase Save Error Detailed:", err);
      setError(
        err instanceof Error
          ? err.message
          : editingId
            ? "Update failed"
            : "Failed to save entry"
      );
    } finally {
      setSaving(false);
    }
  };

  const outwardForm = isOutward(form.trip_type);

  return (
    <motion.div
      ref={pageTopRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full min-h-screen bg-[#F4F4F7] px-8 py-12 text-neutral-950 lg:px-16"
    >
      <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl" lang="si">
          {T.pageTitle}
        </h1>

        <div className="w-full shrink-0 rounded-2xl bg-neutral-200/50 p-2 shadow-inner backdrop-blur-xl xl:max-w-2xl">
          <div className="relative flex w-full">
            {[
              { id: "reports", label: T.tabReports },
              { id: "new", label: T.tabNew },
            ].map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(/** @type {"reports"|"new"} */ (t.id))}
                  className="relative flex min-h-[52px] flex-1 items-center justify-center rounded-xl px-4 py-3"
                >
                  {on ? (
                    <motion.span
                      layoutId="tradingTabPill"
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

      <TripHistoryBreakdownModal
        open={historyModalOpen}
        rows={historyRows}
        onClose={() => setHistoryModalOpen(false)}
      />

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

      {/* Top bento stats */}
      <div className="mb-12 grid w-full grid-cols-1 gap-8 xl:grid-cols-3">
        <StatCard
          accent="orange"
          title={T.statOutwardCount}
          value={stats.outwardLoadCount}
          sub="Loads"
        />
        <StatCard accent="emerald" title={T.statTotalProfit} value={money(stats.totalProfit)} />
        <StockInventoryBoard rows={inventory} loading={loading} />
      </div>

      {/* History sub-filters */}
      {tab === "reports" ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: T.filterAll },
              { id: "inward", label: T.filterInward, green: true },
              { id: "outward", label: T.filterOutward, orange: true },
            ].map((f) => {
              const on = historyFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setHistoryFilter(/** @type {"all"|"inward"|"outward"} */ (f.id))}
                  className={`rounded-full px-4 py-2 text-[12px] font-bold transition-all sm:text-[13px] ${
                    on
                      ? f.green
                        ? "bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#C8E6C9]"
                        : f.orange
                          ? "bg-[#FFF3E0] text-[#E65100] ring-2 ring-[#FFE0B2]"
                          : "bg-neutral-950 text-white shadow-sm"
                      : "bg-white text-neutral-600 ring-1 ring-neutral-200/80 hover:bg-neutral-50"
                  }`}
                  lang="si"
                >
                  {f.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setHistoryModalOpen(true)}
              className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-bold text-[#1B5E20] ring-1 ring-emerald-200/60 transition hover:bg-emerald-100 sm:text-[13px]"
            >
              View History Breakdown
            </button>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {/* Reports */}
        {tab === "reports" ? (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="w-full"
          >
            {loading ? (
              <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="min-h-[280px] animate-pulse rounded-[28px] bg-white/80"
                  />
                ))}
              </div>
            ) : filteredTrips.length === 0 ? (
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
                {filteredTrips.map((trip, i) => (
                  <RecordCard
                    key={trip.id}
                    trip={trip}
                    i={i}
                    busy={deletingId === trip.id}
                    onEdit={() => startEdit(trip)}
                    onDelete={() => removeTrip(trip)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : null}

        {/* New note form */}
        {tab === "new" ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32 }}
            onSubmit={onSubmit}
            noValidate
            className={`w-full rounded-[28px] border border-neutral-100 bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.02)] transition-all duration-300 lg:p-12 ${
              editingId ? "ring-2 ring-[#10B981]/40" : ""
            }`}
          >
            <Field label={T.tripType}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { db: DB_INWARD, label: T.switchInward, green: true },
                  { db: DB_OUTWARD, label: T.switchOutward, green: false },
                ].map((opt) => {
                  const sel = normalizeTripType(form.trip_type) === opt.db;
                  return (
                    <button
                      key={opt.db}
                      type="button"
                      onClick={() => setField("trip_type", opt.db)}
                      className={`rounded-xl px-3 py-4 text-[13px] font-bold leading-snug transition-all sm:text-[14px] ${
                        sel
                          ? opt.green
                            ? "bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#A5D6A7]"
                            : "bg-[#FFF3E0] text-[#E65100] ring-2 ring-[#FFCC80]"
                          : "bg-[#F5F5F7] text-neutral-600 hover:bg-neutral-100"
                      }`}
                      lang="si"
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="mt-10 space-y-10">
              <Section title={T.sectionBasic}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={T.lorry}>
                    <div className="relative">
                      <Truck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        name="lorry_number"
                        className={`${INPUT} pl-10 font-mono`}
                        value={form.lorry_number}
                        onChange={(ev) => setField("lorry_number", ev.target.value)}
                      />
                    </div>
                  </Field>
                  <SearchableCombobox
                    label={T.driver}
                    icon={User}
                    value={form.driver_name}
                    onChange={(name) => setField("driver_name", name)}
                    options={driverOptions}
                    placeholder="Select a driver..."
                  />
                  <HelpersField
                    helpers={currentHelpers}
                    staffHelpers={staffHelpers}
                    onAdd={addHelper}
                    onRemove={removeHelperAt}
                  />
                  <WarehouseSelect
                    value={form.warehouse_name}
                    onChange={(v) => setField("warehouse_name", v)}
                  />
                  {outwardForm ? (
                    <Field label={T.buyer}>
                      <input
                        name="buyer_name"
                        className={INPUT}
                        value={form.buyer_name}
                        onChange={(ev) => setField("buyer_name", ev.target.value)}
                      />
                    </Field>
                  ) : (
                    <div className="hidden sm:block" aria-hidden />
                  )}
                </div>
              </Section>

              <Section title={T.sectionStock}>
                <PaddyTypeField
                  value={form.paddy_type || paddyOptions[0] || PADDY_WEE}
                  onChange={(v) => setField("paddy_type", v)}
                  types={paddyOptions}
                  onAddType={addPaddyType}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={T.totalKg}>
                    <div className="relative">
                      <Scale className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        name="total_kg"
                        type="number"
                        min="0"
                        className={`${INPUT} pl-10`}
                        value={form.total_kg}
                        onChange={(ev) => setField("total_kg", ev.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label={T.priceKg}>
                    <div className="relative">
                      <Coins className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        name="price_per_kg"
                        type="number"
                        min="0"
                        step="0.01"
                        className={`${INPUT} pl-10`}
                        value={form.price_per_kg}
                        onChange={(ev) => setField("price_per_kg", ev.target.value)}
                      />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title={T.sectionExpenses}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={T.startKm}>
                    <input
                      name="start_km"
                      type="number"
                      min="0"
                      className={INPUT}
                      value={form.start_km}
                      onChange={(ev) => setField("start_km", ev.target.value)}
                    />
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
                  <Field label={T.dieselL}>
                    <input
                      name="diesel_liters"
                      type="number"
                      min="0"
                      step="0.1"
                      className={INPUT}
                      value={form.diesel_liters}
                      onChange={(ev) => setField("diesel_liters", ev.target.value)}
                    />
                  </Field>
                  <Field label={T.dieselCost}>
                    <input
                      name="diesel_cost"
                      type="number"
                      min="0"
                      className={INPUT}
                      value={form.diesel_cost}
                      onChange={(ev) => setField("diesel_cost", ev.target.value)}
                    />
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
                  <Field label={T.extraCost} className="sm:col-span-2">
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        name="road_expenses"
                        type="number"
                        min="0"
                        className={`${INPUT} pl-10`}
                        value={form.road_expenses}
                        onChange={(ev) => setField("road_expenses", ev.target.value)}
                      />
                    </div>
                  </Field>
                </div>
              </Section>
            </div>

            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10B981] px-10 py-4 text-[15px] font-black text-white shadow-lg shadow-[#10B981]/20 transition-all duration-300 hover:bg-[#059669] disabled:opacity-50 sm:w-auto"
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
