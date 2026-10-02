import { useEffect, useState } from "react";
import followUpLogo from "../assets/followup-logo.png";
import followUpLogoObscure from "../assets/followup-logo-obscure-v2.png";

type AuthLogoProps = {
  className: string;
};

function isDarkTheme() {
  return typeof document !== "undefined"
    && document.documentElement.dataset.theme === "dark";
}

/** Selecciona la variante de marca correcta y acompaña cambios de tema en vivo. */
export function AuthLogo({ className }: AuthLogoProps) {
  const [darkTheme, setDarkTheme] = useState(isDarkTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setDarkTheme(isDarkTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <img
      className={className}
      src={darkTheme ? followUpLogoObscure : followUpLogo}
      alt="followUp Business"
    />
  );
}
