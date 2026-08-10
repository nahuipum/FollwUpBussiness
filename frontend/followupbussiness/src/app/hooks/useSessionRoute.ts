import { useCallback, useEffect, useState } from "react";
import { navigate } from "../navigation";
import {
  hasSession,
  millisecondsUntilRefresh,
  refreshSession,
  retryPendingLogout,
  subscribeToSession,
} from "../../features/auth/auth";

export function useSessionRoute() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [showInvalidSession, setShowInvalidSession] = useState(
    () => window.location.pathname !== "/" && !hasSession(),
  );
  const [refreshUnavailable, setRefreshUnavailable] = useState(false);

  useEffect(() => {
    const updateRoute = () => {
      const nextPath = window.location.pathname;
      setPath(nextPath);
      setShowInvalidSession(nextPath !== "/" && !hasSession());
    };
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const scheduleRefresh = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const delay = millisecondsUntilRefresh();
      if (delay === null) return;
      timer = window.setTimeout(() => {
        void refreshSession().then((result) => {
          if (result === "refreshed") {
            setRefreshUnavailable(false);
            scheduleRefresh();
            return;
          }
          if (result === "expired") {
            navigate("/", { replace: true });
            return;
          }
          if (result === "superseded") return;
          setRefreshUnavailable(true);
        });
      }, delay);
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

  const closeInvalidSession = useCallback(
    () => setShowInvalidSession(false),
    [],
  );

  return { path, showInvalidSession, closeInvalidSession, refreshUnavailable };
}
