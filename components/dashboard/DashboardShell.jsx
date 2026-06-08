"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

/**
 * Home: full-bleed, no navbar. Sub-routes: navbar + sidebar + main content.
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
      <div className="mx-auto flex max-w-7xl">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 bg-white px-4 pb-8 pt-11 sm:px-6 sm:pb-10 sm:pt-12">
          {children}
        </main>
      </div>
    </div>
  );
}
