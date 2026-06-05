"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  Car,
  CarFront,
  Truck,
  Gauge,
  Shield,
  FileBadge,
  Wrench,
  Bell,
  FileText,
  Settings2,
} from "lucide-react";

const TYPE_ALL = "all";
const TYPE_LORRY = "lorry";
const TYPE_JEEP = "jeep";
const TYPE_CAR = "car";

const TAB_DOCUMENTS = "documents";
const TAB_SERVICE = "service";

const ALERT_WINDOW_DAYS = 7;

const T = {
  pageTitle: "Vehicle Fleet Care",
  pageSub: "Vehicle Maintenance",
  alertEmpty: "No alerts requiring attention within 7 days",
  docAlertTitle: "Vehicle Document Alerts",
  serviceAlertTitle: "Service Maintenance Alerts",
  tabDocuments: "Document Expiries",
  tabDocumentsEn: "Documents",
  tabService: "Service Maintenance",
  tabServiceEn: "Service",
  emptyDocuments: "No registered vehicles",
  emptyService: "No registered vehicles",
  docSection: "Document Expiries",
  serviceSection: "Service Maintenance",
  formTitle: "Vehicle Registration",
  formUpdate: "Vehicle Update",
  vehicleNumber: "Vehicle Number",
  plateProvince: "Province",
  plateSeries: "Series",
  plateSequence: "Number",
  vehicleType: "Vehicle Type",
  licenseExpire: "License Expiry Date",
  insuranceExpire: "Insurance Expiry Date",
  serviceDueDate: "Next Service Date",
  serviceDueKm: "Next Service KM",
  currentKm: "Current KM",
  save: "Save Vehicle",
  update: "Update",
  cancel: "Cancel",
  fleetTitle: "Vehicle Records",
  emptyFleet: "No registered vehicles",
  emptyFilter: "No vehicles for this filter",
  filterAll: "All",
  filterLorry: "Lorry",
  filterJeep: "Jeep",
  filterCar: "Car",
  deleteConfirm:
    "Are you sure you want to permanently remove this vehicle from the system? This action cannot be undone.",
  daysLeft: "Days Left",
  daysSuffix: "",
  expired: "Expired / Immediate Action",
  license: "License",
  insurance: "Insurance",
  service: "Service",
  licenseEn: "License",
  insuranceEn: "Insurance",
  serviceEn: "Service",
  noDate: "No date",
  kmDue: "Service KM",
  current: "Current",
};

const VEHICLE_TYPES = [
  { id: TYPE_LORRY, label: "Lorry", labelEn: "Lorry", icon: Truck },
  { id: TYPE_JEEP, label: "Jeep", labelEn: "Jeep", icon: CarFront },
  { id: TYPE_CAR, label: "Car", labelEn: "Car", icon: Car },
];

const TYPE_FILTER_PILLS = [
  { id: TYPE_ALL, labelSi: T.filterAll, labelEn: "All" },
  { id: TYPE_LORRY, labelSi: T.filterLorry, labelEn: "Lorry" },
  { id: TYPE_JEEP, labelSi: T.filterJeep, labelEn: "Jeep" },
  { id: TYPE_CAR, labelSi: T.filterCar, labelEn: "Car" },
];

const DOCUMENT_TRACKERS = [
  {
    key: "license_expire_date",
    label: T.license,
    labelEn: T.licenseEn,
    icon: FileBadge,
  },
  {
    key: "insurance_expire_date",
    label: T.insurance,
    labelEn: T.insuranceEn,
    icon: Shield,
  },
];

const SERVICE_DATE_TRACKER = {
  key: "service_due_date",
  label: T.service,
  labelEn: T.serviceEn,
  icon: Wrench,
};

const LEGACY_VEHICLE_TYPES = new Set(["van", "tipper"]);

function normalizeVehicleType(raw) {
  const t = String(raw ?? "").trim().toLowerCase();
  if (t === TYPE_CAR) return TYPE_CAR;
  if (t === TYPE_JEEP) return TYPE_JEEP;
  if (t === TYPE_LORRY || LEGACY_VEHICLE_TYPES.has(t)) return TYPE_LORRY;
  return TYPE_LORRY;
}

const INITIAL_FORM = {
  province_code: "",
  series_code: "",
  sequence_number: "",
  vehicle_type: TYPE_LORRY,
  license_expire_date: "",
  insurance_expire_date: "",
  service_due_date: "",
  service_due_km: "",
  current_km: "",
};

const INPUT =
  "w-full min-w-0 bg-[#EFEFEF]/70 border-0 rounded-2xl p-4 font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-950 transition-all duration-300 outline-none";

const PLATE_PART =
  "w-full min-w-0 rounded-xl border-2 border-neutral-200 bg-white px-3 py-3 text-center font-mono text-base font-bold uppercase tracking-wider text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950/15";

const PLATE_BADGE =
  "inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-xl border-2 border-amber-500/30 bg-amber-400/10 px-3 py-1.5 text-center font-mono text-base font-black uppercase tracking-wider text-neutral-800";

const ICON_BTN =
  "rounded-xl p-2 text-neutral-400 transition-all hover:bg-neutral-50 hover:text-neutral-900";

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

function comparePlates(a, b) {
  return plateSortKey(a).localeCompare(plateSortKey(b), "si");
}

function PlateInputRow({ form, setForm }) {
  const province = String(form.province_code ?? "");
  const series = String(form.series_code ?? "");
  const sequence = String(form.sequence_number ?? "");

  const handleProvinceChange = (e) => {
    const next = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    setForm((prev) => ({ ...prev, province_code: next }));
  };

  const handleSeriesChange = (e) => {
    const next = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    setForm((prev) => ({ ...prev, series_code: next }));
  };

  const handleSequenceChange = (e) => {
    const next = e.target.value.replace(/\D/g, "").slice(0, 4);
    setForm((prev) => ({ ...prev, sequence_number: next }));
  };

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-bold text-neutral-500">{T.vehicleNumber}</p>
      <div className="flex w-full flex-nowrap items-start gap-2">
        <div className="min-w-[4.5rem] flex-[2]">
          <input
            type="text"
            name="province_code"
            inputMode="text"
            autoComplete="off"
            maxLength={2}
            placeholder="WP"
            className={PLATE_PART}
            value={province}
            onChange={handleProvinceChange}
          />
          <p className="mt-1.5 text-center text-[10px] font-bold leading-snug text-neutral-500">
            {T.plateProvince}
          </p>
        </div>
        <div className="min-w-[5.5rem] flex-[3]">
          <input
            type="text"
            name="series_code"
            inputMode="text"
            autoComplete="off"
            maxLength={3}
            placeholder="GA"
            className={PLATE_PART}
            value={series}
            onChange={handleSeriesChange}
          />
          <p className="mt-1.5 text-center text-[10px] font-bold leading-snug text-neutral-500">
            {T.plateSeries}
          </p>
        </div>
        <div className="min-w-[6rem] flex-[4]">
          <input
            type="text"
            name="sequence_number"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="1234"
            className={PLATE_PART}
            value={sequence}
            onChange={handleSequenceChange}
          />
          <p className="mt-1.5 text-center text-[10px] font-bold leading-snug text-neutral-500">
            {T.plateSequence}
          </p>
        </div>
      </div>
    </div>
  );
}

function SriLankanPlateBadge({ vehicle }) {
  const text = formatPlateDisplay(vehicle);
  return (
    <span className={PLATE_BADGE} title={text}>
      {text}
    </span>
  );
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

function padDays(n) {
  return String(Math.max(0, n)).padStart(2, "0");
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

function formatKm(n) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(
    Number(n) || 0
  );
}

function vehicleTypeMeta(type) {
  return VEHICLE_TYPES.find((t) => t.id === type) ?? VEHICLE_TYPES[0];
}

function mapVehicle(row) {
  const type = normalizeVehicleType(row.vehicle_type);
  return {
    id: String(row.id),
    province_code: formatPlateProvince(row.province_code),
    series_code: formatPlateSeries(row.series_code),
    sequence_number: formatPlateSequence(row.sequence_number),
    vehicle_type: type,
    license_expire_date: row.license_expire_date
      ? String(row.license_expire_date)
      : "",
    insurance_expire_date: row.insurance_expire_date
      ? String(row.insurance_expire_date)
      : "",
    service_due_date: row.service_due_date ? String(row.service_due_date) : "",
    service_due_km: Number(row.service_due_km ?? 0),
    current_km: Number(row.current_km ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function buildPayload(form) {
  const type = normalizeVehicleType(form.vehicle_type);
  return {
    province_code: formatPlateProvince(form.province_code),
    series_code: formatPlateSeries(form.series_code),
    sequence_number: formatPlateSequence(form.sequence_number),
    vehicle_type: type,
    license_expire_date: toDateOrNull(form.license_expire_date),
    insurance_expire_date: toDateOrNull(form.insurance_expire_date),
    service_due_date: toDateOrNull(form.service_due_date),
    service_due_km: toNum(form.service_due_km),
    current_km: toNum(form.current_km),
    updated_at: new Date().toISOString(),
  };
}

function sortAlerts(items) {
  return [...items].sort((a, b) => {
    const aExpired = a.days <= 0;
    const bExpired = b.days <= 0;
    if (aExpired && !bExpired) return -1;
    if (!aExpired && bExpired) return 1;
    return a.days - b.days;
  });
}

function buildDocumentAlerts(vehicles) {
  const items = [];
  for (const vehicle of vehicles) {
    for (const tracker of DOCUMENT_TRACKERS) {
      const dateStr = vehicle[tracker.key];
      const days = daysUntilDate(dateStr);
      if (days == null || days > ALERT_WINDOW_DAYS) continue;
      items.push({
        id: `${vehicle.id}-${tracker.key}`,
        vehicle,
        tracker,
        days,
        dateStr,
      });
    }
  }
  return sortAlerts(items);
}

function buildServiceAlerts(vehicles) {
  const items = [];
  for (const vehicle of vehicles) {
    const dateStr = vehicle.service_due_date;
    const days = daysUntilDate(dateStr);
    if (days == null || days > ALERT_WINDOW_DAYS) continue;
    items.push({
      id: `${vehicle.id}-service`,
      vehicle,
      tracker: SERVICE_DATE_TRACKER,
      days,
      dateStr,
    });
  }
  return sortAlerts(items);
}

function alertMessage(item) {
  const plate = formatPlateDisplay(item.vehicle);
  const label = `${item.tracker.label} (${item.tracker.labelEn})`;
  if (item.days <= 0) {
    return `${plate} : ${label} - ${T.expired}`;
  }
  return `${plate}: ${label} expires in ${padDays(item.days)} day(s)`;
}

function CountdownGauge({ date, label, labelEn, icon: Icon }) {
  const days = daysUntilDate(date);

  if (!date) {
    return (
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate" lang="si">
            {label}
          </span>
        </div>
        <p className="text-xs font-bold text-neutral-400">{T.noDate}</p>
      </div>
    );
  }

  const expired = days <= 0;
  const urgent = days > 0 && days <= ALERT_WINDOW_DAYS;
  const safe = days > ALERT_WINDOW_DAYS;

  const shell = expired
    ? "border-rose-300 bg-gradient-to-br from-rose-50 to-rose-100/80"
    : urgent
      ? "border-amber-300 bg-gradient-to-br from-amber-50 to-[#FFF8E1]"
      : "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white";

  const badge = expired
    ? "bg-rose-600 text-white animate-pulse"
    : urgent
      ? "bg-amber-500 text-amber-950"
      : "bg-emerald-600 text-white";

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-2xl border px-3 py-3 transition-shadow hover:shadow-sm ${shell}`}
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-neutral-600">
            {label}
          </span>
        </div>
        <span className="shrink-0 text-[9px] font-bold text-neutral-400">{labelEn}</span>
      </div>
      <p className="mb-2 text-[11px] font-semibold text-neutral-500">{formatDate(date)}</p>
      <span
        className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${badge}`}
      >
        {expired ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span lang="si">{T.expired}</span>
          </>
        ) : (
          <span lang="si">
            {T.daysLeft} {padDays(days)} {T.daysSuffix}
          </span>
        )}
      </span>
      {safe ? (
        <p className="mt-1.5 text-[10px] font-bold text-emerald-700">OK</p>
      ) : null}
    </div>
  );
}

function AlertList({ alerts, variant }) {
  const isDoc = variant === "document";
  return (
    <ul className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {alerts.map((item, i) => {
          const expired = item.days <= 0;
          return (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl border px-4 py-3 ${
                expired
                  ? "border-rose-400 bg-white/90 shadow-[0_0_0_1px_rgba(244,63,94,0.2)]"
                  : isDoc
                    ? "border-amber-200/80 bg-white/75"
                    : "border-sky-200/80 bg-white/80"
              }`}
            >
              <p
                className={`font-mono text-sm font-bold tracking-wide sm:text-base ${
                  expired ? "text-rose-900" : isDoc ? "text-amber-950" : "text-sky-950"
                }`}
              >
                {alertMessage(item)}
              </p>
              {expired ? (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  {T.expired}
                </span>
              ) : null}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function AlertGroup({ title, icon: Icon, alerts, variant }) {
  const expiredCount = alerts.filter((a) => a.days <= 0).length;
  const isDoc = variant === "document";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-[24px] border-2 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
        isDoc
          ? "border-amber-300 bg-gradient-to-br from-[#FFF8E1] via-[#FFECB3] to-[#FFE082]"
          : "border-sky-300 bg-gradient-to-br from-sky-50 via-[#E0F2FE] to-sky-100"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3
          className={`flex items-center gap-2 text-lg font-black ${
            isDoc ? "text-amber-950" : "text-sky-950"
          }`}
          lang="si"
        >
          <Icon className={`h-5 w-5 shrink-0 ${isDoc ? "text-amber-600" : "text-sky-600"}`} />
          {title}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
            isDoc ? "bg-amber-200/80 text-amber-950" : "bg-sky-200/80 text-sky-950"
          }`}
        >
          {alerts.length}
        </span>
        {expiredCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-black text-white animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            {expiredCount} expired
          </span>
        ) : null}
      </div>
      <AlertList alerts={alerts} variant={variant} />
    </motion.div>
  );
}

function SplitFleetAlertPanel({ documentAlerts, serviceAlerts }) {
  if (documentAlerts.length === 0 && serviceAlerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
      >
        <p className="flex items-center gap-2 text-sm font-bold text-neutral-500" lang="si">
          <Bell className="h-5 w-5 text-neutral-400" />
          {T.alertEmpty}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="mb-8 grid w-full gap-4 lg:grid-cols-2">
      {documentAlerts.length > 0 ? (
        <AlertGroup
          title={T.docAlertTitle}
          icon={FileText}
          alerts={documentAlerts}
          variant="document"
        />
      ) : null}
      {serviceAlerts.length > 0 ? (
        <AlertGroup
          title={T.serviceAlertTitle}
          icon={Settings2}
          alerts={serviceAlerts}
          variant="service"
        />
      ) : null}
    </div>
  );
}

function VehicleTypeFilter({ selectedType, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TYPE_FILTER_PILLS.map((pill) => {
        const active = selectedType === pill.id;
        return (
          <button
            key={pill.id}
            type="button"
            onClick={() => onChange(pill.id)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
              active
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <span lang="si">{pill.labelSi}</span>
            <span className="opacity-70"> ({pill.labelEn})</span>
          </button>
        );
      })}
    </div>
  );
}

function FleetTabs({ activeTab, onChange, documentCount, serviceCount }) {
  const tabs = [
    {
      id: TAB_DOCUMENTS,
      label: T.tabDocuments,
      labelEn: T.tabDocumentsEn,
      icon: FileText,
      count: documentCount,
    },
    {
      id: TAB_SERVICE,
      label: T.tabService,
      labelEn: T.tabServiceEn,
      icon: Wrench,
      count: serviceCount,
    },
  ];

  return (
    <div className="flex rounded-2xl bg-neutral-200/50 p-1.5">
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
                layoutId="fleetTabPill"
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
            <span
              className={`relative z-10 rounded-full px-2 py-0.5 text-[10px] font-black ${
                active ? "bg-neutral-950 text-white" : "bg-neutral-300/80 text-neutral-600"
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

function VehicleCardHeader({ vehicle, onEdit, onDelete }) {
  const meta = vehicleTypeMeta(vehicle.vehicle_type);
  const TypeIcon = meta.icon;

  return (
    <div className="mb-4 flex w-full items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <SriLankanPlateBadge vehicle={vehicle} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-800">
            <TypeIcon className="h-3.5 w-3.5" />
            <span lang="si">{meta.label}</span>
            <span className="text-neutral-400">({meta.labelEn})</span>
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(vehicle)}
          className={ICON_BTN}
          aria-label={T.formUpdate}
        >
          <Edit2 className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(vehicle)}
          className={`${ICON_BTN} hover:text-rose-600`}
          aria-label={T.deleteConfirm}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function ServiceKmPanel({ vehicle }) {
  const kmGap = vehicle.service_due_km - vehicle.current_km;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-neutral-400" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
            {T.current}
          </p>
          <p className="font-mono text-sm font-black text-neutral-900">
            {formatKm(vehicle.current_km)} km
          </p>
        </div>
      </div>
      <div className="h-8 w-px bg-neutral-200" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          {T.kmDue}
        </p>
        <p className="font-mono text-sm font-black text-neutral-900">
          {formatKm(vehicle.service_due_km)} km
        </p>
      </div>
      {vehicle.service_due_km > 0 ? (
        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold ${
            kmGap <= 0
              ? "bg-rose-100 text-rose-800 animate-pulse"
              : kmGap <= 500
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {kmGap <= 0 ? "Service required (KM)" : `${formatKm(kmGap)} km remaining`}
        </span>
      ) : null}
    </div>
  );
}

function VehicleCard({ vehicle, view, onEdit, onDelete }) {
  const borderAccent =
    view === TAB_DOCUMENTS ? "border-l-amber-500" : "border-l-sky-500";

  return (
    <motion.article
      layout
      variants={staggerChild}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      whileHover={cardHoverMotion}
      className={`flex min-w-0 flex-col rounded-[28px] border border-neutral-100 border-l-8 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ${borderAccent}`}
    >
      <VehicleCardHeader vehicle={vehicle} onEdit={onEdit} onDelete={onDelete} />

      {view === TAB_DOCUMENTS ? (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
          {DOCUMENT_TRACKERS.map((tracker) => (
            <CountdownGauge
              key={tracker.key}
              date={vehicle[tracker.key]}
              label={tracker.label}
              labelEn={tracker.labelEn}
              icon={tracker.icon}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <CountdownGauge
            date={vehicle.service_due_date}
            label={SERVICE_DATE_TRACKER.label}
            labelEn={SERVICE_DATE_TRACKER.labelEn}
            icon={SERVICE_DATE_TRACKER.icon}
          />
          <ServiceKmPanel vehicle={vehicle} />
        </div>
      )}
    </motion.article>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedTab, setFeedTab] = useState(TAB_DOCUMENTS);
  const [selectedType, setSelectedType] = useState(TYPE_ALL);

  const documentAlerts = useMemo(() => buildDocumentAlerts(vehicles), [vehicles]);
  const serviceAlerts = useMemo(() => buildServiceAlerts(vehicles), [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (selectedType === TYPE_ALL) return vehicles;
    return vehicles.filter((v) => v.vehicle_type === selectedType);
  }, [vehicles, selectedType]);

  const refresh = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from("vehicles")
      .select("*")
      .order("province_code", { ascending: true })
      .order("series_code", { ascending: true })
      .order("sequence_number", { ascending: true });
    if (fetchErr) {
      console.error("Supabase Fetch Error Detailed:", fetchErr);
      throw new Error(dbError(fetchErr));
    }
    setVehicles((data ?? []).map(mapVehicle));
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

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const startEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      province_code: String(vehicle.province_code ?? ""),
      series_code: String(vehicle.series_code ?? ""),
      sequence_number: String(vehicle.sequence_number ?? ""),
      vehicle_type: normalizeVehicleType(vehicle.vehicle_type),
      license_expire_date: vehicle.license_expire_date,
      insurance_expire_date: vehicle.insurance_expire_date,
      service_due_date: vehicle.service_due_date,
      service_due_km: vehicle.service_due_km ? String(vehicle.service_due_km) : "",
      current_km: vehicle.current_km ? String(vehicle.current_km) : "",
    });
    setError("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(T.deleteConfirm)) return;
    setError("");
    try {
      const { error: delErr } = await supabase.from("vehicles").delete().eq("id", vehicle.id);
      if (delErr) throw delErr;
      setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
      if (editingId === vehicle.id) resetForm();
    } catch (err) {
      setError(dbError(err));
    }
  };

  const saveVehicle = async (ev) => {
    ev.preventDefault();
    const province = formatPlateProvince(form.province_code);
    const series = formatPlateSeries(form.series_code);
    const number = formatPlateSequence(form.sequence_number);
    if (!province || !series || !number) {
      setError("Please complete province, series, and number for vehicle number");
      return;
    }
    setSaving(true);
    setError("");
    const payload = buildPayload({
      ...form,
      province_code: province,
      series_code: series,
      sequence_number: number,
    });
    try {
      if (editingId) {
        const { data, error: upErr } = await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", editingId)
          .select("*")
          .single();
        if (upErr) throw upErr;
        const updated = mapVehicle(data);
        setVehicles((prev) =>
          prev
            .map((v) => (v.id === updated.id ? updated : v))
            .sort(comparePlates)
        );
        resetForm();
      } else {
        const { data, error: insErr } = await supabase
          .from("vehicles")
          .insert(payload)
          .select("*")
          .single();
        if (insErr) throw insErr;
        const created = mapVehicle(data);
        setVehicles((prev) => [...prev, created].sort(comparePlates));
        resetForm();
      }
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

      <SplitFleetAlertPanel
        documentAlerts={documentAlerts}
        serviceAlerts={serviceAlerts}
      />

      <div className="grid w-full gap-8 xl:grid-cols-[1.2fr_minmax(0,1fr)]">
        <motion.section
          variants={staggerChild}
          initial="hidden"
          animate="show"
          className="h-fit w-full rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] xl:sticky xl:top-8"
        >
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-neutral-950">
            <Plus className="h-5 w-5" />
            <span lang="si">{editingId ? T.formUpdate : T.formTitle}</span>
          </h2>

          <form onSubmit={saveVehicle} className="w-full min-w-0 space-y-4">
            <PlateInputRow form={form} setForm={setForm} />

            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                {T.vehicleType}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {VEHICLE_TYPES.map((type) => {
                  const active = form.vehicle_type === type.id;
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, vehicle_type: type.id }))}
                      className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-xs font-bold transition-all ${
                        active
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-center leading-tight" lang="si">
                        {type.label}
                      </span>
                      <span className="text-[10px] font-semibold opacity-70">
                        ({type.labelEn})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-800/80">
              <FileText className="h-4 w-4" />
              {T.docSection}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                  {T.licenseExpire}
                </label>
                <input
                  type="date"
                  className={INPUT}
                  value={form.license_expire_date}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, license_expire_date: ev.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                  {T.insuranceExpire}
                </label>
                <input
                  type="date"
                  className={INPUT}
                  value={form.insurance_expire_date}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, insurance_expire_date: ev.target.value }))
                  }
                />
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-sky-800/80">
              <Wrench className="h-4 w-4" />
              {T.serviceSection}
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                {T.serviceDueDate}
              </label>
              <input
                type="date"
                className={INPUT}
                value={form.service_due_date}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, service_due_date: ev.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                  {T.serviceDueKm}
                </label>
                <input
                  type="number"
                  min="0"
                  className={INPUT}
                  value={form.service_due_km}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, service_due_km: ev.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-neutral-500">
                  {T.currentKm}
                </label>
                <input
                  type="number"
                  min="0"
                  className={INPUT}
                  value={form.current_km}
                  onChange={(ev) => setForm((f) => ({ ...f, current_km: ev.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-neutral-950 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60"
              >
                {saving ? "..." : editingId ? T.update : T.save}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-neutral-200 px-6 py-4 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50"
                >
                  {T.cancel}
                </button>
              ) : null}
            </div>
          </form>
        </motion.section>

        <section className="min-w-0 w-full">
          <div className="mb-6 flex flex-col gap-4">
            <h2 className="text-lg font-black text-neutral-950" lang="si">
              {T.fleetTitle}
            </h2>
            <FleetTabs
              activeTab={feedTab}
              onChange={setFeedTab}
              documentCount={vehicles.length}
              serviceCount={vehicles.length}
            />
            <VehicleTypeFilter selectedType={selectedType} onChange={setSelectedType} />
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
            </div>
          ) : vehicles.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-lg font-bold text-neutral-400"
              lang="si"
            >
              {feedTab === TAB_DOCUMENTS ? T.emptyDocuments : T.emptyService}
            </motion.p>
          ) : filteredVehicles.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-lg font-bold text-neutral-400"
              lang="si"
            >
              {T.emptyFilter}
            </motion.p>
          ) : (
            <motion.div
              className="grid w-full min-w-0 grid-cols-1 gap-6 2xl:grid-cols-2"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={`${vehicle.id}-${feedTab}-${selectedType}`}
                    vehicle={vehicle}
                    view={feedTab}
                    onEdit={startEdit}
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
