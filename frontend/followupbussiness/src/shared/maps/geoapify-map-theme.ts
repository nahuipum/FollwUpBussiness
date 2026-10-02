import { useEffect, useState } from "react";

type GeoapifyMapStyle = "dark-matter" | "osm-bright";

function isDarkTheme() {
  return document.documentElement.dataset.theme === "dark";
}

export function geoapifyMapStyleUrl(key: string, darkTheme: boolean) {
  const style: GeoapifyMapStyle = darkTheme ? "dark-matter" : "osm-bright";
  return `https://maps.geoapify.com/v1/styles/${style}/style.json?apiKey=${encodeURIComponent(key)}`;
}

export function currentGeoapifyMapStyleUrl(key: string | undefined) {
  return key ? geoapifyMapStyleUrl(key, isDarkTheme()) : null;
}

/** Keeps every MapLibre surface aligned with the application's selected color theme. */
export function useGeoapifyMapStyleUrl(key: string | undefined) {
  const [darkTheme, setDarkTheme] = useState(isDarkTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setDarkTheme(isDarkTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return key ? geoapifyMapStyleUrl(key, darkTheme) : null;
}
