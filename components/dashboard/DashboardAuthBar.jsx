"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, LogOut, Settings, User } from "lucide-react";
import { AccountSettingsModal } from "@/components/dashboard/AccountSettingsModal";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { fetchCustomUsername } from "@/lib/auth/app-settings";
import { logoutAndRedirect, useAuthSession } from "@/lib/auth/use-auth-session";

/**
 * @param {{ variant?: "dark" | "light"; className?: string }} props
 */
export function DashboardAuthBar({ variant = "dark", className = "" }) {
  const { session, loading, refresh, setSession } = useAuthSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayUsername, setDisplayUsername] = useState("User");
  const [toast, setToast] = useState("");

  const isDark = variant === "dark";

  useEffect(() => {
    if (!session?.authenticated) return;
    if (session.role === AUTH_ROLES.USER) {
      let cancelled = false;
      fetchCustomUsername().then((name) => {
        if (!cancelled) setDisplayUsername(name);
      });
      return () => {
        cancelled = true;
      };
    }
    setDisplayUsername(session.username || "User");
  }, [session]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pill = isDark
    ? "border-white/15 bg-white/10 text-white/90 hover:bg-white/15"
    : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100";

  const handleUpdated = (nextUsername, message) => {
    setDisplayUsername(nextUsername);
    setSession((prev) =>
      prev ? { ...prev, authenticated: true, username: nextUsername } : prev
    );
    if (message) setToast(message);
    refresh();
  };

  if (loading) return null;

  return (
    <>
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`fixed left-1/2 top-4 z-[110] flex max-w-md -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${
              isDark
                ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={`flex flex-wrap items-center justify-end gap-2 ${className}`}>
        <span
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${pill}`}
        >
          <User className="h-3.5 w-3.5 opacity-70" />
          {displayUsername}
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${pill}`}
        >
          <Settings className="h-3.5 w-3.5" />
          Account Settings
        </button>
        <button
          type="button"
          onClick={() => logoutAndRedirect()}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
            isDark
              ? "border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
              : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </button>
      </div>

      <AccountSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        username={displayUsername}
        role={session?.role}
        onUpdated={handleUpdated}
        variant={variant}
      />
    </>
  );
}
