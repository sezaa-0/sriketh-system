export const ADD_NEW_VARIETY = "__add_new__";
export const BSS_COMMODITY_TYPES = ["Paddy", "Maize", "Rice", "Black Seed"];
export const BSS_PAYMENT_STATUSES = ["Pending", "Settled"];
export const BSS_PAYMENT_METHODS = ["Cash", "Cheque", "Credit"];

export const BSS_INITIAL_FORM = {
  vehicle_no: "",
  driver_name: "",
  commodity_type: "Paddy",
  variety: "",
  variety_select: "",
  new_variety_name: "",
  total_kg: "",
  buying_price_per_kg: "",
  supplier_name: "",
  amount_paid_to_supplier: "",
  buyer_name: "",
  selling_price_per_kg: "",
  payment_status: "Pending",
  payment_method: "Cash",
  additional_expenses: "",
};

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function computeBssMetrics(form) {
  const totalKg = toNum(form.total_kg);
  const buyingPricePerKg = toNum(form.buying_price_per_kg);
  const sellingPricePerKg = toNum(form.selling_price_per_kg);
  const amountPaidToSupplier = toNum(form.amount_paid_to_supplier);
  const additionalExpenses = toNum(form.additional_expenses);

  const totalBuyingAmount = totalKg * buyingPricePerKg;
  const totalSellingAmount = totalKg * sellingPricePerKg;
  const grossProfit = totalSellingAmount - totalBuyingAmount;
  const netProfit = grossProfit - additionalExpenses;
  const supplierBalance = totalBuyingAmount - amountPaidToSupplier;

  return {
    totalKg,
    buyingPricePerKg,
    sellingPricePerKg,
    amountPaidToSupplier,
    additionalExpenses,
    totalBuyingAmount,
    totalSellingAmount,
    grossProfit,
    netProfit,
    supplierBalance,
  };
}

export function getBssVehicleNo(row) {
  return row?.vehicle_no || row?.lorry_number || "—";
}

export function getBssVariety(row) {
  return row?.variety || row?.paddy_variety || "—";
}

export function getBssTotalKg(row) {
  return toNum(row?.total_kg ?? row?.buying_weight_kg);
}

export function getBssTotalBuyingAmount(row) {
  return toNum(row?.total_buying_amount ?? row?.total_cost);
}

export function getBssTotalSellingAmount(row) {
  return toNum(row?.total_selling_amount ?? row?.total_revenue);
}

export function getBssAdditionalExpenses(row) {
  return toNum(row?.additional_expenses ?? row?.extra_expenses);
}

export function getBssNetProfit(row) {
  if (row?.net_profit != null && row.net_profit !== "") {
    return toNum(row.net_profit);
  }
  return (
    getBssTotalSellingAmount(row) -
    getBssTotalBuyingAmount(row) -
    getBssAdditionalExpenses(row)
  );
}

export function getBssSupplierBalance(row) {
  if (row?.supplier_balance != null && row.supplier_balance !== "") {
    return toNum(row.supplier_balance);
  }
  const paid = toNum(row?.amount_paid_to_supplier ?? row?.advance_cash_paid);
  return getBssTotalBuyingAmount(row) - paid;
}

export function getBssPaymentStatus(row) {
  if (row?.payment_status === "Settled" || row?.payment_status === "Pending") {
    return row.payment_status;
  }
  if (row?.advance_settlement_status === "settled") return "Settled";
  return "Pending";
}

export function getBssPaymentMethod(row) {
  if (BSS_PAYMENT_METHODS.includes(row?.payment_method)) {
    return row.payment_method;
  }
  return "Cash";
}

export function normalizeBssRow(row) {
  if (!row) return row;
  return {
    ...row,
    vehicle_no: getBssVehicleNo(row),
    variety: getBssVariety(row),
    total_kg: getBssTotalKg(row),
    total_buying_amount: getBssTotalBuyingAmount(row),
    total_selling_amount: getBssTotalSellingAmount(row),
    net_profit: getBssNetProfit(row),
    supplier_balance: getBssSupplierBalance(row),
    payment_status: getBssPaymentStatus(row),
    payment_method: getBssPaymentMethod(row),
    supplier_name: row.supplier_name || "",
    buyer_name: row.buyer_name || "",
    amount_paid_to_supplier: toNum(
      row.amount_paid_to_supplier ?? row.advance_cash_paid
    ),
    buying_price_per_kg: toNum(
      row.buying_price_per_kg ?? row.buying_rate_per_kg
    ),
    selling_price_per_kg: toNum(
      row.selling_price_per_kg ?? row.selling_rate_per_kg
    ),
    additional_expenses: getBssAdditionalExpenses(row),
  };
}

export function resolveBssVariety(form) {
  if (form.commodity_type === "Paddy") {
    if (form.variety_select === ADD_NEW_VARIETY) {
      const newName = String(form.new_variety_name ?? "").trim();
      if (!newName) throw new Error("Please enter a new variety name.");
      return newName;
    }
    return String(form.variety_select || form.variety || "").trim() || null;
  }
  return String(form.variety ?? "").trim() || null;
}

export function buildBssPayload(form, metrics, varietyValue) {
  const paymentStatus = BSS_PAYMENT_STATUSES.includes(form.payment_status)
    ? form.payment_status
    : "Pending";
  const paymentMethod = BSS_PAYMENT_METHODS.includes(form.payment_method)
    ? form.payment_method
    : "Cash";

  return {
    vehicle_no: form.vehicle_no.trim(),
    lorry_number: form.vehicle_no.trim(),
    driver_name: form.driver_name.trim(),
    commodity_type: form.commodity_type,
    variety: varietyValue,
    paddy_variety: varietyValue,
    total_kg: metrics.totalKg,
    buying_weight_kg: metrics.totalKg,
    buying_price_per_kg: metrics.buyingPricePerKg,
    buying_rate_per_kg: metrics.buyingPricePerKg,
    total_buying_amount: metrics.totalBuyingAmount,
    total_cost: metrics.totalBuyingAmount,
    supplier_name: form.supplier_name.trim(),
    amount_paid_to_supplier: metrics.amountPaidToSupplier,
    advance_cash_paid: metrics.amountPaidToSupplier,
    supplier_balance: metrics.supplierBalance,
    buyer_name: form.buyer_name.trim(),
    selling_price_per_kg: metrics.sellingPricePerKg,
    selling_rate_per_kg: metrics.sellingPricePerKg,
    total_selling_amount: metrics.totalSellingAmount,
    total_revenue: metrics.totalSellingAmount,
    additional_expenses: metrics.additionalExpenses,
    extra_expenses: metrics.additionalExpenses,
    gross_profit: metrics.grossProfit,
    net_profit: metrics.netProfit,
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    advance_settlement_status:
      paymentStatus === "Settled" ? "settled" : "payable_to_buyer",
    advance_difference: metrics.supplierBalance,
    is_active: true,
    settled_at: paymentStatus === "Settled" ? new Date().toISOString() : null,
  };
}

export function buildBssFormFromRecord(record) {
  const row = normalizeBssRow(record);
  const variety = row.variety === "—" ? "" : row.variety;

  return {
    vehicle_no: row.vehicle_no === "—" ? "" : row.vehicle_no,
    driver_name: row.driver_name || "",
    commodity_type: row.commodity_type || "Paddy",
    variety,
    variety_select: variety,
    new_variety_name: "",
    total_kg: row.total_kg ? String(row.total_kg) : "",
    buying_price_per_kg: row.buying_price_per_kg
      ? String(row.buying_price_per_kg)
      : "",
    supplier_name: row.supplier_name || "",
    amount_paid_to_supplier: row.amount_paid_to_supplier
      ? String(row.amount_paid_to_supplier)
      : "",
    buyer_name: row.buyer_name || "",
    selling_price_per_kg: row.selling_price_per_kg
      ? String(row.selling_price_per_kg)
      : "",
    additional_expenses: row.additional_expenses ? String(row.additional_expenses) : "",
    payment_status: row.payment_status,
    payment_method: row.payment_method,
  };
}

export function sumBssOutstandingReceivables(records) {
  return (records || [])
    .filter((row) => row?.is_active !== false && getBssPaymentStatus(row) === "Pending")
    .reduce((sum, row) => sum + getBssTotalSellingAmount(row), 0);
}
