"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Settings, X } from "lucide-react";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { getCustomUsername, setCustomUsername } from "@/lib/auth/custom-username";

const INPUT =
  "w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:ring-2 focus:ring-neutral-950/10";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   username: string;
 *   role?: string;
 *   onUpdated: (username: string, message?: string) => void;
 *   variant?: "dark" | "light";
 * }} props
 */
export function AccountSettingsModal({
  open,
  onClose,
  username,
  role,
  onUpdated,
  variant = "dark",
}) {
  const [storedUsername, setStoredUsername] = useState("");
  const [nextUsername, setNextUsername] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = role === AUTH_ROLES.ADMIN;
  const isDark = variant === "dark";

  const readCurrentUsername = () =>
    isAdmin ? username || "admin" : getCustomUsername();

  useEffect(() => {
    if (open) {
      setStoredUsername(readCurrentUsername());
      setNextUsername("");
      setNextPassword("");
      setError("");
      setSuccess("");
    }
  }, [open, username, isAdmin]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");

    if (isAdmin) {
      setError("Administrator sessions use fixed credentials and cannot be updated here.");
      return;
    }

    const trimmedUsername = nextUsername.trim();
    if (!trimmedUsername && !nextPassword.trim()) {
      setError("Enter a new username and/or password to update.");
      return;
    }

    setSubmitting(true);
    try {
      if (trimmedUsername) {
        setCustomUsername(trimmedUsername);
      }

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername || undefined,
          password: nextPassword || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not update account settings.");
        return;
      }

      const updatedName = readCurrentUsername();
      setStoredUsername(updatedName);
      const parts = [];
      if (data.usernameUpdated) parts.push("username");
      if (data.passwordUpdated) parts.push("password");
      const message =
        parts.length > 0
          ? `Your ${parts.join(" and ")} ${parts.length > 1 ? "were" : "was"} updated successfully.`
          : "Account settings updated successfully.";

      onUpdated(updatedName, message);
      setNextUsername("");
      setNextPassword("");
      setSuccess(message);
    } catch {
      setError("Could not update account settings.");
    } finally {
      setSubmitting(false);
    }
  };

  const shell = isDark
    ? "border-white/15 bg-[#0a0a0c]/95 text-white"
    : "border-neutral-100 bg-white text-neutral-950";
  const label = isDark ? "text-white/50" : "text-neutral-500";
  const sub = isDark ? "text-white/45" : "text-neutral-500";
  const closeBtn = isDark
    ? "border-white/15 bg-white/10 text-white/80 hover:bg-white/20"
    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className={`relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl sm:p-8 ${shell}`}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </h2>
                <p className={`mt-1 text-xs font-semibold ${sub}`}>
                  Signed in as{" "}
                  <span className="font-black">{storedUsername || username || "User"}</span>
                </p>
                {!isAdmin ? (
                  <p className={`mt-1 text-[10px] font-medium ${sub}`}>
                    Login username is stored securely on this device.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${closeBtn}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isAdmin ? (
              <p
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  isDark
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                You are signed in with the administrator session. Username and password
                changes are disabled for this account.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className={`mb-1.5 block text-xs font-bold uppercase tracking-wide ${label}`}>
                    Change Username
                  </span>
                  <input
                    className={INPUT}
                    value={nextUsername}
                    onChange={(ev) => setNextUsername(ev.target.value)}
                    placeholder={`Current: ${storedUsername}`}
                    key={`username-placeholder-${storedUsername}`}
                  />
                </label>
                <label className="block">
                  <span className={`mb-1.5 block text-xs font-bold uppercase tracking-wide ${label}`}>
                    Change Password
                  </span>
                  <input
                    type="password"
                    className={INPUT}
                    value={nextPassword}
                    onChange={(ev) => setNextPassword(ev.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                  />
                </label>

                {error ? (
                  <p
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      isDark
                        ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                        : "border-rose-200 bg-rose-50 text-rose-800"
                    }`}
                  >
                    {error}
                  </p>
                ) : null}
                {success ? (
                  <p
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      isDark
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {success}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition disabled:opacity-60 ${
                    isDark
                      ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
                      : "bg-neutral-950 text-white hover:bg-neutral-800"
                  }`}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
