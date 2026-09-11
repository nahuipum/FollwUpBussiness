import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import followUpLogo from "../assets/followup-logo.png";

type BrandPanelProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  footer?: string;
  mapBadge?: string;
  mapDetail?: string;
};

/** Presentational visual shell shared by every authentication route. */
export function BrandPanel({
  eyebrow = "Acceso seguro",
  title = "Cada seguimiento, en el momento justo.",
  description = "Conecta a tu equipo con las oportunidades que mueven tu negocio.",
  footer = "Plataforma de uso interno · Flujo protegido",
  mapBadge = "Ruta preparada",
  mapDetail = "3 visitas",
}: BrandPanelProps) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window === "undefined" || window.innerWidth > 620,
  );

  useEffect(() => {
    const updateVisibility = () => setIsDesktop(window.innerWidth > 620);

    window.addEventListener("resize", updateVisibility);
    return () => window.removeEventListener("resize", updateVisibility);
  }, []);

  if (!isDesktop) {
    return null;
  }

  return (
    <section
      className="login-golden__brand"
      aria-label="Presentación de followUp Business"
    >
      <div className="login-golden__brand-plate">
        <img
          className="login-golden__brand-logo"
          src={followUpLogo}
          alt="followUp Business"
        />
      </div>
      <div className="login-golden__brand-copy">
        <span className="login-golden__eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="login-golden__map-card" aria-hidden="true">
          <div className="login-golden__map-stage">
            <svg
              className="login-golden__route"
              viewBox="0 0 600 320"
              preserveAspectRatio="none"
            >
              <path
                className="login-golden__route-line login-golden__route-line--alternate"
                d="M20 255 C130 275 150 90 270 128 S420 278 575 55"
              />
              <path
                className="login-golden__route-line"
                d="M20 255 C130 245 150 98 270 128 S420 250 575 55"
              />
            </svg>
            <span className="login-golden__pin login-golden__pin--one"><span>1</span></span>
            <span className="login-golden__pin login-golden__pin--two"><span>2</span></span>
            <span className="login-golden__pin login-golden__pin--three"><span>3</span></span>
            <div className="login-golden__map-legend">
              <span className="login-golden__badge">{mapBadge}</span>
              <span>{mapDetail}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="login-golden__brand-footer">
        <LockKeyhole aria-hidden="true" />
        {footer}
      </p>
    </section>
  );
}
