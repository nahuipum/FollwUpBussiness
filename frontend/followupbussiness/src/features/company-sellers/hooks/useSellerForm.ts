import { useEffect, useRef, useState } from "react";
import {
  ApiRequestObsoleteError,
  normalizeApiError,
  type ApiError,
} from "../../../lib/api";
import { subscribeToSession } from "../../auth/auth";
import {
  createSeller,
  listSellerFormOptions,
  updateSeller,
  updateSellerSupervisor,
  updateSellerTerritories,
} from "../api";
import type { Seller, SellerFormInput, SellerFormOptions } from "../types";

export function useSellerForm(onSaved: () => void) {
  const requestRef = useRef(0);
  const mutationRef = useRef(0);
  const [seller, setSeller] = useState<Seller | null | undefined>(undefined);
  const [options, setOptions] = useState<SellerFormOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [failedSection, setFailedSection] = useState<string | null>(null);
  const loadOptions = () => {
    const requestId = ++requestRef.current;
    setLoadingOptions(true);
    setOptions(null);
    setError(null);
    void listSellerFormOptions()
      .then(async (result) => {
        if (requestId !== requestRef.current) return;
        if (result.response.status === 200 && result.options)
          setOptions(result.options);
        else setError(await normalizeApiError(result.response));
      })
      .catch((reason) => {
        if (
          requestId === requestRef.current &&
          !(reason instanceof ApiRequestObsoleteError)
        )
          setError({ status: 500, correlationId: null, fieldErrors: [] });
      })
      .finally(() => {
        if (requestId === requestRef.current) setLoadingOptions(false);
      });
  };
  const open = (next: Seller | null) => {
    setSeller(next);
    setFailedSection(null);
    loadOptions();
  };
  const reset = () => {
    requestRef.current += 1;
    setSeller(undefined);
    setOptions(null);
    setError(null);
    setFailedSection(null);
  };
  const close = () => {
    if (!busy) reset();
  };
  const reloadAfterConflict = () => {
    if (busy) return;
    setError(null);
    setFailedSection(null);
    onSaved();
  };
  useEffect(
    () =>
      subscribeToSession(() => {
        requestRef.current += 1;
        mutationRef.current += 1;
        setSeller(undefined);
        setOptions(null);
        setLoadingOptions(false);
        setBusy(false);
        setError(null);
        setFailedSection(null);
      }),
    [],
  );
  const submit = async (input: SellerFormInput) => {
    if (busy || !options) return;
    const mutationId = ++mutationRef.current;
    setBusy(true);
    setError(null);
    setFailedSection(null);
    try {
      if (seller === null) {
        const response = await createSeller(input);
        if (response.status !== 202) {
          setError(await normalizeApiError(response));
          return;
        }
      } else if (seller) {
        let response = await updateSeller(seller, input);
        if (response.status !== 200) {
          setFailedSection("datos del vendedor");
          setError(await normalizeApiError(response));
          return;
        }
        response = await updateSellerSupervisor(seller.id, input.supervisorId);
        if (response.status !== 200) {
          setFailedSection("asignación de supervisor");
          setError(await normalizeApiError(response));
          onSaved();
          return;
        }
        response = await updateSellerTerritories(seller.id, input.territoryIds);
        if (response.status !== 200) {
          setFailedSection("asignación de territorios");
          setError(await normalizeApiError(response));
          onSaved();
          return;
        }
      }
      if (mutationId === mutationRef.current) {
        reset();
        onSaved();
      }
    } catch (reason) {
      if (
        mutationId === mutationRef.current &&
        !(reason instanceof ApiRequestObsoleteError)
      )
        setError({ status: 500, correlationId: null, fieldErrors: [] });
    } finally {
      if (mutationId === mutationRef.current) setBusy(false);
    }
  };
  return {
    seller,
    options,
    loadingOptions,
    busy,
    error: error ? mutationErrorMessage(error.status, failedSection) : null,
    conflict: error?.status === 409,
    open,
    close,
    loadOptions,
    reloadAfterConflict,
    submit,
  };
}

function mutationErrorMessage(status: number, section: string | null) {
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 409)
    return "Los datos cambiaron. Recarga la lista antes de reintentar; lo escrito se conserva.";
  if (status === 422)
    return section
      ? `Revisa la ${section} e inténtalo nuevamente.`
      : "Revisa la información ingresada e inténtalo nuevamente.";
  return section
    ? `No fue posible guardar la ${section}. Se actualizó el listado para evitar datos desactualizados.`
    : "No pudimos guardar los cambios. Inténtalo nuevamente.";
}
