"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * @typedef {{ authenticated: boolean; username?: string; role?: string }} AuthSession
 */

export function useAuthSession() {
  const [session, setSession] = useState(
    /** @type {AuthSession | null} */ (null)
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setSession({ authenticated: false });
        return null;
      }
      const data = await res.json();
      const next = {
        authenticated: true,
        username: data.username,
        role: data.role,
      };
      setSession(next);
      return next;
    } catch {
      setSession({ authenticated: false });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, refresh, setSession };
}

export async function logoutAndRedirect() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}
