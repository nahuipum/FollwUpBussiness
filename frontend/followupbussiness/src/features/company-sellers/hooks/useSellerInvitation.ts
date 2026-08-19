import { useEffect, useRef, useState } from "react";
import {
  ApiRequestObsoleteError,
  normalizeApiError,
  type ApiError,
} from "../../../lib/api";
import { resendSellerInvitation } from "../api";
import type { Seller } from "../types";

export function useSellerInvitation(
  sessionKey: string,
  onSaved: (seller: Seller) => void,
) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mutationRef = useRef(0);
  const sessionKeyRef = useRef(sessionKey);

  const reset = () => {
    mutationRef.current += 1;
    setSeller(null);
    setBusy(false);
    setSuccess(false);
    setError(null);
  };

  useEffect(() => {
    if (sessionKeyRef.current === sessionKey) return;
    sessionKeyRef.current = sessionKey;
    reset();
  }, [sessionKey]);

  const open = (nextSeller: Seller) => {
    if (nextSeller.status !== "INVITED") return;
    setSeller(nextSeller);
    setSuccess(false);
    setError(null);
  };

  const close = () => {
    if (!busy) reset();
  };

  const submit = async () => {
    const current = seller;
    if (!current || current.status !== "INVITED" || busy || success) return;
    const mutationId = ++mutationRef.current;
    const currentSessionKey = sessionKeyRef.current;
    setBusy(true);
    setError(null);
    try {
      const result = await resendSellerInvitation(current);
      if (
        mutationId !== mutationRef.current ||
        currentSessionKey !== sessionKeyRef.current
      )
        return;
      if (result.response.status === 202 && result.seller) {
        onSaved(result.seller);
        setSuccess(true);
      } else setError(await normalizeApiError(result.response));
    } catch (cause) {
      if (
        mutationId === mutationRef.current &&
        currentSessionKey === sessionKeyRef.current &&
        !(cause instanceof ApiRequestObsoleteError)
      )
        setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (mutationId === mutationRef.current) setBusy(false);
    }
  };

  return { seller, busy, success, error, open, close, submit };
}
