import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { ClientFormDialog } from "./ClientFormDialog";
import type { Client } from "../types";

vi.mock("./ClientLocationMap", () => ({
  ClientLocationMap: ({ onConfirm }: { onConfirm: (point: { latitude: number; longitude: number }) => void }) =>
    <button type="button" onClick={() => onConfirm({ latitude: -12.05, longitude: -77.04 })}>Arrastrar marcador</button>,
}));

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.clearAllMocks();
});

const duplicate: Client = {
  id: "customer-1",
  name: "Cliente similar",
  segment: null,
  territoryId: null,
  assignedSellerIds: [],
  status: "ACTIVE",
  location: { latitude: -12.05, longitude: -77.04 },
  createdAt: "2026-08-19T00:00:00Z",
  updatedAt: "2026-08-19T00:00:00Z",
  version: 1,
};

const requiredCallbacks = {
  onClose: vi.fn(),
  onRetry: vi.fn(),
  onSubmit: vi.fn(),
  onDuplicateCheck: vi.fn(),
  onDismissError: vi.fn(),
  onDismissDuplicates: vi.fn(),
};

test("inicia sin coordenadas y exige elegir y confirmar el punto", () => {
  render(<ClientFormDialog client={null} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} />);

  const latitude = screen.getByLabelText("Latitud") as HTMLInputElement;
  const longitude = screen.getByLabelText("Longitud") as HTMLInputElement;
  const confirmation = screen.getByLabelText(/Confirmo que estas coordenadas/) as HTMLInputElement;
  const save = screen.getByRole("button", { name: "Crear cliente" }) as HTMLButtonElement;
  const duplicateCheck = screen.getByRole("button", { name: "Comprobar duplicados" }) as HTMLButtonElement;

  expect(latitude.value).toBe("");
  expect(longitude.value).toBe("");
  expect(confirmation.disabled).toBe(true);
  expect(save.disabled).toBe(true);
  expect(duplicateCheck.disabled).toBe(true);

  fireEvent.click(screen.getByRole("button", { name: "Arrastrar marcador" }));
  expect(latitude.value).toBe("-12.05");
  expect(longitude.value).toBe("-77.04");
  expect(confirmation.disabled).toBe(false);
  expect(confirmation.checked).toBe(false);
  expect(save.disabled).toBe(true);
  expect(duplicateCheck.disabled).toBe(true);
});

function completeRequiredFields() {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Comercial Norte" } });
  fireEvent.change(screen.getByLabelText("Dirección"), { target: { value: "Av. Lima 1" } });
  fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "-12.04" } });
  fireEvent.change(screen.getByLabelText("Longitud"), { target: { value: "-77.03" } });
}

test("exige reconfirmar la ubicación después de editar o arrastrar el marcador", () => {
  const submit = vi.fn();
  render(<ClientFormDialog client={null} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} onSubmit={submit} />);
  completeRequiredFields();
  const save = screen.getByRole("button", { name: "Crear cliente" }) as HTMLButtonElement;
  const confirmation = screen.getByLabelText(/Confirmo que estas coordenadas/);

  expect(save.disabled).toBe(true);
  fireEvent.click(confirmation);
  expect(save.disabled).toBe(false);
  fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "-12.05" } });
  expect(save.disabled).toBe(true);
  fireEvent.click(confirmation);
  fireEvent.click(screen.getByRole("button", { name: "Arrastrar marcador" }));
  expect(save.disabled).toBe(true);
  fireEvent.click(confirmation);
  fireEvent.click(save);
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ latitude: -12.05, longitude: -77.04 }));
});

test("precarga la edición y mantiene tipo y número de documento en una fila responsive", () => {
  const submit = vi.fn();
  render(<ClientFormDialog client={{ ...duplicate, address: "Av. Lima 1", documentType: "DNI", documentNumber: "12345678", phone: "999999999", email: "contacto@example.com", visitFrequencyDays: 30 }} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} onSubmit={submit} />);

  expect(screen.getByRole("button", { name: "Tipo de documento" }).textContent).toContain("DNI");
  expect((screen.getByLabelText("Número de documento") as HTMLInputElement).value).toBe("12345678");
  expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("contacto@example.com");
  expect((screen.getByLabelText("Frecuencia de visita (días)") as HTMLInputElement).value).toBe("30");

  expect(screen.getByLabelText("Número de documento").closest(".client-form__document-fields")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Frecuencia de visita (días)"), { target: { value: "366" } });
  expect((screen.getByRole("button", { name: "Guardar cambios" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Frecuencia de visita (días)"), { target: { value: "45" } });
  fireEvent.click(screen.getByLabelText(/Confirmo que estas coordenadas/));
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ documentType: "DNI", documentNumber: "12345678", phone: "999999999", email: "contacto@example.com", segment: "", visitFrequencyDays: 45 }));
});

test("valida longitudes de DNI, RUC y carné, móvil y email antes de enviar", () => {
  render(<ClientFormDialog client={null} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} />);
  completeRequiredFields();
  fireEvent.click(screen.getByLabelText(/Confirmo que estas coordenadas/));
  const type = screen.getByRole("button", { name: "Tipo de documento" });
  const number = screen.getByLabelText("Número de documento") as HTMLInputElement;
  const phone = screen.getByLabelText("Teléfono") as HTMLInputElement;
  const email = screen.getByLabelText("Email") as HTMLInputElement;
  const save = screen.getByRole("button", { name: "Crear cliente" }) as HTMLButtonElement;

  fireEvent.click(type); fireEvent.click(screen.getByRole("option", { name: "DNI" }));
  fireEvent.change(number, { target: { value: "123a4567" } });
  expect(number.value).toBe("1234567");
  expect(screen.getByRole("alert").closest(".client-form__document-fields")).toBeTruthy();
  expect(save.disabled).toBe(true);
  fireEvent.change(number, { target: { value: "12345678" } });
  expect(save.disabled).toBe(false);

  fireEvent.click(type); fireEvent.click(screen.getByRole("option", { name: "RUC" }));
  expect(number.value).toBe("");
  fireEvent.change(number, { target: { value: "12345678901" } });
  expect(save.disabled).toBe(false);
  fireEvent.click(type); fireEvent.click(screen.getByRole("option", { name: "Carné de Extranjería" }));
  fireEvent.change(number, { target: { value: "123456789" } });
  expect(save.disabled).toBe(false);

  fireEvent.change(phone, { target: { value: "812345678" } });
  const phoneAlert = screen.getByRole("alert");
  expect(phoneAlert.textContent).toContain("móvil peruano");
  expect(phone.closest(".client-form__validated-field")?.contains(phoneAlert)).toBe(true);
  expect(email.closest(".client-form__validated-field")?.contains(phoneAlert)).toBe(false);
  expect(save.disabled).toBe(true);
  fireEvent.change(phone, { target: { value: "999999999" } });
  fireEvent.change(email, { target: { value: "invalido@" } });
  expect(screen.getByRole("alert").textContent).toContain("email válido");
  expect(save.disabled).toBe(true);
  fireEvent.change(email, { target: { value: "contacto@example.com" } });
  expect(save.disabled).toBe(false);
});

test("pasa criterios normalizados y excludeCustomerId al chequeo de duplicados", () => {
  const duplicateCheck = vi.fn();
  render(<ClientFormDialog client={{ ...duplicate, address: "Av. Lima 1", documentType: null, documentNumber: null, phone: null, email: null, visitFrequencyDays: null }} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} onDuplicateCheck={duplicateCheck} />);
  const button = screen.getByRole("button", { name: "Comprobar duplicados" }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/Confirmo que estas coordenadas/));
  expect(button.disabled).toBe(false);
  fireEvent.click(button);
  expect(duplicateCheck).toHaveBeenCalledWith(expect.objectContaining({ name: "Cliente similar", address: "Av. Lima 1", latitude: -12.05, longitude: -77.04, excludeCustomerId: duplicate.id }));
});

test("ubica la comprobación después de ubicación y antes de las acciones de guardado", () => {
  render(<ClientFormDialog client={null} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} />);

  const location = screen.getByRole("heading", { name: "Ubicación" }).closest("section")!;
  const check = screen.getByRole("button", { name: "Comprobar duplicados" });
  const cancel = screen.getByRole("button", { name: "Cancelar" });
  const create = screen.getByRole("button", { name: "Crear cliente" });

  expect(location.compareDocumentPosition(check) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(check.compareDocumentPosition(cancel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(cancel.compareDocumentPosition(create) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText("Es una advertencia informativa y no es necesaria para crear o guardar el cliente.")).toBeTruthy();
});

test("habilita la comprobación solo con captura válida y confirmada, sin exigirla para crear", () => {
  const submit = vi.fn();
  render(<ClientFormDialog client={null} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} onSubmit={submit} />);
  const check = screen.getByRole("button", { name: "Comprobar duplicados" }) as HTMLButtonElement;
  const save = screen.getByRole("button", { name: "Crear cliente" }) as HTMLButtonElement;

  completeRequiredFields();
  expect(check.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/Confirmo que estas coordenadas/));
  expect(check.disabled).toBe(false);
  fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "812345678" } });
  expect(check.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "999999999" } });
  expect(check.disabled).toBe(false);
  fireEvent.click(save);
  expect(submit).toHaveBeenCalledTimes(1);
});

test("bloquea un segundo envío cuando la mutación queda ocupada", () => {
  const submit = vi.fn();
  function BusyDialog() {
    const [busy, setBusy] = useState(false);
    return <ClientFormDialog client={null} territories={[]} loading={false} busy={busy} error={null} duplicates={null} {...requiredCallbacks} onSubmit={(input) => { submit(input); setBusy(true); }} />;
  }
  render(<BusyDialog />);
  completeRequiredFields();
  fireEvent.click(screen.getByLabelText(/Confirmo que estas coordenadas/));
  const save = screen.getByRole("button", { name: "Crear cliente" });
  fireEvent.click(save);
  fireEvent.click(save);
  expect(submit).toHaveBeenCalledTimes(1);
  expect((screen.getByRole("button", { name: "Guardando…" }) as HTMLButtonElement).disabled).toBe(true);
});

test("pide confirmar en un popup antes de descartar cambios", () => {
  const close = vi.fn();
  render(<ClientFormDialog client={null} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} onClose={close} />);

  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Cliente pendiente" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

  expect(screen.getByRole("heading", { name: "Descartar cambios" })).toBeTruthy();
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
  expect(close).toHaveBeenCalledTimes(1);
});

test("muestra errores y duplicados como popups accesibles", () => {
  const dismissError = vi.fn();
  const { rerender } = render(<ClientFormDialog client={null} territories={[]} loading={false} busy={false} error="La solicitud no pudo completarse." duplicates={null} {...requiredCallbacks} onDismissError={dismissError} />);

  expect(screen.getByRole("alert").textContent).toContain("La solicitud no pudo completarse");
  fireEvent.click(screen.getByRole("button", { name: "Volver al formulario" }));
  expect(dismissError).toHaveBeenCalledTimes(1);

  rerender(<ClientFormDialog client={null} territories={[]} loading={false} busy={false} error={null} duplicates={[duplicate]} {...requiredCallbacks} />);
  expect(screen.getByRole("heading", { name: "Posibles clientes duplicados" })).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toContain("no bloquea la creación");
});

test("lleva el foco al formulario, lo atrapa e ignora Escape hasta cerrar con la X", () => {
  function FormFlow() {
    const [open, setOpen] = useState(false);
    return <><button type="button" onClick={() => setOpen(true)}>Crear cliente</button>{open && <ClientFormDialog client={null} territories={[]} loading={false} busy={false} error={null} duplicates={null} {...requiredCallbacks} onClose={() => setOpen(false)} />}</>;
  }
  render(<FormFlow />);
  const trigger = screen.getByRole("button", { name: "Crear cliente" });
  trigger.focus();
  fireEvent.click(trigger);

  const name = screen.getByLabelText("Nombre");
  const lastControl = screen.getByRole("button", { name: "Cancelar" });
  const close = screen.getByRole("button", { name: "Cerrar formulario" });
  expect(document.activeElement).toBe(name);
  lastControl.focus();
  fireEvent.keyDown(lastControl, { key: "Tab" });
  expect(document.activeElement).toBe(close);
  close.focus();
  fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(lastControl);
  fireEvent.keyDown(lastControl, { key: "Escape" });
  expect(screen.getByRole("dialog", { name: "Crear cliente" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Cerrar formulario" }));
  expect(document.activeElement).toBe(trigger);
});

test("lleva el foco a los popups, conserva Tab inverso y lo devuelve al disparador", () => {
  function PopupFlow() {
    const [open, setOpen] = useState(false);
    return <><button type="button" onClick={() => setOpen(true)}>Mostrar error</button>{open && <ClientFormDialog client={null} territories={[]} loading={false} busy={false} error="La solicitud no pudo completarse." duplicates={null} {...requiredCallbacks} onDismissError={() => setOpen(false)} />}</>;
  }
  render(<PopupFlow />);
  const trigger = screen.getByRole("button", { name: "Mostrar error" });
  trigger.focus();
  fireEvent.click(trigger);

  const primary = screen.getByRole("button", { name: "Volver al formulario" });
  const close = screen.getByRole("button", { name: "Cerrar mensaje" });
  expect(document.activeElement).toBe(primary);
  fireEvent.keyDown(primary, { key: "Tab" });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(primary);
  fireEvent.keyDown(primary, { key: "Escape" });
  expect(document.activeElement).toBe(trigger);
});
