import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { checkClientDuplicate, createClient, getClient, listActiveTerritories, updateClient } from "../api";
import type { Client, ClientDuplicateCheckInput, ClientFormInput, ClientFormTarget, TerritoryOption } from "../types";

const canManage = () => getSessionIdentity()?.roles.includes("COMPANY_ADMIN") ?? false;

function sessionScopeKey() {
  const identity = getSessionIdentity();
  if (!identity) return `${getSessionGeneration()}:anonymous`;
  const company = identity.company;
  const companyId =
    typeof company === "object" &&
    company !== null &&
    typeof (company as Record<string, unknown>).id === "string"
      ? (company as Record<string, unknown>).id
      : String(company);
  return `${getSessionGeneration()}:${identity.id}:${companyId}:${[...identity.roles].sort().join(",")}`;
}

export function useClientForm(onSaved: () => void) {
  const request = useRef(0);
  const mutation = useRef(0);
  const sessionScope = useRef(sessionScopeKey());
  const [client, setClient] = useState<ClientFormTarget | null | undefined>(undefined);
  const [territories, setTerritories] = useState<readonly TerritoryOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<readonly Client[] | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const reset = () => {
    request.current += 1;
    setClient(undefined);
    setTerritories(null);
    setError(null);
    setDuplicates(null);
    setLoading(false);
  };
  const load = () => {
    const id = ++request.current;
    setLoading(true);
    setError(null);
    void listActiveTerritories()
      .then(async ({ response, territories: nextTerritories }) => {
        if (id !== request.current) return;
        if (response.status === 200 && nextTerritories) setTerritories(nextTerritories);
        else setError((await normalizeApiError(response))?.status === 403 ? "No tienes permiso para crear o editar clientes." : "No pudimos cargar los territorios activos.");
      })
      .catch((reason) => {
        if (id === request.current && !(reason instanceof ApiRequestObsoleteError)) setError("No pudimos cargar los territorios activos.");
      })
      .finally(() => {
        if (id === request.current) setLoading(false);
      });
  };
  const open = (next: Client | null) => {
    if (!canManage()) return;
    setNotice(null);
    setDuplicates(null);
    if (next === null) {
      setClient(null);
      load();
      return;
    }
    const id = ++request.current;
    setLoading(true);
    setError(null);
    void Promise.all([getClient(next.id), listActiveTerritories()])
      .then(([detail, options]) => {
        if (id !== request.current) return;
        if (detail.response.status === 200 && detail.client && options.response.status === 200 && options.territories) {
          setClient(detail.client);
          setTerritories(options.territories);
        } else setError("No pudimos cargar los datos actuales del cliente.");
      })
      .catch((reason) => {
        if (id === request.current && !(reason instanceof ApiRequestObsoleteError)) setError("No pudimos cargar los datos actuales del cliente.");
      })
      .finally(() => {
        if (id === request.current) setLoading(false);
      });
  };

  useEffect(() => subscribeToSession(() => {
    const nextScope = sessionScopeKey();
    if (sessionScope.current === nextScope) return;
    sessionScope.current = nextScope;
    mutation.current += 1;
    setBusy(false);
    setNotice(null);
    reset();
  }), []);

  const submit = async (input: ClientFormInput) => {
    if (busy || !canManage()) return;
    const id = ++mutation.current;
    const editing = client !== null;
    setBusy(true);
    setError(null);
    try {
      const result = client ? await updateClient(client, input) : await createClient(input);
      if (id !== mutation.current) return;
      const expectedStatus = editing ? 200 : 201;
      if (result.response.status === expectedStatus && result.client) {
        reset();
        setNotice({
          title: editing ? "Cliente actualizado" : "Cliente creado",
          message: editing ? "Los cambios del cliente se guardaron correctamente." : "El cliente se registró correctamente.",
        });
        onSaved();
        return;
      }
      const status = (await normalizeApiError(result.response))?.status;
      setError(status === 409 ? "Los datos cambiaron o ya existe un cliente equivalente. Conservamos lo escrito para que puedas corregirlo." : status === 403 ? "No tienes permiso para crear o editar clientes." : "No pudimos guardar el cliente. Revisa la información e inténtalo nuevamente.");
    } catch (reason) {
      if (id === mutation.current && !(reason instanceof ApiRequestObsoleteError)) setError("No pudimos guardar el cliente. Inténtalo nuevamente.");
    } finally {
      if (id === mutation.current) setBusy(false);
    }
  };
  const duplicateCheck = async (input: ClientDuplicateCheckInput) => {
    if (!input.name.trim() || !canManage()) return;
    const id = ++request.current;
    setDuplicates(null);
    setError(null);
    try {
      const result = await checkClientDuplicate(input);
      if (id !== request.current) return;
      if (result.response.status === 200 && result.result) setDuplicates(result.result.candidates);
      else setError("No pudimos comprobar posibles duplicados. Puedes continuar y el servidor validará la información.");
    } catch {
      if (id === request.current) setError("No pudimos comprobar posibles duplicados. Puedes continuar y el servidor validará la información.");
    }
  };

  return {
    client,
    territories,
    loading,
    busy,
    error,
    duplicates,
    notice,
    open,
    close: () => !busy && reset(),
    retry: load,
    submit,
    duplicateCheck,
    dismissError: () => setError(null),
    dismissDuplicates: () => setDuplicates(null),
    closeNotice: () => setNotice(null),
  };
}
