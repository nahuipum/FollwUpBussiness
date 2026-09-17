import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, subscribeToSession } from "../../auth/auth";
import { getCompanySettings, updateCompanySettings } from "../api";
import type { CompanySettingsSnapshot, UpdateCompanySettingsInput } from "../types";

export function useCompanySettings() {
  const initialGeneration = getSessionGeneration();
  const request = useRef(0);
  const generation = useRef(initialGeneration);
  const [snapshot, setSnapshot] = useState<CompanySettingsSnapshot | null>(null);
  const [sessionGeneration, setSessionGeneration] = useState(initialGeneration);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [conflict, setConflict] = useState(false);
  const [stale, setStale] = useState(false);
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = () => {
    const id = ++request.current;
    setLoading(true);
    setError(null);
    setSaveSucceeded(false);
    void getCompanySettings().then(async (result) => {
      if (id !== request.current) return;
      if (result.response.status === 200 && result.snapshot) {
        setSnapshot(result.snapshot);
        setLastUpdated(new Date());
        setConflict(false);
        setStale(false);
        return;
      }
      if (result.response.status === 403) {
        const denied = (await normalizeApiError(result.response)) ?? { status: 403, correlationId: null, fieldErrors: [] };
        if (id !== request.current) return;
        setSnapshot(null);
        setLastUpdated(null);
        setConflict(false);
        setStale(false);
        setError(denied);
        return;
      }
      const failure = (await normalizeApiError(result.response)) ?? { status: 500, correlationId: null, fieldErrors: [] };
      if (id !== request.current) return;
      setStale(true);
      setError(failure);
    }).catch((reason) => {
      if (id !== request.current || reason instanceof ApiRequestObsoleteError) return;
      setStale(true);
      setError({ status: 500, correlationId: null, fieldErrors: [] });
    }).finally(() => {
      if (id === request.current) setLoading(false);
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicia la consulta asíncrona al montar el hook.
    load();
  }, []);
  useEffect(() => subscribeToSession(() => {
    if (generation.current === getSessionGeneration()) return;
    generation.current = getSessionGeneration();
    setSessionGeneration(generation.current);
    request.current += 1;
    setSnapshot(null);
    setError(null);
    setConflict(false);
    setStale(false);
    setSaveSucceeded(false);
    setLastUpdated(null);
    setSaving(false);
    load();
  }), []);

  const save = async (input: UpdateCompanySettingsInput) => {
    if (!snapshot || saving || loading || conflict || stale || error?.status === 403) return;
    const id = ++request.current;
    setSaving(true);
    setError(null);
    setConflict(false);
    setSaveSucceeded(false);
    try {
      const result = await updateCompanySettings(input, snapshot.etag);
      if (id !== request.current) return;
      if (result.response.status === 200 && result.snapshot) {
        setSnapshot(result.snapshot);
        setLastUpdated(new Date());
        setStale(false);
        setSaveSucceeded(true);
      } else if (result.response.status === 409) setConflict(true);
      else {
        const failure = (await normalizeApiError(result.response)) ?? { status: 500, correlationId: null, fieldErrors: [] };
        if (id === request.current) setError(failure);
      }
    } catch (reason) {
      if (id === request.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (id === request.current) setSaving(false);
    }
  };

  return { snapshot, sessionGeneration, loading, saving, error, conflict, stale, saveSucceeded, lastUpdated, retry: load, reloadAfterConflict: load, save };
}
