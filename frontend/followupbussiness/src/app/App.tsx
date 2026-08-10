import { useEffect, useLayoutEffect, useState } from "react";
import { LoginScreen } from "../features/auth/components/LoginScreen";
import { InvalidSessionDialog } from "../features/auth/components/InvalidSessionDialog";
import { PasswordRecoveryScreen } from "../features/auth/components/PasswordRecoveryScreen";
import { SessionStatusPage } from "./components/SessionStatusPage";
import { navigate } from "./navigation";
import { useSessionRoute } from "./hooks/useSessionRoute";
import { canAccessPath, hasSession, logout } from "../features/auth/auth";
import { ErrorState, InlineAlert, SessionExpiredDialog } from "../shared/ui/error-ui/components";
import { useGlobalApiError } from "../shared/ui/error-ui/useGlobalApiError";

export function App() {
  const { path, showInvalidSession, closeInvalidSession, refreshUnavailable } =
    useSessionRoute();
  const { error, clearError } = useGlobalApiError();

  useEffect(() => {
    if (error?.status === 401 && window.location.pathname !== "/")
      navigate("/", { replace: true });
  }, [error?.status]);

  if (error?.status === 401) {
    return (
      <>
        <LoginScreen />
        <SessionExpiredDialog
          title="Tu sesión terminó"
          message="Por seguridad, inicia sesión nuevamente para continuar."
          primaryAction={{ label: "Ir al inicio de sesión", onClick: clearError }}
          dismissAction={{ label: "Cerrar diálogo", onClick: clearError }}
          {...(error.correlationId === null ? {} : { correlationId: error.correlationId })}
        />
      </>
    );
  }

  if (error?.status === 403 || error?.status === 404 || error?.status === 500) {
    const configuration = {
      403: { variant: "forbidden" as const, title: "No tienes acceso a esta sección", message: "No tienes permiso para realizar esta acción.", action: "Volver al inicio" },
      404: { variant: "not-found" as const, title: "No encontramos lo que buscas", message: "El recurso ya no está disponible o no existe.", action: "Volver" },
      500: { variant: "temporary" as const, title: "Ocurrió un problema temporal", message: "No pudimos completar la operación. Inténtalo más tarde.", action: "Volver al inicio" },
    }[error.status];
    return <ErrorState variant={configuration.variant} title={configuration.title} message={configuration.message} {...(error.correlationId === null ? {} : { correlationId: error.correlationId })} primaryAction={{ label: configuration.action, onClick: () => { clearError(); navigate("/", { replace: true }); } }} />;
  }

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
      <>
        {error && <InlineAlert variant={error.status === 409 ? "warning" : "error"} title={error.status === 409 ? "La información cambió" : "Revisa la información ingresada"} message={error.status === 409 ? "Actualiza la información y revisa los cambios antes de continuar." : error.fieldErrors.length > 0 ? "Revisa los campos señalados e inténtalo nuevamente." : "No pudimos validar la información. Revísala e inténtalo nuevamente."} {...(error.correlationId === null ? {} : { correlationId: error.correlationId })} action={error.status === 409 ? { label: "Recargar y revisar", onClick: () => { clearError(); navigate(path, { replace: true }); } } : { label: "Cerrar aviso", onClick: clearError }} />}
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
      </>
    );
  }

  if (refreshUnavailable) {
    return (
      <SessionStatusPage
        eyebrow="Sesión no verificada"
        title="No pudimos renovar tu sesión"
        description="Por seguridad se cerró la sesión local. Verifica tu conexión e inicia sesión nuevamente."
        actionLabel="Ir al inicio de sesión"
        onAction={() => navigate("/", { replace: true })}
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
