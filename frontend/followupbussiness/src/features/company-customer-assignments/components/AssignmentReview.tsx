import { DataTablePagination } from "../../../shared/ui/DataTable";
import { formatDate } from "../presentation";
import type { AssignmentClient } from "../types";

const REVIEW_PAGE_SIZE = 5;

type Props = {
  clients: readonly AssignmentClient[];
  sellerNames: string;
  effectiveFrom: string;
  reason: string;
  currentOwners: (client: AssignmentClient) => string;
  page: number;
  onPageChange: (page: number) => void;
};

export function AssignmentReview({ clients, sellerNames, effectiveFrom, reason, currentOwners, page, onPageChange }: Props) {
  const totalPages = Math.ceil(clients.length / REVIEW_PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const visible = clients.slice(safePage * REVIEW_PAGE_SIZE, (safePage + 1) * REVIEW_PAGE_SIZE);
  const first = clients.length ? safePage * REVIEW_PAGE_SIZE + 1 : 0;
  const last = Math.min((safePage + 1) * REVIEW_PAGE_SIZE, clients.length);
  return <div className="customer-assignment__review">
    <div className="customer-assignment__impact-grid">
      <Impact label="Clientes" value={String(clients.length)} />
      <Impact label="Nuevos responsables" value={sellerNames} />
      <Impact label="Vigente desde" value={formatDate(effectiveFrom)} />
      <Impact label="Motivo" value={reason.trim() || "Sin motivo"} />
    </div>
    <section className="customer-assignment__comparison" aria-label="Comparación de responsables por cliente">
      {visible.map((client) => <article key={client.id} className="customer-assignment__comparison-row"><strong>{client.name}<small>Cliente activo</small></strong><span><small>Actual</small>{currentOwners(client)}</span><span><small>Nuevo</small>{sellerNames}</span></article>)}
      {totalPages > 1 && <DataTablePagination variant="golden" showPageSize={false} page={safePage} totalPages={totalPages} pageSize={5} onPageChange={onPageChange} onPageSizeChange={() => undefined} ariaLabel="Paginación de revisión" summary={<>Mostrando {first}–{last} de {clients.length} clientes</>} />}
    </section>
  </div>;
}

function Impact({ label, value }: { label: string; value: string }) {
  return <div className="customer-assignment__impact-card"><small>{label}</small><strong>{value}</strong></div>;
}
