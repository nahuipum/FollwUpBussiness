import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { changeSellerStatus } from "../api";
import type { Seller } from "../types";

export function useSellerStatus(
  sessionKey: string,
  onSaved: (seller: Seller) => void,
) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mutationRef = useRef(0);
  const sessionKeyRef = useRef(sessionKey);

  const close = () => {
    if (busy) return;
    mutationRef.current += 1;
    setSeller(null);
    setReason("");
    setError(null);
  };

  useEffect(() => {
    if (sessionKeyRef.current === sessionKey) return;
    sessionKeyRef.current = sessionKey;
    mutationRef.current += 1;
    setSeller(null);
    setReason("");
    setError(null);
    setBusy(false);
  }, [sessionKey]);

  const open = (nextSeller: Seller) => {
    setSeller(nextSeller);
    setReason("");
    setError(null);
  };

  const submit = async () => {
    const current = seller;
    const normalizedReason = reason.trim();
    if (
      !current ||
      busy ||
      normalizedReason.length < 5 ||
      normalizedReason.length > 500
    )
      return;
    const mutationId = ++mutationRef.current;
    const currentSessionKey = sessionKeyRef.current;
    setBusy(true);
    setError(null);
    try {
      const result = await changeSellerStatus(current.id, {
        status: current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        reason: normalizedReason,
      });
      if (
        mutationId !== mutationRef.current ||
        currentSessionKey !== sessionKeyRef.current
      )
        return;
      if (result.response.status === 200 && result.seller) {
        onSaved(result.seller);
        setSeller(null);
        setReason("");
      } else {
        setError(await normalizeApiError(result.response));
      }
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

  return { seller, reason, busy, error, open, close, setReason, submit };
}
