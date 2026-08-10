import { ShieldCheck } from "lucide-react";
import "../styles/auth-secure-footer.css";

/** Pie de seguridad común para las pantallas públicas de autenticación. */
export function AuthSecureFooter() {
  return (
    <footer className="auth-secure-footer">
      <p className="auth-secure-line">
        <ShieldCheck aria-hidden="true" />
        Procesamos tu solicitud de forma segura.
      </p>
      <div className="auth-footer-divider" />
      <p className="auth-copyright">© 2026 FollowUpBusiness</p>
    </footer>
  );
}
