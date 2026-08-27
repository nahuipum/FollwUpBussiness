import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, subscribeToSession } from "../../auth/auth";
import { getCompanySettings, updateCompanySettings } from "../api";
import type { CompanySettingsSnapshot, UpdateCompanySettingsInput } from "../types";

export function useCompanySettings() {
  const initialGeneration = getSessionGeneration(); const request = useRef(0); const generation = useRef(initialGeneration);
  const [snapshot, setSnapshot] = useState<CompanySettingsSnapshot | null>(null); const [sessionGeneration, setSessionGeneration] = useState(initialGeneration); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState<ApiError | null>(null); const [conflict, setConflict] = useState(false); const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const load = () => { const id = ++request.current; setLoading(true); setError(null); void getCompanySettings().then(async result => { if (id !== request.current) return; if (result.response.status === 200 && result.snapshot) { setSnapshot(result.snapshot); setLastUpdated(new Date()); setConflict(false); } else setError((await normalizeApiError(result.response)) ?? { status: 500, correlationId: null, fieldErrors: [] }); }).catch(reason => { if (id === request.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }).finally(() => { if (id === request.current) setLoading(false); }); };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicia la consulta asíncrona al montar el hook.
    load();
  }, []);
  useEffect(() => subscribeToSession(() => { if (generation.current === getSessionGeneration()) return; generation.current = getSessionGeneration(); setSessionGeneration(generation.current); request.current += 1; setSnapshot(null); setError(null); setConflict(false); setLastUpdated(null); setSaving(false); load(); }), []);
  const save = async (input: UpdateCompanySettingsInput) => { if (!snapshot || saving) return; const id = ++request.current; setSaving(true); setError(null); setConflict(false); try { const result = await updateCompanySettings(input, snapshot.etag); if (id !== request.current) return; if (result.response.status === 200 && result.snapshot) { setSnapshot(result.snapshot); setLastUpdated(new Date()); } else if (result.response.status === 409) setConflict(true); else setError((await normalizeApiError(result.response)) ?? { status: 500, correlationId: null, fieldErrors: [] }); } catch (reason) { if (id === request.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { if (id === request.current) setSaving(false); } };
  return { snapshot, sessionGeneration, loading, saving, error, conflict, lastUpdated, retry: load, reloadAfterConflict: load, save };
}
