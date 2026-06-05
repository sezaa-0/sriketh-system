"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Trash2,
  PackagePlus,
  PackageMinus,
  Boxes,
  History,
  Truck,
  Wrench,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const TAB_ADD = "add";
const TAB_ISSUE = "issue";
const ADD_ITEM_NEW = "__new__";

const T = {
  pageTitle: "Spare Parts Inventory",
  pageSub: "Spare Parts Inventory & Stock Consumption Tracker",
  tabAdd: "Add New Stock",
  tabAddEn: "Add / Update Stock",
  tabIssue: "Issue Items",
  tabIssueEn: "Issue Parts",
  itemName: "Item",
  newItemOption: "New Item",
  newItemName: "New Item Name",
  itemNamePlaceholder: "e.g. Lorry Tire, Engine Oil...",
  selectExistingItem: "Select Existing Item",
  qtyAdd: "Quantity to Add",
  unitCost: "New Batch Unit Cost (Rs.)",
  purchasePriceHint:
    "When selecting an existing item, cost is merged using weighted average cost (WAC) — previous pricing is preserved.",
  totalAssetValue: "Total Stock Value",
  totalAssetSub: "All items — quantity × average unit cost",
  unitPurchase: "Average Purchase Price",
  itemTotalValue: "Total Item Value",
  saveAdd: "Save Stock",
  selectItem: "Select Item",
  qtyIssue: "Issue Quantity",
  selectVehicle: "Select Vehicle",
  saveIssue: "Record Issue",
  stockTitle: "Current Stock",
  stockEmpty: "No stock registered",
  logsTitle: "Issue Logs",
  logsEmpty: "No issue logs",
  stockCount: "Stock Rows",
  skuCount: "Item Types",
  deleteItemConfirm:
    "Do you want to permanently delete this item and all related stock logs? This action cannot be undone.",
  insufficientStock: "Insufficient stock. Current quantity:",
  noItems: "Add stock first",
  noVehicles: "Register a vehicle first (/vehicles)",
  itemRequired: "Item name is required",
  qtyRequired: "Quantity must be 1 or higher",
  selectItemRequired: "Select an item",
  selectVehicleRequired: "Select a vehicle",
};

const INITIAL_ADD_FORM = {
  item_selector: ADD_ITEM_NEW,
  new_item_name: "",
  quantity: "",
  unit_cost: "",
};

const INITIAL_ISSUE_FORM = {
  inventory_id: "",
  quantity: "",
  vehicle_id: "",
};

const CARD =
  "rounded-3xl border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]";

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

function toInt(v) {
  if (v == null || String(v).trim() === "") return 0;
  const n = parseInt(String(v).trim(), 10);
  return Number.isNaN(n) ? 0 : n;
}

function normalizeItemName(name) {
  return String(name ?? "").trim();
}

function itemNameKey(name) {
  return normalizeItemName(name).toLowerCase();
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

function itemLineValue(item) {
  return (item.quantity || 0) * (item.unit_cost || 0);
}

/** Weighted Average Cost: blends old stock value with a new purchase batch. */
function computeWeightedAverageUnitCost(
  currentQty,
  currentUnitCost,
  addedQty,
  addedUnitCost
) {
  const q0 = Math.max(0, toInt(currentQty));
  const c0 = Math.max(0, toNum(currentUnitCost));
  const q1 = Math.max(0, toInt(addedQty));
  const c1 = Math.max(0, toNum(addedUnitCost));
  const totalQty = q0 + q1;
  if (totalQty <= 0) return c1;
  const blended = (q0 * c0 + q1 * c1) / totalQty;
  return Math.round(blended * 100) / 100;
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

function mapInventory(row) {
  return {
    id: String(row.id),
    item_name: normalizeItemName(row.item_name),
    quantity: Math.max(0, toInt(row.quantity)),
    unit_cost: toNum(row.unit_cost),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapVehicle(row) {
  return {
    id: String(row.id),
    province_code: formatPlateProvince(row.province_code),
    series_code: formatPlateSeries(row.series_code),
    sequence_number: formatPlateSequence(row.sequence_number),
    vehicle_type: String(row.vehicle_type ?? "lorry"),
  };
}

function mapStockLog(row) {
  const rawInv = row.inventory;
  const rawVeh = row.vehicles;
  const inventory =
    rawInv && typeof rawInv === "object" && !Array.isArray(rawInv)
      ? mapInventory(rawInv)
      : null;
  const vehicle =
    rawVeh && typeof rawVeh === "object" && !Array.isArray(rawVeh)
      ? mapVehicle(rawVeh)
      : null;

  return {
    id: String(row.id),
    inventory_id: String(row.inventory_id ?? inventory?.id ?? ""),
    vehicle_id: String(row.vehicle_id ?? vehicle?.id ?? ""),
    quantity_issued: Math.max(0, toInt(row.quantity_issued)),
    issued_at: String(row.issued_at ?? new Date().toISOString()),
    created_at: String(row.created_at ?? new Date().toISOString()),
    inventory,
    vehicle,
  };
}

function findItemByName(items, name) {
  const key = itemNameKey(name);
  if (!key) return null;
  return items.find((i) => itemNameKey(i.item_name) === key) ?? null;
}

function compareItems(a, b) {
  return a.item_name.localeCompare(b.item_name, "si");
}

function compareVehicles(a, b) {
  return plateSortKey(a).localeCompare(plateSortKey(b), "si");
}

function ValuationBanner({ totalValue, itemCount }) {
  const f = formatSinhalaLakhCrore(totalValue);

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${CARD} overflow-hidden border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/30 to-white`}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50 text-emerald-700 shadow-sm">
            <TrendingUp className="h-7 w-7" strokeWidth={2.2} />
          </div>
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/70"
              lang="si"
            >
              {T.totalAssetValue}
            </p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">{T.totalAssetSub}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-emerald-700 sm:text-5xl" lang="si">
              {f.main}
            </p>
            <p className="mt-1 text-sm font-bold text-neutral-400">{f.sub}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:justify-end">
          <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500" lang="si">
              {T.skuCount}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-neutral-950">{itemCount}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white/80 px-4 py-3 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-600" strokeWidth={2.2} />
            <span className="text-xs font-bold text-neutral-600">Warehouse Valuation</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function SmartItemSelector({
  items,
  selector,
  newItemName,
  onSelectorChange,
  onNewNameChange,
}) {
  const isNew = selector === ADD_ITEM_NEW;
  const selected = items.find((i) => i.id === selector) ?? null;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
          {T.itemName}
        </span>
        <select
          value={selector}
          onChange={(e) => onSelectorChange(e.target.value)}
          className={INPUT}
        >
          <option value={ADD_ITEM_NEW}>{T.newItemOption}</option>
          {items.length === 0 ? (
            <option value="" disabled>
              {T.stockEmpty}
            </option>
          ) : (
            items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name} — Stock {item.quantity} · {moneyFullLkr(item.unit_cost)}
              </option>
            ))
          )}
        </select>
      </label>

      <AnimatePresence initial={false}>
        {isNew ? (
          <motion.label
            key="new-name"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="block overflow-hidden"
          >
            <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
              {T.newItemName}
            </span>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => onNewNameChange(e.target.value)}
              placeholder={T.itemNamePlaceholder}
              className={INPUT}
              lang="si"
            />
          </motion.label>
        ) : selected ? (
          <motion.p
            key="existing-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs font-semibold text-emerald-900"
            lang="si"
          >
            {T.selectExistingItem}: <span className="font-black">{selected.item_name}</span>
            {" · "}
            {T.stockCount}: {selected.quantity}
            {" · "}
            {T.unitPurchase}: Rs. {moneyPlain(selected.unit_cost)}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function InventoryTabs({ activeTab, onChange }) {
  const tabs = [
    { id: TAB_ADD, label: T.tabAdd, labelEn: T.tabAddEn, icon: PackagePlus },
    { id: TAB_ISSUE, label: T.tabIssue, labelEn: T.tabIssueEn, icon: PackageMinus },
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
                layoutId="inventoryTabPill"
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

function StockCard({ item, onDelete }) {
  const outOfStock = item.quantity <= 0;
  const lineValue = itemLineValue(item);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={cardHoverMotion}
      className={`relative flex flex-col rounded-2xl border p-4 transition-colors ${
        outOfStock
          ? "border-rose-300/70 bg-rose-50/30"
          : "border-neutral-100 bg-neutral-50/40"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-neutral-950" lang="si">
            {item.item_name}
          </p>
          <p className="mt-2 text-[11px] font-semibold text-neutral-600" lang="si">
            {T.unitPurchase}:{" "}
            <span className="font-mono font-bold text-neutral-800">
              Rs. {moneyPlain(item.unit_cost)}
            </span>
          </p>
          <p className="mt-1 text-[11px] font-bold text-neutral-700" lang="si">
            {T.itemTotalValue}:{" "}
            <span className="font-mono text-sm font-black tracking-tight text-neutral-950">
              Rs. {moneyPlain(lineValue)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className={ICON_BTN}
          aria-label={T.deleteItemConfirm}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
      <div
        className={`mt-auto flex items-center justify-between rounded-xl border px-3 py-2.5 ${
          outOfStock
            ? "border-rose-200 bg-white/80"
            : "border-neutral-200/80 bg-white"
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500" lang="si">
          {T.stockCount}
        </span>
        <span
          className={`text-2xl font-black tabular-nums tracking-tight ${
            outOfStock ? "text-rose-700" : "text-neutral-950"
          }`}
        >
          {item.quantity}
        </span>
      </div>
    </motion.article>
  );
}

function StockLogRow({ log, index }) {
  const itemName = log.inventory?.item_name ?? "—";
  const plate = formatPlateDisplay(log.vehicle);
  const qty = log.quantity_issued;
  const dateStr = formatLogDate(log.issued_at);

  return (
    <motion.li
      layout
      custom={index}
      variants={staggerChild}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -12 }}
      className="flex gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
        <Wrench className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug text-neutral-900" lang="si">
          <span className="font-black text-neutral-950">{qty}</span>{" "}
          <span>{itemName}</span>{" "}
          <span className="text-neutral-500">→</span>{" "}
          <span className="font-mono text-xs font-black tracking-wide text-neutral-800 sm:text-sm">
            {plate}
          </span>
        </p>
        <p className="mt-1 text-[10px] font-semibold text-neutral-400">{dateStr}</p>
      </div>
      <div className="hidden shrink-0 items-center sm:flex">
        <Truck className="h-4 w-4 text-neutral-300" strokeWidth={2} />
      </div>
    </motion.li>
  );
}

function formatLogDate(iso) {
  try {
    return new Date(iso).toLocaleString("si-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_ADD);
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [addForm, setAddForm] = useState(INITIAL_ADD_FORM);
  const [issueForm, setIssueForm] = useState(INITIAL_ISSUE_FORM);

  const sortedItems = useMemo(() => [...items].sort(compareItems), [items]);
  const sortedVehicles = useMemo(() => [...vehicles].sort(compareVehicles), [vehicles]);

  const totalAssetValue = useMemo(
    () => items.reduce((sum, i) => sum + itemLineValue(i), 0),
    [items]
  );

  const isNewItemMode = addForm.item_selector === ADD_ITEM_NEW;

  const selectedAddItem = useMemo(
    () => items.find((i) => i.id === addForm.item_selector) ?? null,
    [items, addForm.item_selector]
  );

  const selectedIssueItem = useMemo(
    () => items.find((i) => i.id === issueForm.inventory_id) ?? null,
    [items, issueForm.inventory_id]
  );

  const refresh = useCallback(async () => {
    const [invRes, vehRes, logRes] = await Promise.all([
      supabase.from("inventory").select("*").order("item_name", { ascending: true }),
      supabase
        .from("vehicles")
        .select("id, province_code, series_code, sequence_number, vehicle_type")
        .order("created_at", { ascending: false }),
      supabase
        .from("stock_logs")
        .select("*, inventory(*), vehicles(*)")
        .order("issued_at", { ascending: false }),
    ]);

    if (invRes.error) throw invRes.error;
    if (vehRes.error) throw vehRes.error;
    if (logRes.error) throw logRes.error;

    const invList = (invRes.data ?? []).map(mapInventory);
    const vehList = (vehRes.data ?? []).map(mapVehicle);
    const logList = (logRes.data ?? []).map(mapStockLog);

    setItems(invList);
    setVehicles(vehList);
    setLogs(logList);

    setIssueForm((prev) => {
      const validItem = invList.some((i) => i.id === prev.inventory_id);
      const validVeh = vehList.some((v) => v.id === prev.vehicle_id);
      return {
        ...prev,
        inventory_id: validItem ? prev.inventory_id : invList[0]?.id ?? "",
        vehicle_id: validVeh ? prev.vehicle_id : vehList[0]?.id ?? "",
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

  const handleAddSelectorChange = (value) => {
    setAddForm((f) => ({
      ...f,
      item_selector: value,
      unit_cost: value === ADD_ITEM_NEW ? f.unit_cost : "",
    }));
  };

  const handleAddStock = async (ev) => {
    ev.preventDefault();
    const addQty = toInt(addForm.quantity);
    const cost = toNum(addForm.unit_cost);
    const isNew = addForm.item_selector === ADD_ITEM_NEW;

    let existing = null;
    if (isNew) {
      const name = normalizeItemName(addForm.new_item_name);
      if (!name) {
        setError(T.itemRequired);
        return;
      }
      existing = findItemByName(items, name);
    } else {
      existing = items.find((i) => i.id === addForm.item_selector) ?? null;
      if (!existing) {
        setError(T.selectItemRequired);
        return;
      }
    }

    if (addQty < 1) {
      setError(T.qtyRequired);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const now = new Date().toISOString();

      if (existing) {
        const newQuantity = existing.quantity + addQty;
        const newUnitCost = computeWeightedAverageUnitCost(
          existing.quantity,
          existing.unit_cost,
          addQty,
          cost
        );

        const { data, error: updErr } = await supabase
          .from("inventory")
          .update({
            quantity: newQuantity,
            unit_cost: newUnitCost,
            updated_at: now,
          })
          .eq("id", existing.id)
          .select("*")
          .single();
        if (updErr) throw updErr;
        const updated = mapInventory(data);
        setItems((prev) =>
          prev.map((i) => (i.id === updated.id ? updated : i)).sort(compareItems)
        );
      } else {
        const name = normalizeItemName(addForm.new_item_name);
        const { data, error: insErr } = await supabase
          .from("inventory")
          .insert({
            item_name: name,
            quantity: addQty,
            unit_cost: cost,
          })
          .select("*")
          .single();
        if (insErr) throw insErr;
        const created = mapInventory(data);
        setItems((prev) => [...prev, created].sort(compareItems));
      }

      setAddForm(INITIAL_ADD_FORM);
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleIssueStock = async (ev) => {
    ev.preventDefault();
    const invId = issueForm.inventory_id;
    const vehId = issueForm.vehicle_id;
    const issueQty = toInt(issueForm.quantity);

    if (!invId) {
      setError(T.selectItemRequired);
      return;
    }
    if (!vehId) {
      setError(T.selectVehicleRequired);
      return;
    }
    if (issueQty < 1) {
      setError(T.qtyRequired);
      return;
    }

    const item = items.find((i) => i.id === invId);
    if (!item) {
      setError(T.selectItemRequired);
      return;
    }
    if (issueQty > item.quantity) {
      setError(`${T.insufficientStock} ${item.quantity}`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const newQty = item.quantity - issueQty;

      const { data: updatedRow, error: updErr } = await supabase
        .from("inventory")
        .update({ quantity: newQty, updated_at: now })
        .eq("id", item.id)
        .select("*")
        .single();
      if (updErr) throw updErr;

      const { data: logRow, error: logErr } = await supabase
        .from("stock_logs")
        .insert({
          inventory_id: item.id,
          vehicle_id: vehId,
          quantity_issued: issueQty,
          issued_at: now,
        })
        .select("*, inventory(*), vehicles(*)")
        .single();
      if (logErr) throw logErr;

      const updated = mapInventory(updatedRow);
      const createdLog = mapStockLog(logRow);

      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setLogs((prev) => [createdLog, ...prev]);
      setIssueForm((f) => ({ ...f, quantity: "" }));
    } catch (err) {
      setError(dbError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(T.deleteItemConfirm)) return;
    setError("");
    try {
      const { error: delErr } = await supabase
        .from("inventory")
        .delete()
        .eq("id", item.id);
      if (delErr) throw delErr;
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setLogs((prev) => prev.filter((l) => l.inventory_id !== item.id));
      setIssueForm((f) =>
        f.inventory_id === item.id
          ? { ...f, inventory_id: items.find((i) => i.id !== item.id)?.id ?? "" }
          : f
      );
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
        <h1
          className="text-2xl font-black tracking-tight text-neutral-950 sm:text-4xl"
          lang="si"
        >
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
        <>
          <ValuationBanner totalValue={totalAssetValue} itemCount={items.length} />

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start">
          {/* Left — dual-tab forms */}
          <section className={CARD}>
            <InventoryTabs activeTab={activeTab} onChange={setActiveTab} />

            <AnimatePresence mode="wait">
              {activeTab === TAB_ADD ? (
                <motion.form
                  key="add"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleAddStock}
                  className="space-y-4"
                >
                  <SmartItemSelector
                    items={sortedItems}
                    selector={addForm.item_selector}
                    newItemName={addForm.new_item_name}
                    onSelectorChange={handleAddSelectorChange}
                    onNewNameChange={(value) =>
                      setAddForm((f) => ({ ...f, new_item_name: value }))
                    }
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                        {T.qtyAdd}
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={addForm.quantity}
                        onChange={(e) =>
                          setAddForm((f) => ({ ...f, quantity: e.target.value }))
                        }
                        className={INPUT}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                        {T.unitCost}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={addForm.unit_cost}
                        onChange={(e) =>
                          setAddForm((f) => ({ ...f, unit_cost: e.target.value }))
                        }
                        className={INPUT}
                      />
                      {!isNewItemMode && selectedAddItem ? (
                        <p className="mt-2 text-[10px] font-semibold text-emerald-800/80" lang="si">
                          {T.purchasePriceHint}
                        </p>
                      ) : null}
                    </label>
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
                    <span lang="si">{T.saveAdd}</span>
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="issue"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleIssueStock}
                  className="space-y-4"
                >
                  {items.length === 0 ? (
                    <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900" lang="si">
                      {T.noItems}
                    </p>
                  ) : null}

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                      {T.selectItem}
                    </span>
                    <select
                      value={issueForm.inventory_id}
                      onChange={(e) =>
                        setIssueForm((f) => ({ ...f, inventory_id: e.target.value }))
                      }
                      className={INPUT}
                      disabled={items.length === 0}
                    >
                      {sortedItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.item_name} — Stock {item.quantity}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedIssueItem ? (
                    <p className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600">
                      {T.stockCount}:{" "}
                      <span className="font-black text-neutral-950">
                        {selectedIssueItem.quantity}
                      </span>
                    </p>
                  ) : null}

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-neutral-600" lang="si">
                      {T.qtyIssue}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={selectedIssueItem?.quantity ?? undefined}
                      step={1}
                      inputMode="numeric"
                      value={issueForm.quantity}
                      onChange={(e) =>
                        setIssueForm((f) => ({ ...f, quantity: e.target.value }))
                      }
                      className={INPUT}
                      disabled={items.length === 0}
                    />
                  </label>

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
                      value={issueForm.vehicle_id}
                      onChange={(e) =>
                        setIssueForm((f) => ({ ...f, vehicle_id: e.target.value }))
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

                  <button
                    type="submit"
                    disabled={saving || items.length === 0 || vehicles.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-black text-white transition hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <PackageMinus className="h-5 w-5" strokeWidth={2.2} />
                    )}
                    <span lang="si">{T.saveIssue}</span>
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </section>

          {/* Right — stock grid + consumption logs */}
          <div className="flex flex-col gap-6">
            <section className={CARD}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-neutral-700" strokeWidth={2.2} />
                  <h2 className="text-lg font-black text-neutral-950" lang="si">
                    {T.stockTitle}
                  </h2>
                </div>
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-bold text-neutral-600">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="py-12 text-center text-sm font-bold text-neutral-400" lang="si">
                  {T.stockEmpty}
                </p>
              ) : (
                <motion.div
                  className="grid gap-3 sm:grid-cols-2"
                  layout
                >
                  <AnimatePresence mode="popLayout">
                    {sortedItems.map((item) => (
                      <StockCard key={item.id} item={item} onDelete={handleDeleteItem} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </section>

            <section className={`${CARD} flex max-h-[min(520px,55vh)] flex-col`}>
              <div className="mb-4 flex shrink-0 items-center gap-2">
                <History className="h-5 w-5 text-neutral-700" strokeWidth={2.2} />
                <h2 className="text-lg font-black text-neutral-950" lang="si">
                  {T.logsTitle}
                </h2>
                <span className="ml-auto rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-bold text-neutral-600">
                  {logs.length}
                </span>
              </div>

              {logs.length === 0 ? (
                <p className="py-12 text-center text-sm font-bold text-neutral-400" lang="si">
                  {T.logsEmpty}
                </p>
              ) : (
                <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                  <AnimatePresence mode="popLayout">
                    {logs.map((log, i) => (
                      <StockLogRow key={log.id} log={log} index={i} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          </div>
          </div>
        </>
      )}
    </motion.main>
  );
}
