import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { createRoute, getRoute, listRouteCustomers, listSuggestedRouteCustomers, optimizeRoute, reorderRoutePoints } from "../api";
import type { Route, RouteCustomerOption, RouteOptimizationInput, RoutePoint, RouteProposal, RouteProposalValidation, RouteSellerOption } from "../types";

const emptyCustomers: readonly RouteCustomerOption[] = [];
const emptySellers: readonly RouteSellerOption[] = [];
const sessionKey = () => { const identity = getSessionIdentity(); const company = identity?.company; const companyId = typeof company === "object" && company !== null && typeof (company as Record<string, unknown>).id === "string" ? (company as Record<string, unknown>).id : String(company); return identity ? `${getSessionGeneration()}:${identity.id}:${companyId}` : `${getSessionGeneration()}:anonymous`; };
const key = () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const ordered = (points: readonly RoutePoint[]) => [...points].sort((a, b) => a.sequence - b.sequence);
const resequence = (points: readonly RoutePoint[]) => points.map((point, index) => ({ ...point, sequence: index + 1 }));
type ProposalVisit = Readonly<{ customerId: string; included: boolean; serviceDurationMinutes: string; priority: string; windowStart: string; windowEnd: string }>;
export type RoutePlanningMode = "manual" | "automatic";
const proposalVisitsFor = (route: Route, durations?: Readonly<Record<string, string>>): readonly ProposalVisit[] => ordered(route.points).flatMap((point, index) => point.customerId ? [{ customerId: point.customerId, included: index < 9, serviceDurationMinutes: durations?.[point.customerId] ? String(Math.max(1, Math.ceil(Number(durations[point.customerId]) / 60))) : "", priority: "1", windowStart: "", windowEnd: "" }] : []);
const emptyProposalValidation: RouteProposalValidation = { windows: {} };
const validPriority = (priority: string) => priority === "" || (/^\d+$/.test(priority) && Number(priority) >= 1);
const requestPriority = (priority: string) => Number(priority || "1");
const candidateForSeller = (customer: RouteCustomerOption, sellerId: string, sellers: readonly RouteSellerOption[]) => {
  const seller = sellers.find((option) => option.id === sellerId);
  return seller === undefined ? sellers.length === 0 : customer.territoryId !== null && seller.territoryIds.includes(customer.territoryId);
};
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const localRouteIso = (date: string, time: string) => {
  if (!validTime(time)) throw new Error("invalid time");
  const instant = new Date(`${date}T${time}`);
  if (Number.isNaN(instant.getTime())) throw new Error("invalid date");
  return instant.toISOString();
};

export function useRouteDraft(onSaved: () => void, sellers: readonly RouteSellerOption[] = emptySellers) {
  const session = useRef(sessionKey()); const request = useRef(0); const submitting = useRef(false); const customerPage = useRef(0); const attemptKey = useRef<string | null>(null);
  const sellerScopeKey = sellers.map((seller) => `${seller.id}:${seller.status ?? ""}:${seller.territoryIds.join(",")}`).join("|");
  const [mode, setMode] = useState<RoutePlanningMode>("manual"); const [surface, setSurface] = useState<"idle" | "planning" | "proposal" | "order">("idle"); const formOpen = surface === "planning"; const proposalOpen = surface === "proposal"; const orderOpen = surface === "order"; const [returnToOrder, setReturnToOrder] = useState(false); const [date, setDate] = useState(""); const [sellerId, setSellerId] = useState(""); const [customers, setCustomers] = useState<readonly RouteCustomerOption[]>(emptyCustomers); const [selected, setSelected] = useState<readonly string[]>([]); const [serviceDurations, setServiceDurations] = useState<Readonly<Record<string, string>>>({}); const [loadingCustomers, setLoadingCustomers] = useState(false); const [moreCustomers, setMoreCustomers] = useState(false); const [suggestionError, setSuggestionError] = useState<ApiError | null>(null); const [error, setError] = useState<ApiError | null>(null); const [saving, setSaving] = useState(false); const [draft, setDraft] = useState<Route | null>(null); const [created, setCreated] = useState<Route | null>(null); const [orderSaved, setOrderSaved] = useState<Route | null>(null); const [locked, setLocked] = useState(false); const [conflict, setConflict] = useState(false); const [announcement, setAnnouncement] = useState(""); const [loadVersion, setLoadVersion] = useState(0); const [availabilityStart, setAvailabilityStart] = useState(""); const [availabilityEnd, setAvailabilityEnd] = useState(""); const [proposalVisits, setProposalVisits] = useState<readonly ProposalVisit[]>([]); const [proposal, setProposal] = useState<RouteProposal | null>(null); const [proposalValidation, setProposalValidation] = useState<RouteProposalValidation>(emptyProposalValidation);
  const clear = () => { request.current += 1; customerPage.current = 0; attemptKey.current = null; submitting.current = false; setSurface("idle"); setReturnToOrder(false); setDate(""); setSellerId(""); setCustomers(emptyCustomers); setSelected([]); setServiceDurations({}); setLoadingCustomers(false); setMoreCustomers(false); setSuggestionError(null); setError(null); setSaving(false); setDraft(null); setCreated(null); setOrderSaved(null); setLocked(false); setConflict(false); setAnnouncement(""); setAvailabilityStart(""); setAvailabilityEnd(""); setProposalVisits([]); setProposal(null); setProposalValidation(emptyProposalValidation); };
  useEffect(() => subscribeToSession(() => { const next = sessionKey(); if (next !== session.current) { session.current = next; clear(); } }), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect -- sellerScopeKey representa la cartera; evita que onSaved borre un error de operación al recrear sellers e inicia su carga al cambiar el formulario.
  useEffect(() => { if (!formOpen || !sellerId || !date) return; const id = ++request.current; setLoadingCustomers(true); setError(null); void Promise.all([listRouteCustomers(sellerId, 0), listSuggestedRouteCustomers(sellerId, date, 0)]).then(async ([portfolio, suggestions]) => { if (id !== request.current) return; const failed = portfolio.response.status === 200 && portfolio.page ? null : await normalizeApiError(portfolio.response); if (failed) { setCustomers(emptyCustomers); setSelected([]); setError(failed); return; } const suggestionFailure = suggestions.response.status === 200 && suggestions.page ? null : await normalizeApiError(suggestions.response); const unique = new Map<string, RouteCustomerOption>(); portfolio.page?.items.filter((item) => candidateForSeller(item, sellerId, sellers)).forEach((item) => unique.set(item.id, item)); suggestions.page?.items.filter((item) => candidateForSeller(item, sellerId, sellers)).forEach((item) => unique.set(item.id, item)); customerPage.current = 0; setCustomers([...unique.values()]); setSuggestionError(suggestionFailure); setMoreCustomers((portfolio.page?.page.totalPages ?? 0) > 1 || (suggestions.page?.page.totalPages ?? 0) > 1); }).catch((reason) => { if (id === request.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }).finally(() => { if (id === request.current) setLoadingCustomers(false); }); }, [date, formOpen, loadVersion, sellerId, sellerScopeKey]);
  const hasInvalidDurations = selected.some((customerId) => !/^\d+$/.test(serviceDurations[customerId] ?? "") || Number(serviceDurations[customerId]) < 1);
  const submit = async () => { if (saving || submitting.current || !date || !sellerId || selected.length < 1 || selected.length > 50 || hasInvalidDurations) return; submitting.current = true; setSaving(true); setError(null); setConflict(false); const idempotencyKey = attemptKey.current ?? key(); attemptKey.current = idempotencyKey; try { const result = await createRoute({ date, sellerId, visits: [...new Set(selected)].map((customerId) => ({ customerId, serviceDurationSeconds: Number(serviceDurations[customerId]) })) }, idempotencyKey); if (result.response.status === 201 && result.route) { attemptKey.current = null; setDraft(result.route); setProposalVisits(proposalVisitsFor(result.route, serviceDurations)); setSurface(mode === "automatic" ? "proposal" : "idle"); if (mode === "automatic") { setCreated(null); setAnnouncement("Borrador base guardado. Configura las restricciones para generar una propuesta."); } else { setCreated(result.route); setAnnouncement("Borrador guardado. Ábrelo desde el listado o revisa el orden ahora antes de continuar a publicación."); } onSaved(); } else if (result.response.status === 409) { attemptKey.current = null; setConflict(true); } else { if (result.response.status < 500) attemptKey.current = null; setError(await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); } } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { submitting.current = false; setSaving(false); } };
  const generateAutomatic = async () => {
    if (mode !== "automatic" || saving || submitting.current || !date || !sellerId) return;
    const selectedVisits = proposalVisits.filter((visit) => visit.included && selected.includes(visit.customerId));
    const windowErrors = Object.fromEntries(selectedVisits.flatMap((visit) => !visit.windowStart && !visit.windowEnd ? [] : !visit.windowStart || !visit.windowEnd ? [[visit.customerId, "Completa el inicio y el fin de la ventana."]] : visit.windowStart >= visit.windowEnd ? [[visit.customerId, "El inicio de la ventana debe ser anterior al fin."]] : []));
    const invalidVisit = selectedVisits.length < 1 || selectedVisits.length > 9 || selectedVisits.some((visit) => !/^\d+$/.test(visit.serviceDurationMinutes) || Number(visit.serviceDurationMinutes) < 1 || !validPriority(visit.priority));
    const availabilityError = !availabilityStart || !availabilityEnd || availabilityStart >= availabilityEnd ? "El inicio de jornada debe ser anterior al fin." : undefined;
    if (invalidVisit || availabilityError || Object.keys(windowErrors).length > 0) { setError(null); setProposalValidation({ windows: windowErrors, ...(availabilityError ? { availability: availabilityError } : {}) }); return; }
    submitting.current = true; setSaving(true); setError(null); setConflict(false); setProposalValidation(emptyProposalValidation);
    try {
      let base = draft;
      if (!base) {
        const idempotencyKey = attemptKey.current ?? key(); attemptKey.current = idempotencyKey;
        const creation = await createRoute({ date, sellerId, visits: selectedVisits.map((visit) => ({ customerId: visit.customerId, serviceDurationSeconds: Number(visit.serviceDurationMinutes) * 60 })) }, idempotencyKey);
        if (creation.response.status !== 201 || !creation.route) {
          if (creation.response.status === 409) { attemptKey.current = null; setConflict(true); }
          else { if (creation.response.status < 500) attemptKey.current = null; setError(await normalizeApiError(creation.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); }
          return;
        }
        attemptKey.current = null; base = creation.route; setDraft(base); onSaved();
      }
      let input: RouteOptimizationInput;
      try { input = { routeId: base.id, availability: { start: localRouteIso(base.date, availabilityStart), end: localRouteIso(base.date, availabilityEnd) }, baseRouteVersion: base.version, visits: selectedVisits.map((visit) => ({ customerId: visit.customerId, serviceDurationSeconds: Number(visit.serviceDurationMinutes) * 60, priority: requestPriority(visit.priority), windows: visit.windowStart ? [{ start: localRouteIso(base.date, visit.windowStart), end: localRouteIso(base.date, visit.windowEnd) }] : [] })) }; }
      catch { setProposalValidation({ availability: "Ingresa horas válidas con el formato HH:MM.", windows: {} }); return; }
      const result = await optimizeRoute(input);
      if (result.response.status === 200 && result.proposal) {
        const byCustomer = new Map(base.points.flatMap((point) => point.customerId ? [[point.customerId, point] as const] : []));
        const planned = result.proposal.orderedVisits.flatMap((visit) => { const point = byCustomer.get(visit.customerId); return point ? [point] : []; });
        const plannedIds = new Set(planned.map((point) => point.routePointId));
        setDraft({ ...base, points: resequence([...planned, ...ordered(base.points).filter((point) => !plannedIds.has(point.routePointId))]) });
        setProposal(result.proposal); setSurface("order"); setAnnouncement("Propuesta generada. Revisa el orden sin alteraciones o ajústalo antes de guardar.");
      } else if (result.response.status === 409) { setConflict(true); setProposal(null); }
      else setError(await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] });
    } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }
    finally { submitting.current = false; setSaving(false); }
  };
  const moveTo = (index: number, target: number) => { if (!draft || saving || index === target) return; const points = ordered(draft.points); if (target < 0 || target >= points.length) return; const [point] = points.splice(index, 1); points.splice(target, 0, point!); setDraft({ ...draft, points: resequence(points) }); setAnnouncement(proposal ? "Propuesta ajustada manualmente. Las estimaciones anteriores están pendientes de actualización." : `Punto movido a la posición ${target + 1}.`); };
  const saveOrder = async () => {
    if (!draft || saving || locked) return;
    setSaving(true); setError(null); setConflict(false);
    try {
      const currentPoints = ordered(draft.points);
      const result = proposal ? await reorderRoutePoints(draft, currentPoints, proposal.proposalVersion) : await reorderRoutePoints(draft, currentPoints);
      if (result.response.status === 200 && result.route) {
        setDraft(result.route); setOrderSaved(result.route); setSurface("idle"); setProposal(null);
        setAnnouncement(result.route.status === "PUBLISHED" ? "Orden guardado. El vendedor será notificado con la nueva versión." : "Orden guardado como borrador.");
        onSaved();
      } else if (result.response.status === 409) {
        const normalized = await normalizeApiError(result.response) ?? { status: 409, correlationId: null, fieldErrors: [] };
        if (draft.status === "PUBLISHED" && (normalized.code === "JOURNEY_ALREADY_STARTED" || normalized.code === "JOURNEY_STATE_UNAVAILABLE")) {
          setError(normalized); setLocked(true); setProposal(null); setConflict(false);
          setAnnouncement(normalized.code === "JOURNEY_ALREADY_STARTED" ? "La jornada ya inició. El orden publicado ya no puede modificarse." : "No se puede verificar el estado de la jornada. La ruta permanece en modo lectura.");
        } else {
          const localOrder = ordered(draft.points); setConflict(true);
          const fresh = await getRoute(draft.id);
          if (fresh.response.status === 200 && fresh.route) {
            if (fresh.route.status !== "DRAFT" && fresh.route.status !== "PUBLISHED") {
              setDraft(fresh.route); setLocked(true); setProposal(null);
              setAnnouncement("La ruta ya no admite cambios de orden y ahora se muestra en modo lectura.");
            } else {
              const freshById = new Map(fresh.route.points.map((point) => [point.routePointId, point]));
              const samePoints = fresh.route.points.length === localOrder.length && localOrder.every((point) => freshById.has(point.routePointId));
              if (!samePoints) {
                setDraft(fresh.route); setLocked(true);
                setAnnouncement("Los puntos de la ruta cambiaron. Revisa la versión vigente antes de continuar.");
              } else {
                const retained = localOrder.flatMap((point) => { const current = freshById.get(point.routePointId); return current ? [current] : []; });
                setDraft({ ...fresh.route, points: resequence(retained) });
                setAnnouncement("La versión cambió. Conservamos tu intención local; revisa y confirma nuevamente.");
              }
              setProposal(null);
            }
          } else setAnnouncement("No pudimos actualizar la versión. Conservamos tu orden para que puedas reintentar.");
        }
      } else {
        const normalized = await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] };
        setError(normalized);
        if (draft.status === "PUBLISHED" && (normalized.status === 400 || normalized.status === 422)) setLocked(true);
      }
    } catch (reason) {
      if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally { setSaving(false); }
  };
  const optimize = async () => { if (!draft || saving || !availabilityStart || !availabilityEnd) return; const selectedVisits = proposalVisits.filter((visit) => visit.included); const windowErrors = Object.fromEntries(selectedVisits.flatMap((visit) => !visit.windowStart && !visit.windowEnd ? [] : !visit.windowStart || !visit.windowEnd ? [[visit.customerId, "Completa el inicio y el fin de la ventana."]] : visit.windowStart >= visit.windowEnd ? [[visit.customerId, "El inicio de la ventana debe ser anterior al fin."]] : [])); const invalidVisit = selectedVisits.length < 1 || selectedVisits.length > 9 || selectedVisits.some((visit) => !/^\d+$/.test(visit.serviceDurationMinutes) || Number(visit.serviceDurationMinutes) < 1 || !validPriority(visit.priority)); const availabilityError = availabilityStart >= availabilityEnd ? "El inicio de jornada debe ser anterior al fin." : undefined; if (invalidVisit || availabilityError || Object.keys(windowErrors).length > 0) { setError(null); setProposalValidation({ windows: windowErrors, ...(availabilityError ? { availability: availabilityError } : {}) }); return; } let input: RouteOptimizationInput; try { input = { routeId: draft.id, availability: { start: localRouteIso(draft.date, availabilityStart), end: localRouteIso(draft.date, availabilityEnd) }, baseRouteVersion: draft.version, visits: selectedVisits.map((visit) => ({ customerId: visit.customerId, serviceDurationSeconds: Number(visit.serviceDurationMinutes) * 60, priority: requestPriority(visit.priority), windows: visit.windowStart ? [{ start: localRouteIso(draft.date, visit.windowStart), end: localRouteIso(draft.date, visit.windowEnd) }] : [] })) }; } catch { setError(null); setProposalValidation({ availability: "Ingresa horas válidas con el formato HH:MM.", windows: {} }); return; } setSaving(true); setError(null); setProposalValidation(emptyProposalValidation); setConflict(false); try { const result = await optimizeRoute(input); if (result.response.status === 200 && result.proposal) { const byCustomer = new Map(draft.points.flatMap((point) => point.customerId ? [[point.customerId, point] as const] : [])); const planned = result.proposal.orderedVisits.flatMap((visit) => { const point = byCustomer.get(visit.customerId); return point ? [point] : []; }); const plannedIds = new Set(planned.map((point) => point.routePointId)); setDraft({ ...draft, points: resequence([...planned, ...ordered(draft.points).filter((point) => !plannedIds.has(point.routePointId))]) }); setProposal(result.proposal); setSurface("order"); setAnnouncement("Propuesta generada. Revisa el orden y guarda los cambios cuando estés conforme."); } else if (result.response.status === 409) { setConflict(true); setProposal(null); } else setError(await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { setSaving(false); } };
  const changeDate = (value: string) => { request.current += 1; customerPage.current = 0; attemptKey.current = null; setDate(value); setCustomers(emptyCustomers); setSelected([]); setLoadingCustomers(false); setMoreCustomers(false); setSuggestionError(null); };
  const changeSeller = (value: string) => { request.current += 1; customerPage.current = 0; attemptKey.current = null; setSellerId(value); setCustomers(emptyCustomers); setSelected([]); setLoadingCustomers(false); setMoreCustomers(false); setSuggestionError(null); };
  const loadMore = async () => { if (loadingCustomers || !moreCustomers || !sellerId || !date) return; const next = customerPage.current + 1; setLoadingCustomers(true); try { const [portfolio, suggestions] = await Promise.all([listRouteCustomers(sellerId, next), listSuggestedRouteCustomers(sellerId, date, next)]); if (portfolio.response.status !== 200 || !portfolio.page) { setError(await normalizeApiError(portfolio.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); return; } const suggestionFailure = suggestions.response.status === 200 && suggestions.page ? null : await normalizeApiError(suggestions.response); const unique = new Map(customers.map((item) => [item.id, item])); portfolio.page.items.filter((item) => candidateForSeller(item, sellerId, sellers)).forEach((item) => unique.set(item.id, item)); suggestions.page?.items.filter((item) => candidateForSeller(item, sellerId, sellers)).forEach((item) => unique.set(item.id, item)); customerPage.current = next; setCustomers([...unique.values()]); setSuggestionError(suggestionFailure); setMoreCustomers(next + 1 < Math.max(portfolio.page.page.totalPages, suggestions.page?.page.totalPages ?? 0)); } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { setLoadingCustomers(false); } };
  const retrySuggestions = async () => { if (loadingCustomers || !sellerId || !date) return; setLoadingCustomers(true); try { const result = await listSuggestedRouteCustomers(sellerId, date, 0); if (result.response.status !== 200 || !result.page) { setSuggestionError(await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); return; } const unique = new Map(customers.map((item) => [item.id, item])); result.page.items.filter((item) => candidateForSeller(item, sellerId, sellers)).forEach((item) => unique.set(item.id, item)); setCustomers([...unique.values()]); setSuggestionError(null); } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setSuggestionError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { setLoadingCustomers(false); } };
  const openProposal = (route: Route, restoreOrder = false) => { if (route.status !== "DRAFT" || saving) return; setDraft(route); setProposal(null); setProposalVisits(proposalVisitsFor(route)); setAvailabilityStart(""); setAvailabilityEnd(""); setError(null); setProposalValidation(emptyProposalValidation); setConflict(false); setReturnToOrder(restoreOrder); setSurface("proposal"); };
  const updateProposalVisit = (customerId: string, patch: Partial<ProposalVisit>) => { setProposal(null); setProposalValidation(emptyProposalValidation); setProposalVisits((visits) => visits.map((visit) => visit.customerId === customerId ? { ...visit, ...patch } : visit)); };
  const updateAvailabilityStart = (value: string) => { setProposalValidation(emptyProposalValidation); setAvailabilityStart(value); };
  const updateAvailabilityEnd = (value: string) => { setProposalValidation(emptyProposalValidation); setAvailabilityEnd(value); };
  const openOrder = (route: Route) => { if ((route.status !== "DRAFT" && route.status !== "PUBLISHED") || saving) return; setDraft(route); setProposal(null); setConflict(false); setLocked(false); setError(null); setOrderSaved(null); setAnnouncement(""); setSurface("order"); };
  const openForm = (nextMode: RoutePlanningMode = "manual") => { clear(); setMode(nextMode); setError(null); setSurface("planning"); };
  const openProposalFromOrder = () => { if (!draft) return; if (proposalVisits.length === 0) { openProposal(draft, true); return; } setReturnToOrder(true); setSurface("proposal"); setError(null); setConflict(false); };
  const view = created ? { kind: "created" as const } : orderSaved ? { kind: "order-saved" as const } : formOpen ? { kind: "planning" as const, mode } : proposalOpen ? { kind: "proposal" as const } : orderOpen ? { kind: "order" as const } : { kind: "idle" as const };
  return { view, mode, formOpen, orderOpen, proposalOpen, date, sellerId, customers, selected, serviceDurations, hasInvalidDurations, loadingCustomers, moreCustomers, suggestionError, error, saving, draft, created, orderSaved, locked, conflict, announcement, availabilityStart, availabilityEnd, proposalVisits, proposal, proposalValidation, openForm, openOrder, openCreatedOrder: () => { if (created) { const route = created; setCreated(null); openOrder(route); } }, openProposal, openProposalFromOrder, close: clear, closeCreated: () => setCreated(null), closeOrderSaved: () => setOrderSaved(null), closeProposal: () => { if (!saving) { setSurface(returnToOrder ? "order" : "idle"); setError(null); setProposalValidation(emptyProposalValidation); setReturnToOrder(false); } }, closeOrder: clear, setDate: changeDate, setSellerId: changeSeller, setSelected: (value: readonly string[]) => { attemptKey.current = null; const unique = [...new Set(value)]; setSelected(unique); setServiceDurations((current) => Object.fromEntries(unique.map((customerId) => [customerId, current[customerId] ?? ""]))); setProposalVisits((current) => unique.map((customerId) => current.find((visit) => visit.customerId === customerId) ?? { customerId, included: true, serviceDurationMinutes: "", priority: "1", windowStart: "", windowEnd: "" })); }, setServiceDuration: (customerId: string, value: string) => { attemptKey.current = null; setServiceDurations((current) => ({ ...current, [customerId]: value.replace(/\D/g, "") })); }, setAvailabilityStart: updateAvailabilityStart, setAvailabilityEnd: updateAvailabilityEnd, updateProposalVisit, submit, generateAutomatic, optimize, move: (index: number, direction: -1 | 1) => moveTo(index, index + direction), moveTo, saveOrder, loadMore, retrySuggestions, retryCustomers: () => setLoadVersion((value) => value + 1) };
}
