import { Check, CircleAlert, Clock3, MailCheck } from "lucide-react";
import type { CompanyAdminInvitation } from "../types";

type Props = {
  invitations: readonly CompanyAdminInvitation[];
  loading: boolean;
  unavailable: boolean;
};

const labels = {
  PENDING: "Pendiente de envío",
  SENT: "Enviada, pendiente de aceptación",
  FAILED: "Entrega fallida",
  ACCEPTED: "Acceso aceptado",
} as const;

function StatusIcon({ status }: { status: CompanyAdminInvitation["deliveryStatus"] }) {
  if (status === "ACCEPTED") return <Check aria-hidden="true" />;
  if (status === "SENT") return <MailCheck aria-hidden="true" />;
  if (status === "FAILED") return <CircleAlert aria-hidden="true" />;
  return <Clock3 aria-hidden="true" />;
}

export function AdminInvitationList({ invitations, loading, unavailable }: Props) {
  return (
    <section className="company-invitations" aria-labelledby="company-invitations-title">
      <div className="company-invitations__heading">
        <div>
          <h2 id="company-invitations-title">Administradores e invitaciones</h2>
          <p>Estado de cada acceso administrativo de esta empresa.</p>
        </div>
      </div>
      {loading ? <p className="company-invitations__state">Cargando invitaciones…</p>
        : unavailable ? <p className="company-invitations__state" role="status">No fue posible cargar invitaciones.</p>
        : invitations.length === 0 ? <p className="company-invitations__state">Aún no hay administradores invitados.</p>
        : <ul>
          {invitations.map((invitation) => <li key={invitation.id}>
            <div>
              <strong>{invitation.displayName}</strong>
              <span>{invitation.email}</span>
            </div>
            <span className={`company-invitation-status company-invitation-status--${invitation.deliveryStatus.toLowerCase()}`}>
              <StatusIcon status={invitation.deliveryStatus} />
              {invitation.deliveryStatus === "PENDING" && invitation.deliveryAttempts > 0
                ? `Pendiente de envío · reintento ${invitation.deliveryAttempts}`
                : labels[invitation.deliveryStatus]}
            </span>
          </li>)}
        </ul>}
    </section>
  );
}
