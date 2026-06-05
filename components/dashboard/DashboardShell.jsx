"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";

/**
 * Home: full-bleed, no navbar. Sub-routes: navbar with integrated ආපසු → `/`.
 */
export function DashboardShell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return <div className="min-h-screen bg-[#070708] text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-6xl bg-white px-4 pb-8 pt-11 sm:px-6 sm:pb-10 sm:pt-12">
        {children}
      </main>
    </div>
  );
}
