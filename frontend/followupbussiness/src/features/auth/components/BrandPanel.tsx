import { useEffect, useState, type ReactNode } from "react";
import { ChartNoAxesCombined, LockKeyhole, ShieldCheck } from "lucide-react";
import streetMapArtwork from "../assets/street-map-v3.svg";

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <ChartNoAxesCombined />
    </span>
  );
}

/** Marca específica del flujo seguro de recuperación, definida por FE-002. */
export function PasswordRecoveryBrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="recovery-logo-teal" x1="5" y1="5" x2="42" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38B2AC" />
            <stop offset="1" stopColor="#087A86" />
          </linearGradient>
        </defs>
        <path d="M10 11.5c0-2.5 2-4.5 4.5-4.5H39c1.8 0 2.9 2 1.9 3.5l-4.7 6.8c-.9 1.3-2.4 2.1-4 2.1H10v-7.9Z" fill="url(#recovery-logo-teal)" />
        <path d="M10 20h19.9c1.8 0 2.9 2 1.9 3.5l-4.4 6.3c-.9 1.3-2.4 2.1-4 2.1H17.8L14.9 40H7.7L10 20Z" fill="#102A60" />
      </svg>
    </span>
  );
}

type BrandPanelProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  footer?: string;
  mark?: ReactNode;
};

/** Presentational visual shell shared by every authentication route. */
export function BrandPanel({
  eyebrow = "Acceso seguro",
  title = "Recupera tu acceso de forma segura.",
  description = "Solicita un enlace para restablecer tu contraseña y volver a tu panel sin perder continuidad.",
  footer = "Plataforma de uso interno · Flujo protegido",
  mark = <PasswordRecoveryBrandMark />,
}: BrandPanelProps) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window === "undefined" || window.innerWidth > 900,
  );

  useEffect(() => {
    const updateVisibility = () => setIsDesktop(window.innerWidth > 900);

    window.addEventListener("resize", updateVisibility);
    return () => window.removeEventListener("resize", updateVisibility);
  }, []);

  if (!isDesktop) {
    return null;
  }

  return (
    <section className="brand-panel" aria-label="FollowUpBusiness">
      <span className="brand-orb top" aria-hidden="true" />
      <span className="brand-orb bottom" aria-hidden="true" />
      <span className="brand-orb glow" aria-hidden="true" />
      <div className="brand-header">
        {mark}
        FollowUpBusiness
      </div>
      <div className="brand-content">
        <p className="brand-eyebrow">
          <ShieldCheck aria-hidden="true" />
          {eyebrow}
        </p>
        <h1 className="brand-title">{title}</h1>
        <p className="brand-description">{description}</p>
        <div className="map-wrap" aria-hidden="true">
          <div className="map-dots" />
          <div className="map-card">
            <img
              className="street-map-art"
              src={streetMapArtwork}
              alt=""
              draggable={false}
            />
            <span className="map-ripple origin" />
            <span className="map-ripple destination" />
            <span className="map-pin origin">
              <svg viewBox="0 0 64 82" fill="none">
                <defs>
                  <linearGradient
                    id="pinFillOrigin"
                    x1="32"
                    y1="5"
                    x2="32"
                    y2="77"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#F8FFFF" />
                    <stop offset="1" stopColor="#76E0DE" />
                  </linearGradient>
                </defs>
                <path
                  d="M32 3C14.9 3 4 15.9 4 32c0 20.7 28 47 28 47s28-26.3 28-47C60 15.9 49.1 3 32 3Z"
                  fill="url(#pinFillOrigin)"
                  stroke="#69DDD9"
                  strokeWidth="3.5"
                />
                <circle
                  cx="32"
                  cy="31"
                  r="12"
                  fill="#10335F"
                  stroke="#fff"
                  strokeWidth="3"
                />
              </svg>
            </span>
            <span className="map-waypoint" />
            <span className="map-pin destination">
              <svg viewBox="0 0 64 82" fill="none">
                <defs>
                  <linearGradient
                    id="pinFillDestination"
                    x1="32"
                    y1="5"
                    x2="32"
                    y2="77"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#F8FFFF" />
                    <stop offset="1" stopColor="#76E0DE" />
                  </linearGradient>
                </defs>
                <path
                  d="M32 3C14.9 3 4 15.9 4 32c0 20.7 28 47 28 47s28-26.3 28-47C60 15.9 49.1 3 32 3Z"
                  fill="url(#pinFillDestination)"
                  stroke="#69DDD9"
                  strokeWidth="3.5"
                />
                <circle
                  cx="32"
                  cy="31"
                  r="12"
                  fill="#10335F"
                  stroke="#fff"
                  strokeWidth="3"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
      <p className="brand-footer brand-foot">
        <span className="brand-footer-icon brand-foot-icon" aria-hidden="true">
          <LockKeyhole />
        </span>
        {footer}
      </p>
    </section>
  );
}
