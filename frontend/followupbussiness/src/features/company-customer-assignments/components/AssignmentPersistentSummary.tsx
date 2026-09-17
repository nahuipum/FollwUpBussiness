import { List, Trash2, X } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { formatDate } from "../presentation";
import type { AssignmentClient } from "../types";

type Props = {
  sellerNames: string;
  effectiveFrom: string;
  reason: string;
  clients: readonly AssignmentClient[];
  currentOwners: (client: AssignmentClient) => string;
  onRemove: (client: AssignmentClient) => void;
  onViewAll: () => void;
  onClear: () => void;
};

export function AssignmentPersistentSummary({ sellerNames, effectiveFrom, reason, clients, currentOwners, onRemove, onViewAll, onClear }: Props) {
  const sample = clients.slice(0, 2);
  const remaining = clients.length - sample.length;
  return (
    <aside className="customer-assignment__summary" aria-label="Resumen persistente">
      <header className="customer-assignment__summary-head">
        <span className="customer-assignment__eyebrow">Resumen persistente</span>
        <h2>Operación actual</h2>
        <p>Tu progreso se conserva al volver.</p>
      </header>
      <div className="customer-assignment__summary-body">
        <SummaryBlock label="Nuevos responsables" value={sellerNames || "Sin seleccionar"} />
        <SummaryBlock label="Vigente desde" value={effectiveFrom ? formatDate(effectiveFrom) : "Sin indicar"} />
        <SummaryBlock label="Motivo" value={reason.trim() || "Sin motivo"} />
        <SummaryBlock label="Clientes" value={`${clients.length} seleccionado${clients.length === 1 ? "" : "s"}`} />
        {clients.length > 0 && <ul className="customer-assignment__summary-clients">
          {sample.map((client) => <li key={client.id}><span><strong>{client.name}</strong><small>Actual: {currentOwners(client)}</small></span><Button size="compact" iconOnly aria-label={`Quitar ${client.name}`} onClick={() => onRemove(client)}><X aria-hidden="true" /></Button></li>)}
          {remaining > 0 && <li><span><strong>+ {remaining} clientes</strong><small>Revisables en el paso 3</small></span><Button size="compact" onClick={onViewAll}><List aria-hidden="true" />Ver lista</Button></li>}
        </ul>}
      </div>
      <footer className="customer-assignment__summary-foot">
        <Button variant={clients.length ? "ghost" : "secondary"} disabled={!clients.length} onClick={onClear}>{clients.length ? <><Trash2 aria-hidden="true" />Vaciar clientes seleccionados</> : "Sin clientes seleccionados"}</Button>
      </footer>
    </aside>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return <div className="customer-assignment__summary-block"><small>{label}</small><strong>{value}</strong></div>;
}
