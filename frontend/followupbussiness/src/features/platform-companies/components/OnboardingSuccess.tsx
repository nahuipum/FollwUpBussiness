import { CheckCircle2 } from "lucide-react";
import { AdminInvitationList } from "./AdminInvitationList";
import type { Company, CompanyAdminInvitation } from "../types";
type Props = {
  company: Company;
  invitations: readonly CompanyAdminInvitation[];
  invitationsLoading: boolean;
  invitationsUnavailable: boolean;
  onCompanies: () => void;
  onCreateAnother: () => void;
};
export function OnboardingSuccess({
  company,
  invitations,
  invitationsLoading,
  invitationsUnavailable,
  onCompanies,
  onCreateAnother,
}: Props) {
  return (
    <section className="company-success">
      <CheckCircle2 aria-hidden="true" />
      <h1>Empresa creada e invitación programada</h1>
      <p>
        El acceso queda pendiente hasta que SMTP acepte entrega y la persona
        complete activación.
      </p>
      <dl>
        <div>
          <dt>Empresa</dt>
          <dd>{company.legalName}</dd>
        </div>
      </dl>
      <AdminInvitationList
        invitations={invitations}
        loading={invitationsLoading}
        unavailable={invitationsUnavailable}
      />
      <div className="company-success__actions">
        <button
          type="button"
          className="company-button company-button--primary"
          onClick={onCompanies}
        >
          Ver empresas
        </button>
        <button
          type="button"
          className="company-button company-button--secondary"
          onClick={onCreateAnother}
        >
          Crear otra empresa
        </button>
      </div>
    </section>
  );
}
