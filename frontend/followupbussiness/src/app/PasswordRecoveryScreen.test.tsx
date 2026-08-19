import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { App } from "./App";
import { BrandPanel } from "../features/auth/components/BrandPanel";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

beforeEach(() => vi.stubEnv("VITE_API_BASE_URL", "https://backend.test"));

test("actualiza cada regla de contraseña mientras se escribe", () => {
  window.history.replaceState({}, "", `/password-reset?token=${"r".repeat(43)}`);
  render(<App />);

  fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
    target: { value: "Abcdef1!" },
  });

  for (const rule of ["Mínimo 8 caracteres", "Una letra mayúscula", "Una letra minúscula", "Un número", "Un carácter especial"]) {
    expect(screen.getByText(rule).closest("li")?.classList.contains("is-valid")).toBe(true);
  }
});

test("validates recovery email locally and confirms accepted requests neutrally", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), { status: 202 }),
    );
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState({}, "", "/password-recovery");
  render(<App />);

  fireEvent.click(
    screen.getByRole("button", { name: "Enviar enlace de recuperación" }),
  );
  expect(
    screen.getByText("Ingresa un correo electrónico válido."),
  ).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toContain(
    "Ingresa un correo electrónico válido.",
  );
  expect(document.activeElement).toBe(
    screen.getByLabelText("Correo electrónico"),
  );
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "person@example.com" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar enlace de recuperación" }),
  );
  await screen.findByRole("heading", { name: "Revisa tu correo" });
  expect(document.activeElement).toBe(
    screen.getByRole("heading", { name: "Revisa tu correo" }),
  );
  expect(screen.getByText(/Si existe una cuenta asociada/)).toBeTruthy();
  expect(screen.queryByText("person@example.com")).toBeNull();
});

test("shows an invalid-link state before the reset form when the token is absent or malformed", async () => {
  window.history.replaceState({}, "", "/password-reset?token=abc");
  render(<App />);

  await screen.findByRole("heading", { name: "Enlace vencido o no disponible" });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Volver al inicio de sesión" }),
  );
  expect(
    screen.queryByRole("heading", { name: "Crea una nueva contraseña" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Restablecer contraseña" }),
  ).toBeNull();
});

test("captures a valid reset token only in memory and immediately removes it from the current history entry", async () => {
  const token = "s".repeat(43);
  window.history.replaceState({}, "", `/password-reset?token=${token}`);
  render(<App />);

  await screen.findByRole("heading", { name: "Crea una nueva contraseña" });
  expect(window.location.pathname).toBe("/password-reset");
  expect(window.location.search).toBe("");
  expect(window.location.href).not.toContain(token);
});

test("replaces reset exits so neither cancellation nor invalid links retain a token URL", async () => {
  const token = "t".repeat(43);
  window.history.replaceState({}, "", `/password-reset?token=${token}`);
  render(<App />);
  await screen.findByRole("heading", { name: "Crea una nueva contraseña" });
  fireEvent.click(
    screen.getByRole("button", {
      name: "Cancelar y volver al inicio de sesión",
    }),
  );
  await screen.findByRole("heading", { name: "Inicia sesión" });
  expect(window.location.href).not.toContain(token);

  window.history.replaceState({}, "", `/password-reset?token=${"bad"}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
  await screen.findByRole("heading", { name: "Enlace vencido o no disponible" });
  fireEvent.click(
    screen.getByRole("button", { name: "Volver al inicio de sesión" }),
  );
  expect(window.location.pathname).toBe("/");
  expect(window.location.search).toBe("");
});

test("routes login help through the SPA without a page reload", async () => {
  window.history.replaceState({}, "", "/");
  render(<App />);
  fireEvent.click(screen.getByRole("link", { name: "¿Necesitas ayuda?" }));
  await screen.findByRole("heading", { name: "¿Olvidaste tu contraseña?" });
  expect(window.location.pathname).toBe("/password-recovery");
});

test("moves keyboard focus to the first reset validation error and announces it", () => {
  window.history.replaceState(
    {},
    "",
    `/password-reset?token=${"a".repeat(43)}`,
  );
  render(<App />);

  fireEvent.click(
    screen.getByRole("button", { name: "Restablecer contraseña" }),
  );

  expect(screen.getByRole("alert").textContent).toContain(
    "La contraseña debe tener entre 8 y 72 bytes.",
  );
  expect(document.activeElement).toBe(
    screen.getByLabelText("Nueva contraseña"),
  );
});

test("blocks recovery resubmission during a 429 cooldown and shows 503 as unavailable", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { "Retry-After": "30" } }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState({}, "", "/password-recovery");
  render(<App />);
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "person@example.com" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar enlace de recuperación" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Enviar enlace de recuperación" }),
    ).toHaveProperty("disabled", true),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "espera 30 segundos",
  );
});

test("clears an expired cooldown before a retry receives 503", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { "Retry-After": "2" } }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState({}, "", "/password-recovery");
  render(<App />);
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "person@example.com" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar enlace de recuperación" }),
  );
  expect((await screen.findByText(/espera 2 segundos/)).textContent).toContain(
    "espera 2 segundos",
  );
  await waitFor(
    () =>
      expect(
        screen
          .queryAllByRole("status")
          .some((status) => status.textContent?.includes("espera")),
      ).toBe(false),
    { timeout: 2500 },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar enlace de recuperación" }),
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "no está disponible temporalmente",
  );
  expect(screen.queryByRole("status")).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("renders request and reset API failures directly", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 500 }))
    .mockResolvedValueOnce(new Response(null, { status: 422 }));
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState({}, "", "/password-recovery");
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "person@example.com" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar enlace de recuperación" }),
  );
  expect(
    await screen.findByRole("heading", {
      name: "Ocurrió un problema temporal",
    }),
  ).toBeTruthy();
  view.unmount();

  window.history.replaceState(
    {},
    "",
    `/password-reset?token=${"p".repeat(43)}`,
  );
  render(<App />);
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Restablecer contraseña" }),
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "no cumple la política",
  );
});

test("renders token expiration and the shared invalid-or-used modal with keyboard behavior", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 410 }))
    .mockResolvedValueOnce(new Response(null, { status: 400 }));
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(
    {},
    "",
    `/password-reset?token=${"e".repeat(43)}`,
  );
  const view = render(<App />);
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Restablecer contraseña" }),
  );
  const expiredDialog = await screen.findByRole("dialog", {
    name: "Enlace vencido o no disponible",
  });
  expect(expiredDialog).toBeTruthy();
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Volver al inicio de sesión" }),
  );
  fireEvent.keyDown(document, { key: "Escape" });
  await screen.findByRole("heading", { name: "Inicia sesión" });
  view.unmount();

  window.history.replaceState(
    {},
    "",
    `/password-reset?token=${"i".repeat(43)}`,
  );
  render(<App />);
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Restablecer contraseña" }),
  );
  const invalidDialog = await screen.findByRole("dialog", {
    name: "Enlace vencido o no disponible",
  });
  expect(invalidDialog.textContent).toContain("Ponte en contacto con tu supervisor o administrador");
  screen.getByRole("button", { name: "Volver al inicio de sesión" }).focus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Cerrar diálogo" }),
  );
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Volver al inicio de sesión" }),
  );
});

test("keeps the token dialog open for interior clicks and dismisses only its overlay", async () => {
  window.history.replaceState({}, "", "/password-reset?token=malformed");
  render(<App />);

  const dialog = await screen.findByRole("dialog", {
    name: "Enlace vencido o no disponible",
  });
  fireEvent.click(dialog);
  expect(screen.getByRole("dialog", { name: "Enlace vencido o no disponible" })).toBeTruthy();
  fireEvent.click(document.querySelector(".recovery-modal-layer")!);
  await screen.findByRole("heading", { name: "Inicia sesión" });
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("uses a decorative Lucide lock icon in the shared brand footer", () => {
  render(<BrandPanel />);
  expect(
    screen.getByText("Plataforma de uso interno · Flujo protegido"),
  ).toBeTruthy();
  expect(document.querySelector(".brand-foot-icon svg")).toBeTruthy();
  expect(document.querySelector(".brand-foot")?.textContent).not.toContain("◌");
});

test("shows an expired token state and clears the URL token after reset success", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 410 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(
    {},
    "",
    `/password-reset?token=${"a".repeat(43)}`,
  );
  render(<App />);
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Restablecer contraseña" }),
  );
  await screen.findByRole("heading", { name: "Enlace vencido o no disponible" });
  fireEvent.click(
    screen.getByRole("button", { name: "Volver al inicio de sesión" }),
  );
  expect(window.location.pathname).toBe("/");
  window.history.replaceState(
    {},
    "",
    `/password-reset?token=${"b".repeat(43)}`,
  );
  window.dispatchEvent(new PopStateEvent("popstate"));
  await screen.findByRole("heading", { name: "Crea una nueva contraseña" });
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Restablecer contraseña" }),
  );
  await screen.findByRole("heading", { name: "Contraseña actualizada" });
  expect(
    screen.getByText(
      "Tu contraseña se restableció correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.",
    ),
  ).toBeTruthy();
  expect(
    screen.getByText(
      "Por seguridad, el enlace utilizado dejó de estar disponible.",
    ),
  ).toBeTruthy();
  expect(window.location.pathname).toBe("/password-reset/success");
  expect(window.location.search).toBe("");
});
