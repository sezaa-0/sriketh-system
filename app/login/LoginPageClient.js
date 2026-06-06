"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  ensureCustomUsernameDefault,
  getCustomUsername,
  matchesCustomUsername,
} from "@/lib/auth/custom-username";

const INPUT =
  "w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 pl-11 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:ring-2 focus:ring-neutral-950/10";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ensureCustomUsernameDefault();
  }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitting(true);
    setError("");

    const trimmedUsername = username.trim();

    try {
      if (trimmedUsername !== "admin" && !matchesCustomUsername(trimmedUsername)) {
        setError("Invalid Username or Password");
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Invalid Username or Password");
        return;
      }

      const next = searchParams.get("next") || "/";
      router.replace(next.startsWith("/login") ? "/" : next);
      router.refresh();
    } catch {
      setError("Invalid Username or Password");
    } finally {
      setSubmitting(false);
    }
  };

  const expectedUsername = getCustomUsername();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        <BrandLogo variant="stacked" size="lg" className="mb-10" />

        <div className="rounded-[28px] border border-neutral-100 bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          <h1 className="text-center text-2xl font-black tracking-tight text-neutral-950">
            Sign In
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-neutral-500">
            Enter your username and password to access Sri Keth ERP
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">
                Username
              </span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  className={INPUT}
                  value={username}
                  onChange={(ev) => setUsername(ev.target.value)}
                  autoComplete="username"
                  placeholder={expectedUsername}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">
                Password
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  className={INPUT}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 py-3.5 text-sm font-black text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign In
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-neutral-400">
          Session ends when you close this browser for your security.
        </p>
      </div>
    </div>
  );
}
