import { useLayoutEffect, useState } from "react";
import { LoginScreen } from "../features/auth/components/LoginScreen";
import { InvalidSessionDialog } from "../features/auth/components/InvalidSessionDialog";
import { PasswordRecoveryScreen } from "../features/auth/components/PasswordRecoveryScreen";
import { SessionStatusPage } from "./components/SessionStatusPage";
import { navigate } from "./navigation";
import { useSessionRoute } from "./hooks/useSessionRoute";
import { canAccessPath, hasSession, logout } from "../features/auth/auth";

export function App() {
  const { path, showInvalidSession, closeInvalidSession } = useSessionRoute();

  if (path === "/") return <LoginScreen />;
  if (path === "/password-recovery")
    return <PasswordRecoveryScreen route="request" token={null} />;
  if (path === "/password-recovery/confirmation")
    return <PasswordRecoveryScreen route="confirmation" token={null} />;
  if (path === "/password-reset") return <PasswordResetRoute />;
  if (path === "/password-reset/success")
    return <PasswordRecoveryScreen route="success" token={null} />;

  if (hasSession() && canAccessPath(path)) {
    return (
      <SessionStatusPage
        eyebrow="Sesión iniciada"
        title="Redirigiendo a tu panel"
        description="La autorización para acceder a los recursos se comprobará en el servidor."
        actionLabel="Cerrar sesión"
        onAction={() => {
          void logout();
          navigate("/");
        }}
      />
    );
  }

  return (
    <>
      {showInvalidSession && (
        <InvalidSessionDialog onClose={closeInvalidSession} />
      )}
      <SessionStatusPage
        eyebrow="Acceso no disponible"
        title="Inicia sesión para continuar"
        description="Tu sesión no está disponible o no tienes permiso para acceder a esta ruta."
        actionLabel="Ir al inicio de sesión"
        onAction={() => navigate("/")}
      />
    </>
  );
}

/** Captures the one-time token only for this render tree, then removes it from history. */
function PasswordResetRoute() {
  const [token] = useState(() =>
    new URLSearchParams(window.location.search).get("token"),
  );

  useLayoutEffect(() => {
    if (window.location.search)
      window.history.replaceState({}, "", "/password-reset");
  }, []);

  return <PasswordRecoveryScreen route="reset" token={token} />;
}
