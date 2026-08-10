export function navigate(
  path: string,
  { replace = false }: { replace?: boolean } = {},
) {
  window.history[replace ? "replaceState" : "pushState"]({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
