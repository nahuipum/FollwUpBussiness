import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { copyRoute } from "../api";
import type { CopyRouteInput, CopyRouteResult, Route } from "../types";

export function useRouteCopy(sessionKey: string, onCopied: (result: CopyRouteResult) => void) {
  const [source, setSource] = useState<Route | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [copied, setCopied] = useState<CopyRouteResult | null>(null);
  const busyRef = useRef(false);
  const mutationRef = useRef(0);
  const sessionKeyRef = useRef(sessionKey);
  const idempotencyKeyRef = useRef<string | null>(null);
  const commandSignatureRef = useRef<string | null>(null);

  const reset = () => {
    mutationRef.current += 1;
    busyRef.current = false;
    idempotencyKeyRef.current = null;
    commandSignatureRef.current = null;
    setSource(null); setBusy(false); setError(null);
  };
  useEffect(() => {
    if (sessionKeyRef.current === sessionKey) return;
    sessionKeyRef.current = sessionKey;
    reset(); setCopied(null);
  }, [sessionKey]);

  const open = (route: Route) => { idempotencyKeyRef.current = null; commandSignatureRef.current = null; setSource(route); setError(null); setCopied(null); };
  const close = () => { if (!busyRef.current) reset(); };
  const submit = async (input: CopyRouteInput) => {
    if (!source || busyRef.current) return;
    const mutationId = ++mutationRef.current;
    const sourceId = source.id;
    const currentSessionKey = sessionKeyRef.current;
    const commandSignature = JSON.stringify(input);
    if (commandSignatureRef.current !== commandSignature) {
      commandSignatureRef.current = commandSignature;
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    const idempotencyKey = idempotencyKeyRef.current ?? crypto.randomUUID();
    idempotencyKeyRef.current = idempotencyKey;
    busyRef.current = true; setBusy(true); setError(null);
    try {
      const response = await copyRoute(sourceId, input, idempotencyKey);
      if (mutationId !== mutationRef.current || currentSessionKey !== sessionKeyRef.current) return;
      if (response.response.status === 201 && response.result) {
        setCopied(response.result); onCopied(response.result); reset();
      } else setError(await normalizeApiError(response.response) ?? { status: 500, correlationId: null, fieldErrors: [] });
    } catch (cause) {
      if (mutationId === mutationRef.current && currentSessionKey === sessionKeyRef.current && !(cause instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (mutationId === mutationRef.current) { busyRef.current = false; setBusy(false); }
    }
  };
  return { source, busy, error, copied, open, close, submit, closeCopied: () => setCopied(null) };
}
