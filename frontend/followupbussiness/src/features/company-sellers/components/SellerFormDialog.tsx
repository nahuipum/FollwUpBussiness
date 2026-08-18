import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ModalSurface } from "../../../shared/ui/ModalSurface";
import type { Seller, SellerFormInput, SellerFormOptions } from "../types";

export function SellerFormDialog({
  seller,
  options,
  loadingOptions,
  busy,
  error,
  conflict,
  onClose,
  onSubmit,
  onRetryOptions,
  onReload,
}: {
  seller: Seller | null;
  options: SellerFormOptions | null;
  loadingOptions: boolean;
  busy: boolean;
  error: string | null;
  conflict: boolean;
  onClose: () => void;
  onSubmit: (input: SellerFormInput) => void;
  onRetryOptions: () => void;
  onReload: () => void;
}) {
  const [displayName, setDisplayName] = useState(seller?.displayName ?? "");
  const [email, setEmail] = useState(seller?.email ?? "");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState(seller?.phone ?? "");
  const [employeeCode, setEmployeeCode] = useState(seller?.employeeCode ?? "");
  const [supervisorId, setSupervisorId] = useState<string | null>(
    seller?.supervisorId ?? null,
  );
  const [territoryIds, setTerritoryIds] = useState<readonly string[]>(
    seller?.territoryIds ?? [],
  );
  const editing = seller !== null;
  const close = () => {
    if (!busy) onClose();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!busy && options)
      onSubmit({
        displayName: displayName.trim(),
        email: email.trim(),
        username: username.trim(),
        phone: phone.trim(),
        employeeCode: employeeCode.trim(),
        supervisorId,
        territoryIds: [...new Set(territoryIds)],
      });
  };
  return (
    <ModalSurface
      titleId="seller-form-title"
      onDismiss={close}
      className="seller-list__dialog seller-list__form-dialog"
    >
      <header>
        <h2 id="seller-form-title">
          {editing ? "Editar vendedor" : "Crear vendedor"}
        </h2>
        <button
          type="button"
          aria-label="Cerrar formulario"
          onClick={close}
          disabled={busy}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      {loadingOptions ? (
        <p role="status">Cargando opciones de asignación…</p>
      ) : !options ? (
        <div role="alert">
          <p>No pudimos cargar las opciones de asignación.</p>
          <button
            className="seller-list__secondary"
            type="button"
            onClick={onRetryOptions}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>
            Nombre completo
            <input
              autoFocus
              required
              minLength={2}
              maxLength={160}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <label>
            Correo corporativo
            <input
              required
              type="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={editing}
            />
          </label>
          {!editing && (
            <label>
              Usuario (opcional)
              <input
                minLength={3}
                maxLength={100}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
          )}
          <label>
            Teléfono (opcional)
            <input
              maxLength={30}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label>
            Código de vendedor (opcional)
            <input
              maxLength={50}
              value={employeeCode}
              onChange={(event) => setEmployeeCode(event.target.value)}
            />
          </label>
          <label>
            Supervisor
            <select
              value={supervisorId ?? ""}
              onChange={(event) => setSupervisorId(event.target.value || null)}
            >
              <option value="">Sin asignar</option>
              {options.supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.displayName}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>Zonas / sedes</legend>
            {options.territories.length === 0 ? (
              <p>No hay territorios activos disponibles.</p>
            ) : (
              options.territories.map((territory) => (
                <label key={territory.id} className="seller-list__checkbox">
                  <input
                    type="checkbox"
                    checked={territoryIds.includes(territory.id)}
                    onChange={(event) =>
                      setTerritoryIds((current) =>
                        event.target.checked
                          ? [...current, territory.id]
                          : current.filter((id) => id !== territory.id),
                      )
                    }
                  />
                  {territory.code} — {territory.name}
                </label>
              ))
            )}
          </fieldset>
          {error && (
            <div role="alert">
              <p>{error}</p>
              {conflict && (
                <button
                  className="seller-list__secondary"
                  type="button"
                  onClick={onReload}
                  disabled={busy}
                >
                  Recargar listado y conservar formulario
                </button>
              )}
            </div>
          )}
          <footer>
            <button
              className="seller-list__secondary"
              type="button"
              onClick={close}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              className="seller-list__primary"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Guardando…"
                : editing
                  ? "Guardar cambios"
                  : "Crear vendedor"}
            </button>
          </footer>
        </form>
      )}
    </ModalSurface>
  );
}
