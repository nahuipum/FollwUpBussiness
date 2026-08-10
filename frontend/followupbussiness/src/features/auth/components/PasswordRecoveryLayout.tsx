import { type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { BrandPanel, PasswordRecoveryBrandMark } from "./BrandPanel";
import { AuthSecureFooter } from "./AuthSecureFooter";

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
    <main className="login-panel password-recovery-panel">
      <BrandPanel
        eyebrow="Acceso seguro"
        title="Recupera tu acceso de forma segura."
        description="Solicita un enlace para restablecer tu contraseña y volver a tu panel sin perder continuidad."
        footer="Plataforma de uso interno · Flujo protegido"
        mark={<PasswordRecoveryBrandMark />}
      />
      <section
        className="form-panel recovery-form-panel"
        aria-labelledby={labelledBy}
      >
        <div
          className={`form-wrap recovery-content-shell${status ? " recovery-status status-view" : ""}`}
          aria-hidden={hiddenFromAssistiveTechnology || undefined}
        >
          <p className="mobile-brand">
            <PasswordRecoveryBrandMark />
            FollowUpBusiness
          </p>
          <p className="mobile-eyebrow">
            <ShieldCheck aria-hidden="true" />
            Acceso seguro
          </p>
          {children}
          <AuthSecureFooter />
        </div>
        {overlay}
      </section>
    </main>
  );
}
