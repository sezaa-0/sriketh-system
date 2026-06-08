export const FUEL_STATUS = {
  PAID: "Paid",
  PENDING: "Pending",
  PARTIAL: "Partially Paid",
};

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function deriveFuelStatus(totalAmount, remainingBalance) {
  const total = toNum(totalAmount);
  const remaining = Math.max(0, toNum(remainingBalance));
  if (remaining <= 0) return FUEL_STATUS.PAID;
  if (remaining >= total) return FUEL_STATUS.PENDING;
  return FUEL_STATUS.PARTIAL;
}

export function buildFuelLogInsertPayload(form) {
  const totalAmount = toNum(form.amount);
  const isCredit = Boolean(form.is_credit);

  return {
    vehicle_no: String(form.vehicle_no ?? "").trim(),
    fuel_station: String(form.fuel_station ?? "").trim(),
    total_amount: totalAmount,
    is_credit: isCredit,
    status: isCredit ? FUEL_STATUS.PENDING : FUEL_STATUS.PAID,
    remaining_balance: isCredit ? totalAmount : 0,
  };
}

export function buildFuelLogUpdatePayload(form, paymentsSum = 0) {
  const totalAmount = toNum(form.amount);
  const isCredit = Boolean(form.is_credit);

  if (!isCredit) {
    return {
      vehicle_no: String(form.vehicle_no ?? "").trim(),
      fuel_station: String(form.fuel_station ?? "").trim(),
      total_amount: totalAmount,
      is_credit: false,
      status: FUEL_STATUS.PAID,
      remaining_balance: 0,
    };
  }

  const paid = toNum(paymentsSum);
  const remaining = Math.max(0, totalAmount - paid);

  return {
    vehicle_no: String(form.vehicle_no ?? "").trim(),
    fuel_station: String(form.fuel_station ?? "").trim(),
    total_amount: totalAmount,
    is_credit: true,
    remaining_balance: remaining,
    status: deriveFuelStatus(totalAmount, remaining),
  };
}

export function computeInstallmentUpdate(log, amountPaid) {
  const totalAmount = toNum(log.total_amount);
  const remaining = Math.max(0, toNum(log.remaining_balance) - toNum(amountPaid));

  return {
    remaining_balance: remaining,
    status: deriveFuelStatus(totalAmount, remaining),
  };
}

export function sumFuelOutstanding(logs) {
  return (logs ?? [])
    .filter((row) => row?.status !== FUEL_STATUS.PAID)
    .reduce((sum, row) => sum + toNum(row.remaining_balance), 0);
}

export function groupFuelOutstandingByStation(logs) {
  const totals = new Map();

  for (const row of logs ?? []) {
    if (row?.status === FUEL_STATUS.PAID) continue;
    const balance = toNum(row.remaining_balance);
    if (balance <= 0) continue;
    const station = String(row.fuel_station ?? "").trim() || "Unknown Station";
    totals.set(station, (totals.get(station) ?? 0) + balance);
  }

  return [...totals.entries()]
    .map(([station, amount]) => ({ id: `fuel-station-${station}`, station, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function uniqueFuelStations(logs) {
  const names = new Set();
  for (const row of logs ?? []) {
    const name = String(row.fuel_station ?? "").trim();
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
