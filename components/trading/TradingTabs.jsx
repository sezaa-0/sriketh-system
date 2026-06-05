"use client";

import { motion } from "framer-motion";
import { LABELS } from "@/lib/trading/labels";

/** @typedef {import('@/lib/trading/types').TradingTabId} TradingTabId */

/**
 * @param {Object} props
 * @param {TradingTabId} props.activeTab
 * @param {(tab: TradingTabId) => void} props.onTabChange
 * @param {number} [props.tripCount]
 */
export function TradingTabs({ activeTab, onTabChange, tripCount = 0 }) {
  const tabs = [
    { id: /** @type {const} */ ("history"), label: LABELS.tabHistory.si, badge: tripCount },
    { id: /** @type {const} */ ("log"), label: LABELS.tabLogTrip.si },
  ];

  return (
    <div className="relative flex rounded-2xl border border-neutral-100 bg-surface-muted/80 p-1 shadow-sm">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 sm:px-4 sm:py-3 ${
              isActive ? "text-neutral-900" : "text-neutral-500"
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="trading-tab-pill"
                className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-neutral-100/80"
                transition={{ type: "spring", damping: 28, stiffness: 380 }}
              />
            ) : null}
            <span className="relative text-[13px] font-semibold sm:text-[14px]" lang="si">
              {tab.label}
            </span>
            {tab.badge !== undefined && tab.badge > 0 ? (
              <span
                className={`relative rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
