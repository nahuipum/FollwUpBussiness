import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DataTablePageSize } from "../../shared/ui/data-table-pagination";
import { getSessionIdentity, subscribeToSession } from "../auth/auth";
import {
  ApiRequestObsoleteError,
  normalizeApiError,
  type ApiError,
} from "../../lib/api";
import {
  createCompany,
  changeCompanyStatus,
  listCompanyAdminInvitations,
  listCompanies,
  listCompanyCurrencies,
  provisionInitialAdmin,
} from "./api";
import { CompanyTable } from "./components/CompanyTable";
import { CreateCompanyModal } from "./components/CreateCompanyModal";
import { CompanyActionDialog } from "./components/CompanyActionDialog";
import { OnboardingSuccess } from "./components/OnboardingSuccess";
import { ProvisionAdminPanel } from "./components/ProvisionAdminPanel";
import type {
  Company,
  CompanyAdminInvitation,
  CompanyCurrency,
  CompanyPage,
  CompanyStatus,
  CreateCompanyInput,
  ProvisionInitialAdminInput,
} from "./types";
import "./platform-companies.css";

type View = "list" | "create" | "provision" | "success";
type CompanyAction = "detail" | "suspend" | "reactivate";
type CompanyActionState = Readonly<{ company: Company; action: CompanyAction; success: boolean }>;
export function PlatformCompaniesPage() {
  const identity = getSessionIdentity();
  const identityKey =
    identity === null ? null : `${identity.id}:${String(identity.company)}`;
  const identityRef = useRef(identityKey);
  const loadRef = useRef(0);
  const actionRequestRef = useRef(0);
  const [view, setView] = useState<View>("list");
  const [companies, setCompanies] = useState<readonly Company[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<DataTablePageSize>(5);
  const [pageInfo, setPageInfo] = useState<CompanyPage["page"] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CompanyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [currencies, setCurrencies] = useState<readonly CompanyCurrency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [currenciesUnavailable, setCurrenciesUnavailable] = useState(false);
  const [companyAction, setCompanyAction] = useState<CompanyActionState | null>(null);
  const [companyActionError, setCompanyActionError] = useState<ApiError | null>(null);
  const [invitations, setInvitations] = useState<readonly CompanyAdminInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsUnavailable, setInvitationsUnavailable] = useState(false);
  const selectedCompanyId = selectedCompany?.id;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const requestId = ++loadRef.current;
        setLoading(true);
        try {
          const result = await listCompanies({
            page,
            pageSize,
            search,
            status,
          });
          if (requestId !== loadRef.current) return;
          if (result.response.status === 200 && result.page !== null) {
            setCompanies(result.page.items);
            setPageInfo(result.page.page);
            setError(null);
            setLastUpdated(new Date());
          } else setError(await normalizeApiError(result.response));
        } catch (reason) {
          if (
            requestId === loadRef.current &&
            !(reason instanceof ApiRequestObsoleteError)
          )
            setError({ status: 500, correlationId: null, fieldErrors: [] });
        } finally {
          if (requestId === loadRef.current) setLoading(false);
        }
      })();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, pageSize, reloadKey, search, status]);
  const loadCurrencies = () => {
    setCurrenciesLoading(true);
    setCurrenciesUnavailable(false);
    void listCompanyCurrencies()
      .then(({ response, currencies: options }) => {
        if (response.status === 200 && options) setCurrencies(options);
        else setCurrenciesUnavailable(true);
      })
      .catch(() => setCurrenciesUnavailable(true))
      .finally(() => setCurrenciesLoading(false));
  };
  useEffect(() => {
    void listCompanyCurrencies()
      .then(({ response, currencies: options }) => {
        if (response.status === 200 && options) setCurrencies(options);
        else setCurrenciesUnavailable(true);
      })
      .catch(() => setCurrenciesUnavailable(true))
      .finally(() => setCurrenciesLoading(false));
  }, []);
  useEffect(
    () =>
      subscribeToSession(() => {
        const next = getSessionIdentity();
        const nextKey =
          next === null ? null : `${next.id}:${String(next.company)}`;
        if (identityRef.current !== nextKey) {
          loadRef.current += 1;
          identityRef.current = nextKey;
          setView("list");
          setCompanies([]);
          setPage(0);
          setPageInfo(null);
          setSearch("");
          setStatus(null);
          setSelectedCompany(null);
          actionRequestRef.current += 1;
          setCompanyAction(null);
          setCompanyActionError(null);
          setSubmitting(false);
          setInvitations([]);
          setError(null);
        }
      }),
    [],
  );
  useEffect(() => {
    if (!selectedCompanyId || (view !== "provision" && view !== "success")) return;
    let cancelled = false;
    const loadInvitations = () => listCompanyAdminInvitations(selectedCompanyId)
      .then(({ response, invitations: items }) => {
        if (cancelled) return;
        if (response.status === 200 && items !== null) setInvitations(items);
        else setInvitationsUnavailable(true);
      })
      .catch(() => { if (!cancelled) setInvitationsUnavailable(true); })
      .finally(() => { if (!cancelled) setInvitationsLoading(false); });
    const initialLoad = window.setTimeout(() => {
      if (cancelled) return;
      setInvitationsLoading(true);
      setInvitationsUnavailable(false);
      void loadInvitations();
    }, 0);
    const poll = window.setInterval(() => { void loadInvitations(); }, 5_000);
    return () => {
      cancelled = true;
      window.clearTimeout(initialLoad);
      window.clearInterval(poll);
    };
  }, [reloadKey, selectedCompanyId, view]);

  const submitCompany = async (input: CreateCompanyInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createCompany(input);
      if (result.response.status === 201 && result.company) {
        setSelectedCompany(result.company);
        setView("provision");
        setReloadKey((value) => value + 1);
      } else setError(await normalizeApiError(result.response));
    } catch (reason) {
      if (!(reason instanceof ApiRequestObsoleteError))
        setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      setSubmitting(false);
    }
  };
  const submitAdmin = async (input: ProvisionInitialAdminInput) => {
    if (!selectedCompany) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await provisionInitialAdmin(selectedCompany.id, input);
      if (response.status === 202) {
        setView("success");
        setReloadKey((value) => value + 1);
      } else setError(await normalizeApiError(response));
    } catch (reason) {
      if (!(reason instanceof ApiRequestObsoleteError))
        setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      setSubmitting(false);
    }
  };
  const goList = () => {
    setView("list");
    setSelectedCompany(null);
    setError(null);
  };
  const submitCompanyAction = async (reason: string) => {
    if (companyAction === null || submitting) return;
    const requestId = ++actionRequestRef.current;
    const { company, action } = companyAction;
    const nextStatus: CompanyStatus = action === "suspend" ? "SUSPENDED" : "ACTIVE";
    setSubmitting(true);
    setCompanyActionError(null);
    try {
      const result = await changeCompanyStatus(company.id, { status: nextStatus, reason });
      if (requestId !== actionRequestRef.current) return;
      if (result.response.status === 200 && result.company !== null) {
        setCompanies((current) => current.map((item) => item.id === result.company?.id ? result.company : item));
        setCompanyAction({ company: result.company, action, success: true });
      } else setCompanyActionError(await normalizeApiError(result.response));
    } catch (reason) {
      if (requestId === actionRequestRef.current && !(reason instanceof ApiRequestObsoleteError))
        setCompanyActionError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (requestId === actionRequestRef.current) setSubmitting(false);
    }
  };
  const canManageStatuses = identity?.roles.includes("PLATFORM_SUPERADMIN") ?? false;

  return (
    <>
      {view === "provision" && selectedCompany ? (
        <ProvisionAdminPanel
          company={selectedCompany}
          busy={submitting}
          error={error}
          invitations={invitations}
          invitationsLoading={invitationsLoading}
          invitationsUnavailable={invitationsUnavailable}
          onBack={goList}
          onSubmit={submitAdmin}
        />
      ) : view === "success" && selectedCompany ? (
        <OnboardingSuccess
          company={selectedCompany}
          invitations={invitations}
          invitationsLoading={invitationsLoading}
          invitationsUnavailable={invitationsUnavailable}
          onCompanies={goList}
          onCreateAnother={() => {
            setError(null);
            setView("create");
          }}
        />
      ) : (
        <>
          <header className="company-page-head">
            <div>
              <h1>Empresas</h1>
              <p>
                Administra el registro y onboarding inicial de las empresas
                desde la plataforma.
              </p>
            </div>
            <button
              type="button"
              className="company-button company-button--primary"
              onClick={() => {
                setError(null);
                setView("create");
              }}
            >
              <Plus aria-hidden="true" />
              Crear empresa
            </button>
          </header>
          {error?.status === 500 ? (
            <section className="company-empty" role="alert">
              <h2>Ocurrió un problema temporal</h2>
              <p>Inténtalo nuevamente en unos momentos.</p>
              <button
                type="button"
                className="company-button company-button--secondary"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Reintentar
              </button>
            </section>
          ) : (
            <CompanyTable
              companies={companies}
              page={pageInfo}
              lastUpdated={lastUpdated}
              search={search}
              status={status}
              loading={loading}
              canManageStatuses={canManageStatuses}
              onSearchChange={(value) => {
                setPage(0);
                setSearch(value);
              }}
              onStatusChange={(value) => {
                setPage(0);
                setStatus(value);
              }}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(value) => {
                setPageSize(value);
                setPage(0);
              }}
              onProvision={(company) => {
                setSelectedCompany(company);
                setInvitations([]);
                setError(null);
                setView("provision");
              }}
              onAction={(company, action) => {
                setCompanyActionError(null);
                setCompanyAction({ company, action, success: false });
              }}
            />
          )}
        </>
      )}
      {view === "create" && (
        <CreateCompanyModal
          busy={submitting}
          error={error}
          currencies={currencies}
          currenciesLoading={currenciesLoading}
          currenciesUnavailable={currenciesUnavailable}
          onRetryCurrencies={loadCurrencies}
          onClose={goList}
          onSubmit={submitCompany}
        />
      )}
      {companyAction && <CompanyActionDialog
        company={companyAction.company}
        action={companyAction.action}
        busy={submitting}
        success={companyAction.success}
        error={companyActionError}
        onClose={() => {
          actionRequestRef.current += 1;
          setSubmitting(false);
          setCompanyActionError(null);
          setCompanyAction(null);
        }}
        onSubmit={submitCompanyAction}
      />}
    </>
  );
}
