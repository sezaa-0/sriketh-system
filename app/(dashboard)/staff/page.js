"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Truck,
  Users,
  Camera,
  Phone,
  MapPin,
  User,
  Calendar,
  Route,
  Wallet,
  Banknote,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ImagePlus,
  Edit2,
  Trash2,
} from "lucide-react";

const ROLE_DRIVER = "driver";
const ROLE_HELPER = "helper";

const T = {
  pageTitle: "Staff & Payroll",
  tabDrivers: "Drivers",
  tabHelpers: "Helpers",
  addStaff: "Add New Staff Member",
  saveStaff: "Save Staff",
  roleLabel: "Role",
  roleDriver: "Driver",
  roleHelper: "Helper / Crew",
  optionalPhoto: "Photo (Optional)",
  choosePhoto: "Choose Photo",
  cancel: "Cancel",
  emptyDrivers: "No registered drivers",
  emptyHelpers: "No registered helpers",
  name: "Name",
  phone: "Phone",
  address: "Address",
  active: "Active",
  inactive: "Inactive",
  basicInfo: "Basic Information",
  tripHistory: "Trip History",
  moneyLedger: "Money & Loan Ledger",
  tripWages: "Trip Wages",
  advances: "Advances / Hand Loans",
  advanceAmount: "Advance Amount",
  advanceDesc: "Description",
  addAdvance: "Add Advance",
  outstanding: "Total Outstanding",
  noTrips: "No trip history",
  noWages: "No wage records",
  noAdvances: "No advance records",
  uploadPhoto: "Change Photo",
  updateStaff: "Update Staff",
  updateStaffSave: "Update",
  deleteConfirm: "Are you sure you want to remove this staff record from the system?",
  confirmDelete: "Yes, Remove",
};

const INITIAL_STAFF_FORM = {
  name: "",
  phone: "",
  local_address: "",
  role: ROLE_DRIVER,
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

function mapStaff(row) {
  const role = String(row.role ?? "").trim() === ROLE_HELPER ? ROLE_HELPER : ROLE_DRIVER;
  return {
    id: String(row.id),
    name: String(row.name ?? "").trim(),
    phone: String(row.phone ?? "").trim(),
    local_address: String(row.local_address ?? "").trim(),
    role,
    photo_url: String(row.photo_url ?? "").trim(),
    is_active: Boolean(row.is_active ?? true),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapAdvance(row) {
  return {
    id: String(row.id),
    staff_id: String(row.staff_id),
    amount: Number(row.amount ?? 0),
    description: String(row.description ?? "").trim(),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapHire(row) {
  return {
    id: String(row.id),
    lorry_number: String(row.lorry_number ?? "").trim(),
    hirer_name: String(row.hirer_name ?? "").trim(),
    driver_id: row.driver_id ? String(row.driver_id) : "",
    helper_id: row.helper_id ? String(row.helper_id) : "",
    depart_date: row.depart_date ? String(row.depart_date) : "",
    return_date: row.return_date ? String(row.return_date) : "",
    driver_wage: Number(row.driver_wages ?? row.driver_wage ?? 0),
    helper_wage: Number(row.helper_wages ?? row.helper_wage ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function hireWageForRole(hire, role) {
  return role === ROLE_DRIVER ? hire.driver_wage : hire.helper_wage;
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hireTripLine(hire) {
  const date = formatDate(hire.depart_date || hire.created_at);
  const dest = hire.hirer_name || "—";
  const lorry = hire.lorry_number || "—";
  return `📅 ${date} — 🚛 Hire trip to ${dest} with lorry ${lorry}.`;
}

function staffMatchesHire(staff, hire) {
  if (staff.role === ROLE_DRIVER) {
    return hire.driver_id === staff.id;
  }
  return hire.helper_id === staff.id;
}

function buildStaffLedger(staff, hires) {
  const tripEntries = [];
  const wageEntries = [];

  for (const h of hires) {
    if (!staffMatchesHire(staff, h)) continue;
    tripEntries.push({
      id: `hire-${h.id}`,
      sortKey: h.depart_date || h.created_at,
      line: hireTripLine(h),
    });
    const amount = hireWageForRole(h, staff.role);
    if (amount > 0) {
      wageEntries.push({
        id: `w-${h.id}`,
        sortKey: h.depart_date || h.created_at,
        label: `Hire — ${h.lorry_number || "—"}`,
        amount,
      });
    }
  }

  const byDate = (a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime();
  tripEntries.sort(byDate);
  wageEntries.sort(byDate);

  const totalWages = wageEntries.reduce((s, w) => s + w.amount, 0);
  return { tripEntries, wageEntries, totalWages };
}

async function uploadStaffPhotoFile(staffId, file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${staffId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("staff-photos")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage.from("staff-photos").getPublicUrl(path);
  const photo_url = urlData?.publicUrl ?? "";
  const { error: dbErr } = await supabase.from("staff").update({ photo_url }).eq("id", staffId);
  if (dbErr) throw dbErr;
  return photo_url;
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

function RoleTabs({ activeTab, onChange, driverCount, helperCount }) {
  const tabs = [
    { id: ROLE_DRIVER, label: T.tabDrivers, icon: Truck, count: driverCount },
    { id: ROLE_HELPER, label: T.tabHelpers, icon: Users, count: helperCount },
  ];

  return (
    <div className="inline-flex w-full max-w-2xl rounded-[20px] bg-neutral-200/50 p-2 backdrop-blur-xl">
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
                layoutId="staffRoleTabPill"
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

function staffToForm(staff) {
  if (!staff) return { ...INITIAL_STAFF_FORM };
  return {
    name: staff.name ?? "",
    phone: staff.phone ?? "",
    local_address: staff.local_address ?? "",
    role: staff.role === ROLE_HELPER ? ROLE_HELPER : ROLE_DRIVER,
  };
}

function StaffFormModal({ open, editStaff, onClose, onCreated, onUpdated, setError }) {
  const isEdit = Boolean(editStaff?.id);
  const [form, setForm] = useState(INITIAL_STAFF_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_STAFF_FORM);
      setPhotoFile(null);
      setPhotoPreview("");
      setFormError("");
      return;
    }
    setForm(staffToForm(editStaff));
    setPhotoFile(null);
    setPhotoPreview(editStaff?.photo_url ?? "");
    setFormError("");
  }, [open, editStaff]);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError("");
    if (!String(form.name ?? "").trim()) {
      setFormError("Enter name");
      return;
    }
    setSaving(true);
    try {
      const role = form.role === ROLE_HELPER ? ROLE_HELPER : ROLE_DRIVER;
      const payload = {
        name: String(form.name).trim(),
        phone: String(form.phone ?? "").trim(),
        local_address: String(form.local_address ?? "").trim(),
        role,
      };

      if (isEdit) {
        let photo_url = editStaff.photo_url ?? "";
        if (photoFile) {
          photo_url = await uploadStaffPhotoFile(editStaff.id, photoFile);
        }
        const { data, error: upErr } = await supabase
          .from("staff")
          .update({ ...payload, photo_url })
          .eq("id", editStaff.id)
          .select("*")
          .single();
        if (upErr) throw upErr;
        const updated = mapStaff(data);
        onUpdated(updated, editStaff.role);
        onClose();
      } else {
        const { data, error: insErr } = await supabase
          .from("staff")
          .insert({ ...payload, photo_url: "" })
          .select("*")
          .single();
        if (insErr) throw insErr;

        let created = mapStaff(data);
        if (photoFile) {
          const photo_url = await uploadStaffPhotoFile(created.id, photoFile);
          created = { ...created, photo_url };
        }
        onCreated(created);
        onClose();
      }
    } catch (err) {
      const msg = dbError(err);
      setFormError(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-neutral-950/45 backdrop-blur-md"
            aria-label={T.cancel}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-neutral-100 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
            initial={{ opacity: 0, y: -28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-lg font-black text-neutral-950" lang="si">
                {isEdit ? T.updateStaff : T.addStaff}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] bg-[#F4F4F7] ring-2 ring-neutral-100 transition hover:ring-neutral-300"
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-neutral-400">
                      <ImagePlus className="h-7 w-7" />
                      <span className="text-[10px] font-bold">{T.optionalPhoto}</span>
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                    <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800"
                >
                  {T.choosePhoto}
                </button>
              </div>

              <input
                className={INPUT}
                placeholder={T.name}
                value={form.name}
                onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
                required
              />
              <input
                className={INPUT}
                placeholder={T.address}
                value={form.local_address}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, local_address: ev.target.value }))
                }
              />
              <input
                className={INPUT}
                placeholder={T.phone}
                inputMode="tel"
                value={form.phone}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, phone: ev.target.value }))
                }
              />

              <div className="relative">
                <select
                  className={`${INPUT} appearance-none pr-10`}
                  value={form.role}
                  onChange={(ev) =>
                    setForm((f) => ({
                      ...f,
                      role: ev.target.value === ROLE_HELPER ? ROLE_HELPER : ROLE_DRIVER,
                    }))
                  }
                >
                  <option value={ROLE_DRIVER}>{T.roleDriver}</option>
                  <option value={ROLE_HELPER}>{T.roleHelper}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <p className="mt-1.5 text-[11px] font-semibold text-neutral-400">{T.roleLabel}</p>
              </div>

              {formError ? (
                <p className="text-xs font-bold text-rose-600">{formError}</p>
              ) : null}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 hover:bg-neutral-200"
                >
                  {T.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-neutral-950 py-3.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  {saving ? "..." : isEdit ? T.updateStaffSave : T.saveStaff}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DeleteStaffModal({ target, onClose, onConfirm, deleting }) {
  return (
    <AnimatePresence>
      {target ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-neutral-950/50 backdrop-blur-md"
            aria-label={T.cancel}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.14)]"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <p className="text-center text-base font-bold leading-relaxed text-neutral-800" lang="si">
              {T.deleteConfirm}
            </p>
            {target.name ? (
              <p className="mt-2 text-center text-sm font-semibold text-neutral-500">
                {target.name}
              </p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="flex-1 rounded-2xl bg-neutral-100 py-3.5 text-sm font-bold text-neutral-700 hover:bg-neutral-200 disabled:opacity-60"
              >
                {T.cancel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={deleting}
                className="flex-1 rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? "..." : T.confirmDelete}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StaffCard({ staff, onOpen, onEdit, onDelete, onPhotoUploaded, uploading }) {
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await onPhotoUploaded(staff.id, file);
  };

  return (
    <motion.article
      layout
      variants={staggerChild}
      initial="hidden"
      animate="show"
      exit={{
        opacity: 0,
        x: -48,
        scale: 0.92,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
      }}
      whileHover={cardHoverMotion}
      className="relative flex min-w-0 cursor-pointer flex-col rounded-3xl border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)]"
      onClick={() => onOpen(staff)}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onOpen(staff);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="mb-4 flex w-full items-center justify-between">
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
            staff.is_active
              ? "bg-emerald-100 text-emerald-800"
              : "bg-neutral-200 text-neutral-600"
          }`}
        >
          {staff.is_active ? T.active : T.inactive}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              onEdit(staff);
            }}
            className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={T.updateStaff}
          >
            <Edit2 className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              onDelete(staff);
            }}
            className="rounded-xl p-2 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label={T.confirmDelete}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="relative mb-5 flex justify-center">
        <button
          type="button"
          className="group relative h-28 w-28 overflow-hidden rounded-[28px] bg-neutral-100 ring-2 ring-neutral-50"
          onClick={(ev) => {
            ev.stopPropagation();
            fileRef.current?.click();
          }}
          aria-label={T.uploadPhoto}
        >
          {staff.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={staff.photo_url}
              alt={staff.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-black text-neutral-400">
              {initials(staff.name)}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white opacity-0 group-hover:opacity-100" />
            ) : (
              <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
            )}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          onClick={(ev) => ev.stopPropagation()}
        />
      </div>

      <h3 className="text-center text-lg font-black tracking-tight text-neutral-950">
        {staff.name || "—"}
      </h3>
      <div className="mt-4 space-y-2.5 text-sm font-semibold text-neutral-600">
        <p className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
          {staff.phone || "—"}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
          <span className="leading-snug">{staff.local_address || "—"}</span>
        </p>
      </div>
    </motion.article>
  );
}

function StaffProfileDrawer({
  staff,
  hires,
  advances,
  onClose,
  onPhotoUploaded,
  onAdvanceAdded,
  uploadingPhoto,
}) {
  const [advanceForm, setAdvanceForm] = useState({ amount: "", description: "" });
  const [savingAdvance, setSavingAdvance] = useState(false);
  const [advanceError, setAdvanceError] = useState("");
  const fileRef = useRef(null);

  const ledger = useMemo(
    () => (staff ? buildStaffLedger(staff, hires) : { tripEntries: [], wageEntries: [], totalWages: 0 }),
    [staff, hires]
  );

  const staffAdvances = useMemo(
    () =>
      staff
        ? advances
            .filter((a) => a.staff_id === staff.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [],
    [staff, advances]
  );

  const totalAdvances = staffAdvances.reduce((s, a) => s + a.amount, 0);

  if (!staff) return null;

  const handleAdvance = async (ev) => {
    ev.preventDefault();
    setAdvanceError("");
    const amount = toNum(advanceForm.amount);
    if (amount <= 0) {
      setAdvanceError("Enter amount");
      return;
    }
    setSavingAdvance(true);
    try {
      const { error } = await supabase.from("staff_advances").insert({
        staff_id: staff.id,
        amount,
        description: String(advanceForm.description ?? "").trim(),
      });
      if (error) throw error;
      setAdvanceForm({ amount: "", description: "" });
      await onAdvanceAdded();
    } catch (err) {
      setAdvanceError(dbError(err));
    } finally {
      setSavingAdvance(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[32px] bg-[#F4F4F7] shadow-2xl sm:rounded-[32px]"
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200/80 bg-white px-6 py-4">
          <h2 className="text-xl font-black text-neutral-950">{staff.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <div className="grid gap-5 lg:grid-cols-3">
            {/* A. Basic Info */}
            <motion.section
              layout
              className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-1"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-neutral-400">
                <User className="h-4 w-4" />
                {T.basicInfo}
              </h3>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className="group relative mb-4 h-40 w-40 overflow-hidden rounded-[32px] bg-neutral-100"
                  onClick={() => fileRef.current?.click()}
                >
                  {staff.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={staff.photo_url}
                      alt={staff.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-4xl font-black text-neutral-300">
                      {initials(staff.name)}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                    {uploadingPhoto ? (
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    ) : (
                      <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                    )}
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) await onPhotoUploaded(staff.id, file);
                  }}
                />
                <p className="text-center text-2xl font-black text-neutral-950">{staff.name}</p>
                <p
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    staff.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {staff.is_active ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                  {staff.is_active ? T.active : T.inactive}
                </p>
                <div className="mt-6 w-full space-y-3 text-sm font-semibold text-neutral-700">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-neutral-400" />
                    {staff.phone || "—"}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    {staff.local_address || "—"}
                  </p>
                </div>
              </div>
            </motion.section>

            {/* B. Trip History */}
            <motion.section
              layout
              className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-2"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-neutral-400">
                <Route className="h-4 w-4" />
                {T.tripHistory}
              </h3>
              {ledger.tripEntries.length === 0 ? (
                <p className="py-8 text-center text-sm font-semibold text-neutral-400">{T.noTrips}</p>
              ) : (
                <ul className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                  {ledger.tripEntries.map((entry) => (
                    <motion.li
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 rounded-2xl bg-[#F4F4F7] px-4 py-3 text-sm font-semibold text-neutral-800"
                    >
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#E65100]" />
                      <span lang="si">{entry.line}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.section>

            {/* C. Money & Advances — full width row */}
            <motion.section
              layout
              className="rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] lg:col-span-3"
            >
              <h3 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-neutral-400">
                <Wallet className="h-4 w-4" />
                {T.moneyLedger}
              </h3>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-emerald-900">{T.tripWages}</p>
                    <Banknote className="h-5 w-5 text-emerald-700" />
                  </div>
                  <FinancialDisplay amount={ledger.totalWages} size="lg" />
                  <ul className="mt-4 max-h-[200px] space-y-2 overflow-y-auto">
                    {ledger.wageEntries.length === 0 ? (
                      <li className="text-xs font-semibold text-emerald-800/60">{T.noWages}</li>
                    ) : (
                      ledger.wageEntries.map((w) => (
                        <li
                          key={w.id}
                          className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-xs font-bold text-neutral-800"
                        >
                          <span>{w.label}</span>
                          <span>{moneyFullLkr(w.amount)}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="rounded-[24px] border border-amber-100 bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-amber-950">{T.advances}</p>
                    <FinancialDisplay amount={totalAdvances} size="sm" />
                  </div>
                  <p className="mb-3 text-xs font-bold text-amber-900/70">
                    {T.outstanding}: {formatSinhalaLakhCrore(totalAdvances).main}
                  </p>

                  <form onSubmit={handleAdvance} className="mb-4 space-y-2">
                    <input
                      className={INPUT}
                      placeholder={T.advanceAmount}
                      inputMode="decimal"
                      value={advanceForm.amount}
                      onChange={(ev) =>
                        setAdvanceForm((f) => ({ ...f, amount: ev.target.value }))
                      }
                    />
                    <input
                      className={INPUT}
                      placeholder={T.advanceDesc}
                      value={advanceForm.description}
                      onChange={(ev) =>
                        setAdvanceForm((f) => ({ ...f, description: ev.target.value }))
                      }
                    />
                    {advanceError ? (
                      <p className="text-xs font-bold text-rose-600">{advanceError}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={savingAdvance}
                      className="w-full rounded-2xl bg-neutral-950 py-3.5 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60"
                    >
                      {savingAdvance ? "..." : T.addAdvance}
                    </button>
                  </form>

                  <ul className="max-h-[160px] space-y-2 overflow-y-auto">
                    {staffAdvances.length === 0 ? (
                      <li className="text-xs font-semibold text-amber-900/60">{T.noAdvances}</li>
                    ) : (
                      staffAdvances.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-start justify-between gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-neutral-800"
                        >
                          <div className="min-w-0">
                            <p>{moneyFullLkr(a.amount)}</p>
                            {a.description ? (
                              <p className="mt-0.5 font-medium text-neutral-500">{a.description}</p>
                            ) : null}
                            <p className="mt-0.5 text-[10px] text-neutral-400">
                              {formatDate(a.created_at)}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [hires, setHires] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [activeTab, setActiveTab] = useState(ROLE_DRIVER);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const refresh = useCallback(async () => {
    setError("");
    const [staffRes, hiresRes, advRes] = await Promise.all([
      supabase.from("staff").select("*").order("name"),
      supabase.from("lorry_hires").select("*").order("created_at", { ascending: false }),
      supabase.from("staff_advances").select("*").order("created_at", { ascending: false }),
    ]);

    if (staffRes.error) throw staffRes.error;
    if (hiresRes.error) throw hiresRes.error;
    if (advRes.error) throw advRes.error;

    setStaffList((staffRes.data ?? []).map(mapStaff));
    setHires((hiresRes.data ?? []).map(mapHire));
    setAdvances((advRes.data ?? []).map(mapAdvance));
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

  const filteredStaff = useMemo(
    () => staffList.filter((s) => s.role === activeTab),
    [staffList, activeTab]
  );

  const driverCount = useMemo(
    () => staffList.filter((s) => s.role === ROLE_DRIVER).length,
    [staffList]
  );
  const helperCount = useMemo(
    () => staffList.filter((s) => s.role === ROLE_HELPER).length,
    [staffList]
  );

  const uploadPhoto = async (staffId, file) => {
    setUploadingId(staffId);
    setError("");
    try {
      const photo_url = await uploadStaffPhotoFile(staffId, file);
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, photo_url } : s))
      );
      setSelectedStaff((prev) =>
        prev && prev.id === staffId ? { ...prev, photo_url } : prev
      );
    } catch (err) {
      setError(dbError(err));
    } finally {
      setUploadingId(null);
    }
  };

  const openCreateModal = () => {
    setEditStaff(null);
    setFormModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditStaff(staff);
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setEditStaff(null);
  };

  const handleStaffCreated = (created) => {
    setStaffList((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "si"))
    );
    setActiveTab(created.role);
  };

  const handleStaffUpdated = (updated, prevRole) => {
    setStaffList((prev) =>
      prev
        .map((s) => (s.id === updated.id ? updated : s))
        .sort((a, b) => a.name.localeCompare(b.name, "si"))
    );
    setSelectedStaff((prev) => (prev?.id === updated.id ? updated : prev));
    if (prevRole !== updated.role) {
      setActiveTab(updated.role);
    }
  };

  const confirmDeleteStaff = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const { error: delErr } = await supabase
        .from("staff")
        .delete()
        .eq("id", deleteTarget.id);
      if (delErr) throw delErr;
      setStaffList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setSelectedStaff((prev) => (prev?.id === deleteTarget.id ? null : prev));
      setDeleteTarget(null);
    } catch (err) {
      setError(dbError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.main
      className="w-full min-h-screen bg-[#F4F4F7] px-8 lg:px-16 py-12"
      variants={pageEnter}
      initial="hidden"
      animate="show"
    >
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl" lang="si">
            {T.pageTitle}
          </h1>
          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Staff Registry & Enterprise Payroll
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 self-start rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          <span lang="si">+ {T.addStaff}</span>
        </button>
      </div>

      {error ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"
        >
          {error}
        </motion.p>
      ) : null}

      <StaffFormModal
        open={formModalOpen}
        editStaff={editStaff}
        onClose={closeFormModal}
        onCreated={handleStaffCreated}
        onUpdated={handleStaffUpdated}
        setError={setError}
      />

      <DeleteStaffModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteStaff}
        deleting={deleting}
      />

      <div className="mb-8">
        <RoleTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          driverCount={driverCount}
          helperCount={helperCount}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center text-lg font-bold text-neutral-400"
          lang="si"
        >
          {activeTab === ROLE_DRIVER ? T.emptyDrivers : T.emptyHelpers}
        </motion.p>
      ) : (
        <motion.div
          className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredStaff.map((staff, i) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                onOpen={setSelectedStaff}
                onEdit={openEditModal}
                onDelete={setDeleteTarget}
                onPhotoUploaded={uploadPhoto}
                uploading={uploadingId === staff.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedStaff ? (
          <StaffProfileDrawer
            staff={selectedStaff}
            hires={hires}
            advances={advances}
            onClose={() => setSelectedStaff(null)}
            onPhotoUploaded={uploadPhoto}
            onAdvanceAdded={refresh}
            uploadingPhoto={uploadingId === selectedStaff.id}
          />
        ) : null}
      </AnimatePresence>
    </motion.main>
  );
}
