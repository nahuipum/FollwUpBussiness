import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { getRoute } from "../api";
import type { Route } from "../types";

function sessionScopeKey() {
  const identity = getSessionIdentity();
  if (!identity) return `${getSessionGeneration()}:anonymous`;
  const company = identity.company;
  const companyId = typeof company === "object" && company !== null && typeof (company as Record<string, unknown>).id === "string" ? (company as Record<string, unknown>).id : String(company);
  return `${getSessionGeneration()}:${identity.id}:${companyId}:${[...identity.roles].sort().join(",")}`;
}

export function useRouteDetail() {
  const [target, setTarget] = useState<Route | null>(null); const [route, setRoute] = useState<Route | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState<ApiError | null>(null); const retryKey = useRef(0); const sessionScope = useRef(sessionScopeKey());
  const load = () => { retryKey.current += 1; setRoute(null); setError(null); setLoading(true); };
  useEffect(() => {
    if (!target || !loading) return;
    let active = true; const request = retryKey.current;
    void getRoute(target.id).then(async (result) => { if (!active || request !== retryKey.current) return; if (result.response.status === 200 && result.route) setRoute(result.route); else setError(await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); }).catch((reason) => { if (active && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }).finally(() => { if (active && request === retryKey.current) setLoading(false); });
    return () => { active = false; };
  }, [target, loading]);
  useEffect(() => subscribeToSession(() => {
    const nextScope = sessionScopeKey();
    if (sessionScope.current === nextScope) return;
    sessionScope.current = nextScope;
    retryKey.current += 1;
    setTarget(null);
    setRoute(null);
    setError(null);
    setLoading(false);
  }), []);
  return { target, route, loading, error, open: (next: Route) => { setTarget(next); setRoute(null); setError(null); setLoading(true); retryKey.current += 1; }, replace: (next: Route) => { if (target?.id === next.id) { setTarget(next); setRoute(next); setError(null); } }, retry: load, close: () => { retryKey.current += 1; setTarget(null); setRoute(null); setError(null); setLoading(false); } };
}
