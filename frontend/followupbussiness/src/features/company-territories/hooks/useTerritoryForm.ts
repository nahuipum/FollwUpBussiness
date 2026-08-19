import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { subscribeToSession } from "../../auth/auth";
import { createTerritory, updateTerritory } from "../api";
import type { Territory, TerritoryFormInput } from "../types";

export function useTerritoryForm(onSaved: () => void) {
  const mutationRef = useRef(0); const submittingRef = useRef(false); const [territory, setTerritory] = useState<Territory | null | undefined>(undefined); const [busy, setBusy] = useState(false); const [error, setError] = useState<ApiError | null>(null);
  const reset = () => { mutationRef.current += 1; submittingRef.current = false; setTerritory(undefined); setBusy(false); setError(null); };
  useEffect(() => subscribeToSession(reset), []);
  const submit = async (input: TerritoryFormInput) => { if (busy || submittingRef.current || territory === undefined) return; submittingRef.current = true; const mutation = ++mutationRef.current; setBusy(true); setError(null); try { const response = territory === null ? await createTerritory(input) : await updateTerritory(territory, input); if (response.status === (territory === null ? 201 : 200)) { if (mutation === mutationRef.current) { reset(); onSaved(); } } else if (mutation === mutationRef.current) setError(await normalizeApiError(response)); } catch (reason) { if (mutation === mutationRef.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { if (mutation === mutationRef.current) { submittingRef.current = false; setBusy(false); } } };
  return { territory, busy, error: error ? message(error.status) : null, conflict: error?.status === 409, open: (next: Territory | null) => { setTerritory(next); setError(null); }, close: () => { if (!busy) reset(); }, reloadAfterConflict: () => { if (!busy) { setError(null); onSaved(); } }, submit };
}
function message(status: number) { if (status === 403) return "No tienes permiso para realizar esta acción."; if (status === 409) return "Los datos cambiaron. Recarga la lista y corrige el formulario; lo escrito se conserva."; if (status === 422) return "Revisa la información ingresada e inténtalo nuevamente."; return "No pudimos guardar los cambios. Inténtalo nuevamente."; }
