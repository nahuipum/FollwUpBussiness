export type AppTheme = "light" | "dark";

export const themeStorageKey = "followupbusiness.theme";

function isAppTheme(value: string | null): value is AppTheme {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";

  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return isAppTheme(storedTheme) ? storedTheme : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function persistTheme(theme: AppTheme): void {
  applyTheme(theme);

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The visual preference still applies for this page when storage is unavailable.
  }
}

export function initializeTheme(): AppTheme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
