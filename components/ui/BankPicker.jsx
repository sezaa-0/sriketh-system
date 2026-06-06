"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Check, ChevronDown } from "lucide-react";
import { CASH_IN_HAND_BANK, findBank } from "@/lib/sri-lankan-banks";

const BANK_LOGO_CLASS =
  "h-6 w-6 shrink-0 rounded-md border border-neutral-100 bg-white object-contain p-0.5";

export function BankLogo({ bank, className = BANK_LOGO_CLASS }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [bank?.logoUrl, bank?.id]);

  if (!bank) {
    return (
      <span
        className={`${className} flex items-center justify-center text-[8px] font-black text-neutral-400`}
      >
        ?
      </span>
    );
  }

  if (bank.isCash) {
    return (
      <span
        className={`${className} flex items-center justify-center bg-emerald-50 text-emerald-700`}
        title={bank.name}
      >
        <Banknote className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
    );
  }

  if (failed || !bank.logoUrl) {
    return (
      <span
        className={`${className} flex items-center justify-center text-[8px] font-black text-neutral-600`}
        title={bank.name}
      >
        {bank.short}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={bank.logoUrl}
      alt=""
      title={bank.name}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * @param {{
 *   value: string;
 *   onChange: (name: string) => void;
 *   banks: Array<{ id: string; name: string; short: string; logoUrl?: string | null; isCash?: boolean }>;
 *   placeholder?: string;
 * }} props
 */
export function BankPicker({ value, onChange, banks, placeholder = "Select a bank" }) {
  const [open, setOpen] = useState(false);
  const selected = findBank(value, banks) ?? (value === CASH_IN_HAND_BANK.name ? CASH_IN_HAND_BANK : null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-neutral-100 bg-[#EFEFEF]/70 px-4 py-3.5 text-left font-bold transition hover:border-neutral-200 focus:border-neutral-950 focus:bg-white focus:outline-none"
      >
        <BankLogo bank={selected} />
        <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-neutral-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close bank list"
              onClick={() => setOpen(false)}
            />
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 480, damping: 34 }}
              className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-[20px] border border-neutral-100 bg-white p-2 shadow-[0_16px_48px_rgba(0,0,0,0.12)] [scrollbar-width:thin] [scrollbar-color:rgb(163_163_163)_transparent]"
            >
              {banks.map((bank) => {
                const active = value === bank.name;
                return (
                  <li key={bank.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(bank.name);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        active ? "bg-neutral-100" : "hover:bg-[#F4F4F7]"
                      }`}
                    >
                      <BankLogo bank={bank} />
                      <span className="min-w-0 flex-1 text-sm font-bold text-neutral-900">
                        {bank.name}
                      </span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-neutral-900" /> : null}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
