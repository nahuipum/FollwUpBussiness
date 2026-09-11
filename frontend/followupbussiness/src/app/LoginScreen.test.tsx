import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("../features/auth/auth", () => ({
  login: loginMock,
  canAccessPath: vi.fn(),
  hasSession: vi.fn(),
  logout: vi.fn(),
  retryPendingLogout: vi.fn(),
}));

import { LoginScreen } from "../features/auth/components/LoginScreen";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/");
});

test("submits valid credentials through the login client and processes its redirect", async () => {
  loginMock.mockResolvedValue({ ok: true, redirectTo: "/seller/dashboard" });
  render(<LoginScreen />);

  fireEvent.change(screen.getByLabelText("Correo o nombre de usuario"), {
    target: { value: " seller@example.com " },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "correct-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

  await waitFor(() =>
    expect(loginMock).toHaveBeenCalledWith({
      identifier: "seller@example.com",
      password: "correct-password",
    }),
  );
  await waitFor(() =>
    expect(window.location.pathname).toBe("/seller/dashboard"),
  );
  expect(screen.getByLabelText("Contraseña")).toHaveProperty("value", "");
});

test("keeps validation errors associated with their fields", () => {
  render(<LoginScreen />);

  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

  const identifier = screen.getByLabelText("Correo o nombre de usuario");
  const password = screen.getByLabelText("Contraseña");
  expect(identifier.getAttribute("aria-invalid")).toBe("true");
  expect(identifier.getAttribute("aria-describedby")).toBe("identifier-error");
  expect(password.getAttribute("aria-invalid")).toBe("true");
  expect(password.getAttribute("aria-describedby")).toBe("password-error");
  expect(loginMock).not.toHaveBeenCalled();
});

test("toggles password visibility without changing its value", () => {
  render(<LoginScreen />);
  const password = screen.getByLabelText("Contraseña");
  fireEvent.change(password, { target: { value: "correct-password" } });

  fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
  expect(password.getAttribute("type")).toBe("text");
  expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toBeTruthy();
  expect(password).toHaveProperty("value", "correct-password");
});

test("navigates to password recovery through the existing client route", () => {
  render(<LoginScreen />);

  fireEvent.click(screen.getByRole("link", { name: "¿Necesitas ayuda?" }));

  expect(window.location.pathname).toBe("/password-recovery");
});

test("blocks duplicate submissions, exposes busy state and clears the password", async () => {
  let resolveLogin: ((value: { ok: false; message: string; retryAfterSeconds: null }) => void) | undefined;
  loginMock.mockImplementation(() => new Promise((resolve) => { resolveLogin = resolve; }));
  render(<LoginScreen />);
  fireEvent.change(screen.getByLabelText("Correo o nombre de usuario"), {
    target: { value: " seller@example.com " },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "correct-password" },
  });
  const form = screen.getByRole("button", { name: "Iniciar sesión" }).closest("form")!;

  fireEvent.submit(form);
  fireEvent.submit(form);

  expect(loginMock).toHaveBeenCalledTimes(1);
  expect(form.getAttribute("aria-busy")).toBe("true");
  expect(screen.getByRole("button", { name: "Iniciando sesión…" })).toHaveProperty("disabled", true);
  await act(async () => resolveLogin?.({ ok: false, message: "No fue posible iniciar sesión.", retryAfterSeconds: null }));
  await waitFor(() => expect(screen.getByLabelText("Contraseña")).toHaveProperty("value", ""));
});

test("keeps retry countdown after closing the error dialog", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  loginMock.mockResolvedValue({
    ok: false,
    message: "No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.",
    retryAfterSeconds: 2,
  });
  render(<LoginScreen />);
  fireEvent.change(screen.getByLabelText("Correo o nombre de usuario"), {
    target: { value: "seller@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "correct-password" },
  });
  const submit = screen.getByRole("button", { name: "Iniciar sesión" });
  submit.focus();
  fireEvent.click(submit);

  const close = await screen.findByRole("button", { name: "Cerrar" });
  await waitFor(() => expect(document.activeElement).toBe(close));
  fireEvent.click(close);
  expect(screen.getByRole("status").textContent).toContain("2 segundos");
  expect(submit).toHaveProperty("disabled", true);

  await act(async () => vi.advanceTimersByTime(1_000));
  await act(async () => vi.advanceTimersByTime(1_000));
  expect(screen.queryByRole("status")).toBeNull();
  expect(submit).toHaveProperty("disabled", false);
});

test("restores focus after closing an authentication error without retry", async () => {
  loginMock.mockResolvedValue({
    ok: false,
    message: "No fue posible iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.",
    retryAfterSeconds: null,
  });
  render(<LoginScreen />);
  fireEvent.change(screen.getByLabelText("Correo o nombre de usuario"), {
    target: { value: "seller@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "correct-password" },
  });
  const submit = screen.getByRole("button", { name: "Iniciar sesión" });
  submit.focus();
  fireEvent.click(submit);

  const close = await screen.findByRole("button", { name: "Cerrar" });
  await waitFor(() => expect(document.activeElement).toBe(close));
  fireEvent.click(close);

  await waitFor(() => expect(document.activeElement).toBe(submit));
});
