import { useCallback, useEffect, useState } from "react";
import { hasSession, retryPendingLogout } from "../../features/auth/auth";

export function useSessionRoute() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [showInvalidSession, setShowInvalidSession] = useState(
    () => window.location.pathname !== "/" && !hasSession(),
  );

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

  return { path, showInvalidSession, closeInvalidSession };
}
