import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { listSellerFormOptions, updateSellerSupervisor, updateSellerTerritories } from "../api";
import type { Seller, SellerFormOptions } from "../types";

export type SellerAssignmentKind = "supervisor" | "territories";

export function useSellerAssignment(sessionKey: string, onSaved: () => void) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [kind, setKind] = useState<SellerAssignmentKind | null>(null);
  const [options, setOptions] = useState<SellerFormOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const requestRef = useRef(0);
  const mutationRef = useRef(0);
  const sessionRef = useRef(sessionKey);

  const reset = () => {
    requestRef.current += 1;
    mutationRef.current += 1;
    setSeller(null); setKind(null); setOptions(null); setError(null); setBusy(false);
  };
  const close = () => {
    if (busy) return;
    reset();
  };
  const load = () => {
    const requestId = ++requestRef.current;
    setLoading(true); setOptions(null); setError(null);
    void listSellerFormOptions().then(async (result) => {
      if (requestId !== requestRef.current) return;
      if (result.response.status === 200 && result.options) setOptions(result.options);
      else setError(await normalizeApiError(result.response));
    }).catch((cause) => {
      if (requestId === requestRef.current && !(cause instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] });
    }).finally(() => { if (requestId === requestRef.current) setLoading(false); });
  };
  const open = (nextSeller: Seller, nextKind: SellerAssignmentKind) => {
    setSeller(nextSeller); setKind(nextKind); load();
  };
  useEffect(() => {
    if (sessionRef.current === sessionKey) return;
    sessionRef.current = sessionKey;
    requestRef.current += 1;
    mutationRef.current += 1;
    setSeller(null); setKind(null); setOptions(null); setError(null); setBusy(false);
  }, [sessionKey]);
  const submit = async (value: string | null | readonly string[]) => {
    if (!seller || !kind || busy) return;
    const mutationId = ++mutationRef.current;
    const activeSession = sessionRef.current;
    setBusy(true); setError(null);
    try {
      const response = kind === "supervisor"
        ? await updateSellerSupervisor(seller.id, value as string | null)
        : await updateSellerTerritories(seller.id, value as readonly string[]);
      if (mutationId !== mutationRef.current || activeSession !== sessionRef.current) return;
      if (response.status === 200) { reset(); onSaved(); }
      else setError(await normalizeApiError(response));
    } catch (cause) {
      if (mutationId === mutationRef.current && activeSession === sessionRef.current && !(cause instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally { if (mutationId === mutationRef.current) setBusy(false); }
  };
  return { seller, kind, options, loading, busy, error, open, close, load, submit };
}
