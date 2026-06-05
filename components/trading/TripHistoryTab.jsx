"use client";

import { AnimatePresence } from "framer-motion";
import { LABELS } from "@/lib/trading/labels";
import { TripCard } from "./TripCard";

/**
 * @typedef {import('@/lib/trading/types').Trip} Trip
 */

/**
 * @param {Object} props
 * @param {Trip[]} props.trips
 * @param {boolean} props.isLoading
 */
export function TripHistoryTab({ trips, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-3xl bg-neutral-100/80"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-surface-muted/50 px-8 py-20 text-center">
        <p className="text-xl font-semibold text-neutral-800" lang="si">
          {LABELS.emptyTripsTitle.si}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence mode="popLayout">
        {trips.map((trip, index) => (
          <TripCard key={trip.id} trip={trip} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
}
