import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { subscribeToSession } from "../../auth/auth";
import { getRouteDirections, previewRouteDirections } from "../api";
import type { Route, RouteDirections } from "../types";

const signature = (route: Route) => route.points.slice().sort((a, b) => a.sequence - b.sequence).map((point) => point.routePointId ?? point.sequence).join(":");

export function useRouteDirections(route: Route) {
  const [directions, setDirections] = useState<RouteDirections | null>(null);
  const [loadedSignature, setLoadedSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [retry, setRetry] = useState(0);
  const currentSignature = signature(route);
  const signatureRef = useRef(currentSignature);
  const requestRef = useRef(0);
  const loadedSignatureRef = useRef<string | null>(null);
  const hasDirectionsRef = useRef(false);
  const routeId = route.id;
  const routeVersion = route.version;

  useEffect(() => subscribeToSession(() => { requestRef.current += 1; loadedSignatureRef.current = null; hasDirectionsRef.current = false; setDirections(null); setLoadedSignature(null); setError(null); setLoading(false); }), []);
  useEffect(() => { signatureRef.current = currentSignature; }, [currentSignature]);
  useEffect(() => {
    let active = true;
    const request = ++requestRef.current;
    const routeSignature = signatureRef.current;
    const preview = hasDirectionsRef.current && loadedSignatureRef.current !== routeSignature;
    const abort = new AbortController();
    const isCurrent = () => active && request === requestRef.current;
    const loadingTimeout = window.setTimeout(() => { if (isCurrent()) { setLoading(true); setError(null); } }, 0);
    const timeout = window.setTimeout(() => { void (async () => {
      if (!isCurrent()) return;
      try {
        const result = preview
          ? await previewRouteDirections(routeId, routeVersion, routeSignature.split(":"), abort.signal)
          : await getRouteDirections(routeId, abort.signal);
        if (!isCurrent()) return;
        if (result.response.status === 200 && result.directions) { hasDirectionsRef.current = true; loadedSignatureRef.current = routeSignature; setDirections(result.directions); setLoadedSignature(routeSignature); }
        else { const error = await normalizeApiError(result.response); if (isCurrent()) setError(error ?? { status: 500, correlationId: null, fieldErrors: [] }); }
      } catch (reason) { if (isCurrent() && !abort.signal.aborted && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }
      finally { if (isCurrent()) setLoading(false); }
    })(); }, preview ? 250 : 0);
    return () => { active = false; window.clearTimeout(loadingTimeout); window.clearTimeout(timeout); abort.abort(); };
  }, [currentSignature, retry, routeId, routeVersion]);

  return { directions, loading, error, stale: directions !== null && loadedSignature !== currentSignature, retry: () => setRetry((value) => value + 1) };
}
