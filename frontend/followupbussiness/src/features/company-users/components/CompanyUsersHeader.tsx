import { Plus } from "lucide-react";
import type { RefObject } from "react";

type Props = {
  readOnly: boolean;
  inviteButtonRef: RefObject<HTMLButtonElement | null>;
  onInvite: () => void;
};

export function CompanyUsersHeader({
  readOnly,
  inviteButtonRef,
  onInvite,
}: Props) {
  return (
    <header className="company-users__heading">
      <div>
        <h1 id="company-users-title">Administradores y supervisores</h1>
        <p>Administra accesos de administradores y supervisores.</p>
      </div>
      {!readOnly && (
        <button
          ref={inviteButtonRef}
          className="company-users__primary"
          type="button"
          onClick={onInvite}
        >
          <Plus aria-hidden="true" />
          Invitar administrador o supervisor
        </button>
      )}
    </header>
  );
}
