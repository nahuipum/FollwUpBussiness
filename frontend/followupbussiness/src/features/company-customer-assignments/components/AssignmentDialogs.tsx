import { LoaderCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { DataTablePagination, DataTableStatus } from "../../../shared/ui/DataTable";
import { ModalHeader } from "../../../shared/ui/ModalHeader";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import { formatDate } from "../presentation";
import type { AssignmentClient, AssignmentResult } from "../types";

type ConfirmProps = {
  clients: readonly AssignmentClient[];
  sellerNames: string;
  effectiveFrom: string;
  reason: string;
  busy: boolean;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AssignmentConfirmationDialog({ clients, sellerNames, effectiveFrom, reason, busy, returnFocusRef, onCancel, onConfirm }: ConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return <ModalSurface titleId="assignment-confirm-title" descriptionId="assignment-confirm-description" role="alertdialog" onDismiss={onCancel} dismissOnEscape={!busy} dismissOnBackdrop={false} initialFocusRef={cancelRef} returnFocusRef={returnFocusRef} className="customer-assignment__dialog">
    <ModalHeader module="Confirmación" title="Aplicar la asignación" titleId="assignment-confirm-title" description="Esta es la última comprobación antes de enviar." descriptionId="assignment-confirm-description" onClose={onCancel} closeLabel="Cerrar confirmación" closeDisabled={busy} />
    <div className="customer-assignment__dialog-body">
      <RouteWarning />
      <div className="customer-assignment__confirm-points">
        <Point label="Clientes afectados" value={`${clients.length} clientes activos`} />
        <Point label="Nuevos responsables" value={sellerNames} />
        <Point label="Responsables actuales" value="Varían por cliente; revisados en el paso 3" />
        <Point label="Vigente desde" value={formatDate(effectiveFrom)} />
        <Point label="Motivo" value={reason.trim() || "Sin motivo"} />
      </div>
    </div>
    <footer className="customer-assignment__dialog-foot"><Button ref={cancelRef} onClick={onCancel} disabled={busy}>Seguir revisando</Button><Button variant="primary" onClick={onConfirm} disabled={busy} aria-busy={busy}>{busy && <LoaderCircle className="customer-assignment__spinner" aria-hidden="true" />}{busy ? `Asignando ${clients.length} clientes…` : "Confirmar asignación"}</Button></footer>
  </ModalSurface>;
}

type ResultsProps = {
  results: readonly AssignmentResult[];
  customerNames: ReadonlyMap<string, string>;
  onClose: () => void;
};

const RESULT_PAGE_SIZE = 20;

export function AssignmentResultsDialog({ results, customerNames, onClose }: ResultsProps) {
  const [page, setPage] = useState(0);
  const assigned = results.filter((result) => result.status === "ASSIGNED").length;
  const rejected = results.length - assigned;
  const totalPages = Math.ceil(results.length / RESULT_PAGE_SIZE);
  const visible = useMemo(() => results.slice(page * RESULT_PAGE_SIZE, (page + 1) * RESULT_PAGE_SIZE), [page, results]);
  const title = rejected === 0 ? "Asignación completada" : assigned === 0 ? "No se asignó ningún cliente" : "Asignación completada con rechazos";
  return <ModalSurface titleId="assignment-results-title" descriptionId="assignment-results-description" onDismiss={onClose} className="customer-assignment__dialog customer-assignment__dialog--results">
    <ModalHeader module="Resultado por cliente" title={title} titleId="assignment-results-title" description="Los datos se actualizaron y tus filtros se conservaron." descriptionId="assignment-results-description" onClose={onClose} closeLabel="Cerrar resultados" />
    <div className="customer-assignment__dialog-body" aria-live="polite">
      <div className="customer-assignment__result-totals"><DataTableStatus tone="success" label={`Asignados: ${assigned}`} />{rejected > 0 && <DataTableStatus tone="danger" label={`Rechazados: ${rejected}`} />}</div>
      <div className="customer-assignment__result-list">
        {visible.map((result) => <article key={result.customerId} className="customer-assignment__result-row"><span><strong>{customerNames.get(result.customerId) ?? "Cliente"}</strong><small>{result.status === "ASSIGNED" ? "Responsables actualizados" : rejectionMessage(result.errorCode)}</small></span><DataTableStatus tone={result.status === "ASSIGNED" ? "success" : "danger"} label={result.status === "ASSIGNED" ? "Asignado" : "Rechazado"} /></article>)}
      </div>
      {totalPages > 1 && <DataTablePagination variant="golden" showPageSize={false} page={page} totalPages={totalPages} pageSize={20} onPageChange={setPage} onPageSizeChange={() => undefined} ariaLabel="Paginación de resultados" summary={<>Mostrando {results.length ? page * RESULT_PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * RESULT_PAGE_SIZE, results.length)} de {results.length}</>} />}
    </div>
    <footer className="customer-assignment__dialog-foot"><Button variant="primary" onClick={onClose}>Cerrar y volver al listado</Button></footer>
  </ModalSurface>;
}

export function RouteWarning() {
  return <div className="customer-assignment__route-warning" role="note"><strong>La asignación puede afectar rutas ya publicadas.</strong><p>Las rutas publicadas no se reasignan automáticamente.</p></div>;
}

function Point({ label, value }: { label: string; value: string }) {
  return <div><small>{label}</small><strong>{value}</strong></div>;
}

function rejectionMessage(errorCode: string | null) {
  switch (errorCode) {
    case "CONFLICT":
    case "ASSIGNMENT_CHANGED": return "La asignación vigente cambió.";
    case "CUSTOMER_INACTIVE": return "El cliente ya no está activo.";
    case "SELLER_INACTIVE": return "Uno de los vendedores ya no está activo.";
    case "NOT_FOUND": return "El cliente o vendedor ya no está disponible.";
    default: return "No se pudo completar la asignación para este cliente.";
  }
}
