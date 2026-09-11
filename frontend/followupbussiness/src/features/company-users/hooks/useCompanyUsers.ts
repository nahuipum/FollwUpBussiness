import { useEffect, useRef, useState } from "react";
import {
  ApiRequestObsoleteError,
  normalizeApiError,
  type ApiError,
} from "../../../lib/api";
import { getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { listCompanyUsers } from "../api";
import type {
  CompanyUser,
  CompanyUserPage,
  CompanyUserRole,
  CompanyUserStatus,
} from "../types";
import type { DataTablePageSize } from "../../../shared/ui/data-table-pagination";

export const companyUserRoles = ["COMPANY_ADMIN", "SUPERVISOR"] as const;
export const companyUserStatuses = [
  "INVITED",
  "ACTIVE",
  "INACTIVE",
  "LOCKED",
] as const;

export function useCompanyUsers() {
  const identity = getSessionIdentity();
  const identityKey =
    identity === null ? null : `${identity.id}:${String(identity.company)}`;
  const identityRef = useRef(identityKey);
  const requestRef = useRef(0);
  const mutationRef = useRef(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<CompanyUserRole | null>(null);
  const [status, setStatus] = useState<CompanyUserStatus | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<DataTablePageSize>(5);
  const [result, setResult] = useState<CompanyUserPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [mutationError, setMutationError] = useState<ApiError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [menuUser, setMenuUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [resendingUser, setResendingUser] = useState<CompanyUser | null>(null);
  const [statusUser, setStatusUser] = useState<CompanyUser | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inviteButtonRef = useRef<HTMLButtonElement>(null);
  const menuTriggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const canManage = identity?.roles.includes("COMPANY_ADMIN") ?? false;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const requestId = ++requestRef.current;
      setLoading(true);
      void listCompanyUsers({ page, pageSize, search, role, status })
        .then(async (next) => {
          if (requestId !== requestRef.current) return;
          if (next.response.status === 200 && next.page) {
            setResult(next.page);
            setError(null);
            setLastUpdated(new Date());
          } else {
            const nextError = await normalizeApiError(next.response);
            if (nextError?.status === 401 || nextError?.status === 403) {
              setResult(null);
              setLastUpdated(null);
            }
            setError(nextError);
          }
        })
        .catch((reason) => {
          if (
            requestId === requestRef.current &&
            !(reason instanceof ApiRequestObsoleteError)
          )
            setError({ status: 500, correlationId: null, fieldErrors: [] });
        })
        .finally(() => {
          if (requestId === requestRef.current) setLoading(false);
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, pageSize, reloadKey, role, search, status]);

  useEffect(
    () =>
      subscribeToSession(() => {
        const next = getSessionIdentity();
        const nextKey =
          next === null ? null : `${next.id}:${String(next.company)}`;
        if (identityRef.current === nextKey) return;
        requestRef.current += 1;
        identityRef.current = nextKey;
        setSearch("");
        setRole(null);
        setStatus(null);
        setPage(0);
        setResult(null);
        setError(null);
        setMutationError(null);
        setLastUpdated(null);
        setMenuUser(null);
        setEditingUser(null);
        setResendingUser(null);
        mutationRef.current += 1;
        setStatusUser(null);
        setInviteOpen(false);
        setSubmitting(false);
        setNotice(null);
        setLoading(false);
        setReloadKey((value) => value + 1);
      }),
    [],
  );

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };
  const changeRole = (value: CompanyUserRole | null) => {
    setRole(value);
    setPage(0);
  };
  const changeStatus = (value: CompanyUserStatus | null) => {
    setStatus(value);
    setPage(0);
  };
  const replaceUser = (user: CompanyUser) =>
    setResult(
      (current) =>
        current && {
          ...current,
          items: current.items.map((item) =>
            item.id === user.id ? user : item,
          ),
        },
    );

  return {
    displayName: identity?.displayName ?? "",
    canManage,
    search,
    role,
    status,
    page,
    pageSize,
    result,
    loading,
    error,
    mutationError,
    lastUpdated,
    menuUser,
    editingUser,
    resendingUser,
    statusUser,
    inviteOpen,
    submitting,
    notice,
    inviteButtonRef,
    menuTriggers,
    setMenuUser,
    setEditingUser,
    setResendingUser,
    setStatusUser,
    setInviteOpen,
    setSubmitting,
    setNotice,
    setMutationError,
    replaceUser,
    retry: () => setReloadKey((value) => value + 1),
    startMutation: () => ++mutationRef.current,
    isCurrentMutation: (mutationId: number) =>
      mutationId === mutationRef.current,
    changeSearch,
    changeRole,
    changeStatus,
    clearFilters: () => {
      setSearch("");
      setRole(null);
      setStatus(null);
      setPage(0);
    },
    goToPage: setPage,
    changePageSize: (value: DataTablePageSize) => {
      setPageSize(value);
      setPage(0);
    },
  };
}
