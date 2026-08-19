import { useCallback, useEffect, useState } from "react";
import { navigate } from "../navigation";
import {
  millisecondsUntilRefresh,
  refreshSession,
  restoreSession,
  retryPendingLogout,
  subscribeToSession,
} from "../../features/auth/auth";

function isProtectedPath(path: string): boolean {
  return (
    path === "/platform/dashboard" ||
    path === "/platform/companies" ||
    path === "/company/dashboard" ||
    path === "/company/clients" ||
    path === "/company/sellers" ||
    path === "/company/territories" ||
    path === "/company/administrators-supervisors" ||
    path === "/supervisor/dashboard" ||
    path === "/supervisor/clients" ||
    path === "/supervisor/sellers" ||
    path === "/supervisor/territories" ||
    path === "/seller/dashboard"
  );
}

export function useSessionRoute() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [sessionState, setSessionState] = useState<
    "checking" | "active" | "expired" | "unavailable"
  >(() => (isProtectedPath(window.location.pathname) ? "checking" : "active"));

  useEffect(() => {
    const updateRoute = () => {
      const nextPath = window.location.pathname;
      setPath(nextPath);
    };
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  useEffect(() => {
    if (!isProtectedPath(path)) return;
    let current = true;
    void restoreSession().then((result) => {
      if (!current || result === "superseded") return;
      if (result === "refreshed") {
        setSessionState("active");
        return;
      }
      setSessionState(result === "unavailable" ? "unavailable" : "expired");
      navigate("/", { replace: true });
    });
    return () => {
      current = false;
    };
  }, [path]);

  useEffect(() => {
    let timer: number | undefined;
    const retryRefresh = () => {
      timer = window.setTimeout(refresh, 30_000);
    };
    const refresh = () => {
      void refreshSession().then((result) => {
        if (result === "refreshed") {
          scheduleRefresh();
          return;
        }
        if (result === "expired") {
          setSessionState("expired");
          navigate("/", { replace: true });
          return;
        }
        if (result === "superseded") return;
        // A transport or service failure does not prove that the user session ended.
        // Keep the in-memory session and retry renewal instead of forcing logout.
        retryRefresh();
      });
    };
    const scheduleRefresh = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const delay = millisecondsUntilRefresh();
      if (delay === null) return;
      timer = window.setTimeout(refresh, delay);
    };
    const unsubscribe = subscribeToSession(scheduleRefresh);
    scheduleRefresh();
    return () => {
      unsubscribe();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    void retryPendingLogout();
    const retryOnReconnect = () => {
      void retryPendingLogout();
    };
    window.addEventListener("online", retryOnReconnect);
    return () => window.removeEventListener("online", retryOnReconnect);
  }, []);

  const clearSessionNotice = useCallback(() => setSessionState("active"), []);

  return { path, sessionState, clearSessionNotice };
}
