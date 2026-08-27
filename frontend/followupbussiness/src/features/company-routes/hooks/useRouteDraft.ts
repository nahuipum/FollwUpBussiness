import { useEffect, useRef, useState } from "react";
import { ApiRequestObsoleteError, normalizeApiError, type ApiError } from "../../../lib/api";
import { getSessionGeneration, getSessionIdentity, subscribeToSession } from "../../auth/auth";
import { createRoute, getRoute, listRouteCustomers, listSuggestedRouteCustomers, reorderRoutePoints } from "../api";
import type { Route, RouteCustomerOption, RoutePoint } from "../types";

const emptyCustomers: readonly RouteCustomerOption[] = [];
const sessionKey = () => { const identity = getSessionIdentity(); const company = identity?.company; const companyId = typeof company === "object" && company !== null && typeof (company as Record<string, unknown>).id === "string" ? (company as Record<string, unknown>).id : String(company); return identity ? `${getSessionGeneration()}:${identity.id}:${companyId}` : `${getSessionGeneration()}:anonymous`; };
const key = () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const ordered = (points: readonly RoutePoint[]) => [...points].sort((a, b) => a.sequence - b.sequence);
const resequence = (points: readonly RoutePoint[]) => points.map((point, index) => ({ ...point, sequence: index + 1 }));

export function useRouteDraft(onSaved: () => void) {
  const session = useRef(sessionKey()); const request = useRef(0); const submitting = useRef(false); const customerPage = useRef(0); const attemptKey = useRef<string | null>(null);
  const [open, setOpen] = useState(false); const [date, setDate] = useState(""); const [sellerId, setSellerId] = useState(""); const [customers, setCustomers] = useState<readonly RouteCustomerOption[]>(emptyCustomers); const [selected, setSelected] = useState<readonly string[]>([]); const [loadingCustomers, setLoadingCustomers] = useState(false); const [moreCustomers, setMoreCustomers] = useState(false); const [suggestionError, setSuggestionError] = useState<ApiError | null>(null); const [error, setError] = useState<ApiError | null>(null); const [saving, setSaving] = useState(false); const [draft, setDraft] = useState<Route | null>(null); const [conflict, setConflict] = useState(false); const [announcement, setAnnouncement] = useState(""); const [loadVersion, setLoadVersion] = useState(0);
  const clear = () => { request.current += 1; customerPage.current = 0; attemptKey.current = null; submitting.current = false; setOpen(false); setDate(""); setSellerId(""); setCustomers(emptyCustomers); setSelected([]); setLoadingCustomers(false); setMoreCustomers(false); setSuggestionError(null); setError(null); setSaving(false); setDraft(null); setConflict(false); setAnnouncement(""); };
  useEffect(() => subscribeToSession(() => { const next = sessionKey(); if (next !== session.current) { session.current = next; clear(); } }), []);
  useEffect(() => {
    if (!open || !sellerId || !date) return;
    const id = ++request.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicia la carga asíncrona al cambiar fecha, vendedor o diálogo.
    setLoadingCustomers(true); setError(null);
    void Promise.all([listRouteCustomers(sellerId, 0), listSuggestedRouteCustomers(sellerId, date, 0)]).then(async ([portfolio, suggestions]) => {
      if (id !== request.current) return;
      const failed = portfolio.response.status === 200 && portfolio.page ? null : await normalizeApiError(portfolio.response);
      if (failed) { setCustomers(emptyCustomers); setSelected([]); setError(failed); return; }
      const suggestionFailure = suggestions.response.status === 200 && suggestions.page ? null : await normalizeApiError(suggestions.response);
      const unique = new Map<string, RouteCustomerOption>();
      portfolio.page?.items.forEach((item) => unique.set(item.id, item)); suggestions.page?.items.forEach((item) => unique.set(item.id, item));
      customerPage.current = 0; setCustomers([...unique.values()]); setSuggestionError(suggestionFailure); setMoreCustomers((portfolio.page?.page.totalPages ?? 0) > 1 || (suggestions.page?.page.totalPages ?? 0) > 1);
    }).catch((reason) => { if (id === request.current && !(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }).finally(() => { if (id === request.current) setLoadingCustomers(false); });
  }, [date, loadVersion, open, sellerId]);
  const submit = async () => {
    if (saving || submitting.current || !date || !sellerId || selected.length < 1 || selected.length > 50) return;
    submitting.current = true; setSaving(true); setError(null); setConflict(false);
    const idempotencyKey = attemptKey.current ?? key(); attemptKey.current = idempotencyKey;
    try { const result = await createRoute({ date, sellerId, customerIds: [...new Set(selected)] }, idempotencyKey); if (result.response.status === 201 && result.route) { attemptKey.current = null; setDraft(result.route); setAnnouncement("Borrador creado. Puedes ajustar el orden de los puntos."); onSaved(); } else if (result.response.status === 409) { attemptKey.current = null; setConflict(true); } else { if (result.response.status < 500) attemptKey.current = null; setError(await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); } }
    catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); }
    finally { submitting.current = false; setSaving(false); }
  };
  const moveTo = (index: number, target: number) => { if (!draft || saving || index === target) return; const points = ordered(draft.points); if (target < 0 || target >= points.length) return; const [point] = points.splice(index, 1); points.splice(target, 0, point!); setDraft({ ...draft, points: resequence(points) }); setAnnouncement(`Punto movido a la posición ${target + 1}.`); };
  const move = (index: number, direction: -1 | 1) => moveTo(index, index + direction);
  const saveOrder = async () => { if (!draft || saving) return; setSaving(true); setError(null); setConflict(false); try { const result = await reorderRoutePoints(draft, ordered(draft.points)); if (result.response.status === 200 && result.route) { setDraft(result.route); setAnnouncement("Orden guardado. Actualizamos el detalle vial."); } else if (result.response.status === 409) {
      const localOrder = ordered(draft.points);
      setConflict(true);
      const fresh = await getRoute(draft.id);
      if (fresh.response.status === 200 && fresh.route) {
        const freshById = new Map(fresh.route.points.map((point) => [point.routePointId, point]));
        const retained = localOrder.flatMap((point) => { const current = freshById.get(point.routePointId); return current ? [current] : []; });
        const added = fresh.route.points.filter((point) => !localOrder.some((local) => local.routePointId === point.routePointId));
        setDraft({ ...fresh.route, points: resequence([...retained, ...added]) });
        setAnnouncement("La versión guardada cambió. Conservamos tu orden para que puedas reintentar.");
      } else setAnnouncement("No pudimos actualizar la versión. Conservamos tu orden para que puedas reintentar.");
    } else setError(await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { setSaving(false); } };
  const loadMore = async () => { if (loadingCustomers || !moreCustomers || !sellerId || !date) return; const next = customerPage.current + 1; setLoadingCustomers(true); try { const [portfolio, suggestions] = await Promise.all([listRouteCustomers(sellerId, next), listSuggestedRouteCustomers(sellerId, date, next)]); if (portfolio.response.status !== 200 || !portfolio.page) { setError(await normalizeApiError(portfolio.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); return; } const suggestionFailure = suggestions.response.status === 200 && suggestions.page ? null : await normalizeApiError(suggestions.response); const unique = new Map(customers.map((item) => [item.id, item])); portfolio.page.items.forEach((item) => unique.set(item.id, item)); suggestions.page?.items.forEach((item) => unique.set(item.id, item)); customerPage.current = next; setCustomers([...unique.values()]); setSuggestionError(suggestionFailure); setMoreCustomers(next + 1 < Math.max(portfolio.page.page.totalPages, suggestions.page?.page.totalPages ?? 0)); } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { setLoadingCustomers(false); } };
  const retrySuggestions = async () => { if (loadingCustomers || !sellerId || !date) return; setLoadingCustomers(true); try { const result = await listSuggestedRouteCustomers(sellerId, date, 0); if (result.response.status !== 200 || !result.page) { setSuggestionError(await normalizeApiError(result.response) ?? { status: 500, correlationId: null, fieldErrors: [] }); return; } const unique = new Map(customers.map((item) => [item.id, item])); result.page.items.forEach((item) => unique.set(item.id, item)); setCustomers([...unique.values()]); setSuggestionError(null); } catch (reason) { if (!(reason instanceof ApiRequestObsoleteError)) setSuggestionError({ status: 500, correlationId: null, fieldErrors: [] }); } finally { setLoadingCustomers(false); } };
  const changeDate = (value: string) => { request.current += 1; customerPage.current = 0; attemptKey.current = null; setDate(value); setCustomers(emptyCustomers); setSelected([]); setLoadingCustomers(false); setMoreCustomers(false); setSuggestionError(null); };
  const changeSeller = (value: string) => { request.current += 1; customerPage.current = 0; attemptKey.current = null; setSellerId(value); setCustomers(emptyCustomers); setSelected([]); setLoadingCustomers(false); setMoreCustomers(false); setSuggestionError(null); };
  const changeSelected = (value: readonly string[]) => { attemptKey.current = null; setSelected([...new Set(value)]); };
  return { open, date, sellerId, customers, selected, loadingCustomers, moreCustomers, suggestionError, error, saving, draft, conflict, announcement, openForm: () => setOpen(true), close: clear, setDate: changeDate, setSellerId: changeSeller, setSelected: changeSelected, submit, move, moveTo, saveOrder, loadMore, retrySuggestions, retryCustomers: () => setLoadVersion((value) => value + 1) };
}
