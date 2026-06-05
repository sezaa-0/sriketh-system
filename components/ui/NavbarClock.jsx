"use client";

import { useEffect, useState } from "react";
import { formatLiveDateTime } from "@/lib/datetime";

/**
 * Live bilingual date/time — client-only to avoid hydration mismatch.
 */
export function NavbarClock() {
  const [display, setDisplay] = useState(/** @type {string | null} */ (null));
  const [iso, setIso] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDisplay(formatLiveDateTime(now));
      setIso(now.toISOString());
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className="min-w-0 max-w-[58%] shrink text-right sm:max-w-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {display && iso ? (
        <time
          dateTime={iso}
          className="block truncate font-mono text-[10px] tabular-nums leading-tight tracking-tight text-neutral-500 sm:text-xs"
        >
          {display}
        </time>
      ) : (
        <span
          className="inline-block h-3 w-36 animate-pulse rounded bg-neutral-100 sm:w-52"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
