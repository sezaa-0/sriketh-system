"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  Car,
  CreditCard,
  Fuel,
  HandCoins,
  Landmark,
  LayoutGrid,
  Receipt,
  Route,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/fuel", label: "Fuel", icon: Fuel },
  { href: "/trading", label: "Trips", icon: Route },
  { href: "/lorry-hire", label: "Lorry Hire", icon: Truck },
  { href: "/hand-loans", label: "Hand Loans", icon: HandCoins },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/bank-loans", label: "Bank Loans", icon: Landmark },
  { href: "/cheques", label: "Cheques", icon: CreditCard },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/deposits", label: "Deposits", icon: Building2 },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/diesel", label: "Fuel Tank", icon: Fuel },
  { href: "/day-cash", label: "Day Cash", icon: Wallet },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-neutral-100 bg-white lg:block">
      <nav
        className="sticky top-11 max-h-[calc(100vh-2.75rem)] overflow-y-auto px-3 py-4"
        aria-label="Dashboard modules"
      >
        <p className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-neutral-950 text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2.1} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
