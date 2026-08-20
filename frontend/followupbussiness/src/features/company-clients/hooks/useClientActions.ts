import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { changeClientStatus, getClient } from "../api";
import type { Client, ClientFormTarget } from "../types";

const canManage = () => getSessionIdentity()?.roles.includes("COMPANY_ADMIN") ?? false;

function sessionScopeKey() {
  const identity = getSessionIdentity();
  if (!identity) return `${getSessionGeneration()}:anonymous`;
  const company = identity.company;
  const companyId = typeof company === "object" && company !== null && typeof (company as Record<string, unknown>).id === "string"
    ? (company as Record<string, unknown>).id
    : String(company);
  return `${getSessionGeneration()}:${identity.id}:${companyId}:${[...identity.roles].sort().join(",")}`;
}

export function useClientActions(onSaved: () => void) {
  const detailRequest = useRef(0);
  const statusRequest = useRef(0);
  const sessionScope = useRef(sessionScopeKey());
  const [detailTarget, setDetailTarget] = useState<Client | null>(null);
  const [detail, setDetail] = useState<ClientFormTarget | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Client | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<ApiError | null>(null);

  const loadDetail = (client: Client) => {
    const requestId = ++detailRequest.current;
    setDetailTarget(client);
    setDetail(null);
    setDetailLoading(true);
    setDetailError(false);
    void getClient(client.id)
      .then(async (result) => {
        if (requestId !== detailRequest.current) return;
        if (result.response.status === 200 && result.client) setDetail(result.client);
        else setDetailError(true);
      })
      .catch((error) => {
        if (requestId === detailRequest.current && !(error instanceof ApiRequestObsoleteError)) setDetailError(true);
      })
      .finally(() => {
        if (requestId === detailRequest.current) setDetailLoading(false);
      });
  };

  const closeDetail = () => {
    detailRequest.current += 1;
    setDetailTarget(null);
    setDetail(null);
    setDetailLoading(false);
    setDetailError(false);
  };

  const openStatus = (client: Client) => {
    if (!canManage()) return;
    setStatusTarget(client);
    setStatusError(null);
  };

  const closeStatus = () => {
    if (statusBusy) return;
    statusRequest.current += 1;
    setStatusTarget(null);
    setStatusError(null);
  };

  const submitStatus = async () => {
    const client = statusTarget;
    if (!client || statusBusy || !canManage()) return;
    const requestId = ++statusRequest.current;
    setStatusBusy(true);
    setStatusError(null);
    try {
      const result = await changeClientStatus(client, client.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      if (requestId !== statusRequest.current) return;
      if (result.response.status === 200 && result.client) {
        setStatusTarget(null);
        onSaved();
      } else {
        setStatusError(await normalizeApiError(result.response));
      }
    } catch (error) {
      if (requestId === statusRequest.current && !(error instanceof ApiRequestObsoleteError)) {
        setStatusError({ status: 500, correlationId: null, fieldErrors: [] });
      }
    } finally {
      if (requestId === statusRequest.current) setStatusBusy(false);
    }
  };

  useEffect(() => subscribeToSession(() => {
    const nextScope = sessionScopeKey();
    if (sessionScope.current === nextScope) return;
    sessionScope.current = nextScope;
    detailRequest.current += 1;
    statusRequest.current += 1;
    setDetailTarget(null);
    setDetail(null);
    setDetailLoading(false);
    setDetailError(false);
    setStatusTarget(null);
    setStatusBusy(false);
    setStatusError(null);
  }), []);

  return {
    detailTarget, detail, detailLoading, detailError, openDetail: loadDetail, retryDetail: () => detailTarget && loadDetail(detailTarget), closeDetail,
    statusTarget, statusBusy, statusError, openStatus, closeStatus, submitStatus,
  };
}
