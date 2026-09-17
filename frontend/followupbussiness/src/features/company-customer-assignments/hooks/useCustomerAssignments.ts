import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { assignBatch, assignOne, loadAssignmentOptions } from "../api";
import type { AssignmentClient, AssignmentInput, AssignmentResult, AssignmentSeller, AssignmentTerritory } from "../types";

const key = () => {
  const identity = getSessionIdentity();
  return `${getSessionGeneration()}:${identity?.id ?? ""}:${JSON.stringify(identity?.company ?? null)}`;
};

export function useCustomerAssignments() {
  const [clients, setClients] = useState<readonly AssignmentClient[]>([]);
  const [sellers, setSellers] = useState<readonly AssignmentSeller[]>([]);
  const [territories, setTerritories] = useState<readonly AssignmentTerritory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [results, setResults] = useState<readonly AssignmentResult[]>([]);
  const request = useRef(0);
  const currentKey = useRef(key());
  const accessRevoked = useRef(false);

  const clearPrivateData = () => {
    setClients([]);
    setSellers([]);
    setTerritories([]);
    setResults([]);
    setLastUpdated(null);
  };
  const reset = () => {
    request.current += 1;
    accessRevoked.current = false;
    clearPrivateData();
    setError(null);
    setLoading(false);
  };
  const revoke = (reason: ApiError) => {
    request.current += 1;
    accessRevoked.current = true;
    clearPrivateData();
    setError(reason);
    setLoading(false);
  };
  const reload = () => {
    const id = ++request.current;
    setLoading(true);
    void loadAssignmentOptions().then(async (data) => {
      if (id !== request.current) return;
      if (data.response.status === 200 && data.clients && data.sellers && data.territories) {
        accessRevoked.current = false;
        setClients(data.clients);
        setSellers(data.sellers);
        setTerritories(data.territories);
        setError(null);
        setLastUpdated(new Date());
      } else {
        const reason = (await normalizeApiError(data.response)) ?? { status: data.response.status === 403 ? 403 as const : 500 as const, correlationId: null, fieldErrors: [] };
        if (id !== request.current) return;
        if (reason.status === 403) revoke(reason);
        else setError(reason);
      }
    }).catch((reason) => {
      if (id === request.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] });
    }).finally(() => {
      if (id === request.current) setLoading(false);
    });
  };

  useEffect(() => {
    queueMicrotask(reload);
    return subscribeToSession(() => {
      const next = key();
      if (next === currentKey.current) return;
      currentKey.current = next;
      reset();
      if (getSessionIdentity() !== null) reload();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- la suscripción vive una vez; los handlers usan refs de solicitud y sesión actuales.
  }, []);

  const submit = async (input: AssignmentInput, intentKey: string) => {
    if (accessRevoked.current) return false;
    const submissionKey = currentKey.current;
    setError(null);
    let next: readonly AssignmentResult[] = [];
    const customerId = input.customerIds[0];
    const outcome = input.customerIds.length === 1 && customerId !== undefined
      ? await assignOne(customerId, input)
      : await (async () => {
        const batch = await assignBatch(input, intentKey);
        next = batch.results;
        return batch.error;
      })();
    if (submissionKey !== currentKey.current || submissionKey !== key() || accessRevoked.current) return false;
    if (outcome) {
      if (outcome.status === 403) revoke(outcome);
      else setError(outcome);
      return false;
    }
    setResults(next.length ? next : input.customerIds.map((id) => ({ customerId: id, status: "ASSIGNED" as const, errorCode: null })));
    reload();
    return true;
  };

  return { clients, sellers, territories, loading, error, lastUpdated, results, reload, submit, clearResults: () => setResults([]) };
}
