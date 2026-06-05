"use client";

import { formatCurrency } from "@/lib/trading/calculations";
import { BilingualText } from "@/components/ui/BilingualText";

/**
 * @param {Object} props
 * @param {string} props.labelSi
 * @param {string} props.labelEn
 * @param {number} props.value
 * @param {'default' | 'profit' | 'loss' | 'expense'} [props.variant]
 * @param {boolean} [props.highlight]
 */
export function FinancialStat({
  labelSi,
  labelEn,
  value,
  variant = "default",
  highlight = false,
}) {
  const valueColors = {
    default: "text-neutral-900",
    profit: "text-emerald-600",
    loss: "text-red-500",
    expense: "text-orange-500",
  };

  return (
    <div
      className={`rounded-2xl px-3 py-2.5 ${
        highlight ? "bg-brand-orange-light/60" : "bg-transparent"
      }`}
    >
      <BilingualText si={labelSi} en={labelEn} variant="stat" />
      <p
        className={`mt-1 text-[15px] font-semibold tabular-nums tracking-tight sm:text-base ${valueColors[variant]}`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}
