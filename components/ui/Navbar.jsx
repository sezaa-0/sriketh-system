"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { NavbarClock } from "./NavbarClock";

function NavBackButton() {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 rounded-xl"
      aria-label="Back — Home"
    >
      <motion.span
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="inline-flex items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-bold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 sm:gap-1 sm:px-2.5 sm:py-2 sm:text-sm"
      >
        <ChevronLeft className="h-4 w-4 shrink-0 stroke-[2.5]" aria-hidden />
        <span>Back</span>
      </motion.span>
    </Link>
  );
}

/**
 * Ultra-slim fixed navbar — back (sub-routes), brand, live clock right.
 */
export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showBack = !isHome;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-100/90 bg-white/85 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur-md">
      <div className="mx-auto flex h-10 max-w-6xl items-center gap-2 px-3 sm:h-11 sm:gap-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {showBack ? <NavBackButton /> : null}
          <Link
            href="/"
            className={`min-w-0 transition-opacity hover:opacity-80 ${showBack ? "max-w-[min(100%,12rem)] sm:max-w-none" : ""}`}
          >
            <BrandLogo variant="horizontal" />
          </Link>
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <NavbarClock />
        </div>
      </div>
    </header>
  );
}
