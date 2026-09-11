(function () {
  const body = document.body;
  const allowed = (body.dataset.states || "ready").split(/\s+/).filter(Boolean);
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("state") || "ready";
  const state = allowed.includes(requested) ? requested : allowed[0];

  body.dataset.state = state;
  body.dataset.guide = String(params.get("guide") === "1");
  body.dataset.theme = params.get("theme") === "dark" ? "dark" : "light";

  document.querySelectorAll("[data-show]").forEach((element) => {
    const visible = (element.getAttribute("data-show") || "").split(/\s+/).includes(state);
    element.hidden = !visible;
  });

  document.querySelectorAll("[data-state-value]").forEach((element) => {
    if (!(element instanceof HTMLInputElement)) return;
    element.value = element.getAttribute(`data-value-${state}`) || "";
  });

  document.querySelectorAll("[data-disable-in]").forEach((element) => {
    const disabled = (element.getAttribute("data-disable-in") || "").split(/\s+/).includes(state);
    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
      element.disabled = disabled;
    }
  });

  document.querySelectorAll("[data-busy-in]").forEach((element) => {
    const busy = (element.getAttribute("data-busy-in") || "").split(/\s+/).includes(state);
    element.setAttribute("aria-busy", String(busy));
  });

  document.querySelectorAll("[data-stale-in]").forEach((element) => {
    const stale = (element.getAttribute("data-stale-in") || "").split(/\s+/).includes(state);
    element.classList.toggle("stale-region", stale);
  });

  const selector = document.querySelector("[data-state-selector]");
  if (selector instanceof HTMLSelectElement) {
    allowed.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      option.selected = name === state;
      selector.append(option);
    });
    selector.addEventListener("change", () => {
      const next = new URL(window.location.href);
      next.searchParams.set("state", selector.value);
      window.location.href = next.toString();
    });
  }

  document.querySelectorAll("[data-theme-toggle]").forEach((control) => {
    control.addEventListener("click", () => {
      body.dataset.theme = body.dataset.theme === "dark" ? "light" : "dark";
    });
  });

  document.querySelectorAll("[data-nav-toggle]").forEach((control) => {
    control.addEventListener("click", () => {
      body.dataset.nav = body.dataset.nav === "open" ? "closed" : "open";
    });
  });

  document.querySelectorAll("[data-password-toggle]").forEach((control) => {
    control.addEventListener("click", () => {
      const input = document.querySelector("#password");
      if (!(input instanceof HTMLInputElement)) return;
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      control.setAttribute("aria-label", showing ? "Mostrar contraseña" : "Ocultar contraseña");
    });
  });
})();
