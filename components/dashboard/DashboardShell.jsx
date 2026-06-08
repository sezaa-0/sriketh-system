"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";

/**
 * Home: full-bleed dark dashboard, no navbar.
 * Sub-routes: top navbar + full-width white content area.
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
      <main className="w-full bg-white px-4 pb-8 pt-11 sm:px-6 sm:pb-10 sm:pt-12 lg:px-8">
        {children}
      </main>
    </div>
  );
}
