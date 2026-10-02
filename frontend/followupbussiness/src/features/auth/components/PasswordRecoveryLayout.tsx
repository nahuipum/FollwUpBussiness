import { type ReactNode } from "react";
import { BrandPanel } from "./BrandPanel";
import { AuthSecureFooter } from "./AuthSecureFooter";
import { ThemeToggle } from "../../../shared/theme/ThemeToggle";
import { AuthLogo } from "./AuthLogo";

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
          <AuthLogo
            className="login-golden__mobile-logo"
          />
          {children}
          <AuthSecureFooter />
        </div>
        {overlay}
      </section>
      <ThemeToggle className="login-golden__theme-toggle" />
    </main>
  );
}
