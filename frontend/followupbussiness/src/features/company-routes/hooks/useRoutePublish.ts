import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { publishRoute } from "../api";
import type { Route } from "../types";

export function useRoutePublish(sessionKey: string, onPublished: (route: Route) => void, onConflict: () => void) {
  const [route, setRoute] = useState<Route | null>(null);
  const [notifySeller, setNotifySeller] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [published, setPublished] = useState<Route | null>(null);
  const mutationRef = useRef(0);
  const busyRef = useRef(false);
  const sessionKeyRef = useRef(sessionKey);
  const idempotencyKeyRef = useRef<string | null>(null);

  const reset = () => {
    mutationRef.current += 1;
    busyRef.current = false;
    idempotencyKeyRef.current = null;
    setRoute(null); setNotifySeller(true); setBusy(false); setError(null);
  };
  useEffect(() => {
    if (sessionKeyRef.current === sessionKey) return;
    sessionKeyRef.current = sessionKey;
    reset();
    setPublished(null);
  }, [sessionKey]);

  const open = (next: Route) => {
    if (next.status !== "DRAFT") return;
    idempotencyKeyRef.current = crypto.randomUUID();
    setRoute(next); setNotifySeller(true); setError(null); setPublished(null);
  };
  const close = () => { if (!busy) reset(); };
  const submit = async () => {
    const current = route;
    if (!current || current.status !== "DRAFT" || busyRef.current) return;
    const mutationId = ++mutationRef.current;
    const currentSessionKey = sessionKeyRef.current;
    const idempotencyKey = idempotencyKeyRef.current ?? crypto.randomUUID();
    idempotencyKeyRef.current = idempotencyKey;
    busyRef.current = true;
    setBusy(true); setError(null);
    try {
      const result = await publishRoute(current, notifySeller, idempotencyKey, crypto.randomUUID());
      if (mutationId !== mutationRef.current || currentSessionKey !== sessionKeyRef.current) return;
      if (result.response.status === 200 && result.route) {
        onPublished(result.route);
        setPublished(result.route);
        reset();
      } else {
        const nextError = await normalizeApiError(result.response) ?? { status: 500 as const, correlationId: null, fieldErrors: [] };
        setError(nextError);
        if (nextError.status === 409) onConflict();
      }
    } catch (cause) {
      if (mutationId === mutationRef.current && currentSessionKey === sessionKeyRef.current && !(cause instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (mutationId === mutationRef.current) { busyRef.current = false; setBusy(false); }
    }
  };
  return { route, notifySeller, busy, error, published, open, close, setNotifySeller, submit, closePublished: () => setPublished(null) };
}
