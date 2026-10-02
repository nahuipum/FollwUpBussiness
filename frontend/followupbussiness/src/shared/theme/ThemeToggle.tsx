import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, persistTheme, type AppTheme } from "./theme";
import "./theme-toggle.css";

type ThemeToggleProps = {
  className?: string;
};

/** Control global de tema disponible dentro y fuera de una sesión. */
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    persistTheme(nextTheme);
  };

  return (
    <button
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Modo oscuro"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={toggleTheme}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}
