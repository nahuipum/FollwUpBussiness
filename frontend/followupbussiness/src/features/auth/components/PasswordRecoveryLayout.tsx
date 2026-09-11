import { type ReactNode } from "react";
import { BrandPanel } from "./BrandPanel";
import { AuthSecureFooter } from "./AuthSecureFooter";
import followUpLogo from "../assets/followup-logo.png";

type PasswordRecoveryLayoutProps = {
  children: ReactNode;
  overlay?: ReactNode;
  labelledBy?: string;
  status?: boolean;
  hiddenFromAssistiveTechnology?: boolean;
};

export function PasswordRecoveryLayout({
  children,
  overlay,
  labelledBy,
  status = false,
  hiddenFromAssistiveTechnology = false,
}: PasswordRecoveryLayoutProps) {
  return (
    <main className="login-golden password-recovery-golden">
      <BrandPanel
        eyebrow="Acceso seguro"
        title="Recupera tu acceso de forma segura."
        description="Solicita un enlace para restablecer tu contraseña y volver a tu panel sin perder continuidad."
        footer="Plataforma de uso interno · Flujo protegido"
        mapBadge="Acceso protegido"
        mapDetail="Continuidad segura"
      />
      <section
        className="login-golden__main recovery-golden__main"
        aria-labelledby={labelledBy}
      >
        <div
          className={`login-golden__form recovery-golden__view${status ? " recovery-golden__status" : ""}`}
          aria-hidden={hiddenFromAssistiveTechnology || undefined}
        >
          <img
            className="login-golden__mobile-logo"
            src={followUpLogo}
            alt="followUp Business"
          />
          {children}
          <AuthSecureFooter />
        </div>
        {overlay}
      </section>
    </main>
  );
}
