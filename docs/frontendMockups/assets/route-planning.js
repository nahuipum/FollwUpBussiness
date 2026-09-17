(function () {
  "use strict";
  const body = document.body;
  const state = body.dataset.state || (body.dataset.states || "ready").split(/\s+/)[0];
  if (state.startsWith("dark-")) body.dataset.theme = "dark";

  function stateUrl(nextState) {
    const next = new URL(window.location.href);
    next.searchParams.set("state", nextState);
    return next.toString();
  }
  document.querySelectorAll("[data-go-state]").forEach(function (control) {
    control.addEventListener("click", function () {
      window.location.href = stateUrl(control.getAttribute("data-go-state") || "ready");
    });
  });
  document.querySelectorAll("[data-go-href]").forEach(function (control) {
    control.addEventListener("click", function () {
      const target = control.getAttribute("data-go-href");
      if (target) window.location.href = target;
    });
  });

  document.querySelectorAll("details.routes-select").forEach(function (select) {
    const trigger = select.querySelector("summary");
    const sync = function () { trigger?.setAttribute("aria-expanded", String(select.open)); };
    sync();
    select.addEventListener("toggle", sync);
  });

  const liveRegion = document.querySelector("[data-order-live]");
  function refreshSequence(list) {
    const cards = Array.from(list.querySelectorAll(".visit-card"));
    const workflow = list.closest(".workflow-card") || document;
    cards.forEach(function (card, index) {
      const position = card.querySelector(".visit-position");
      if (position) position.textContent = String(index + 1);
      card.querySelectorAll("[data-move]").forEach(function (button) {
        const direction = button.getAttribute("data-move");
        button.disabled = direction === "up" ? index === 0 : index === cards.length - 1;
      });
      const role = card.querySelector("[data-sequence-role]");
      if (role) role.textContent = cards.length === 1 ? "Inicio y final" : index === 0 ? "Inicio" : index === cards.length - 1 ? "Final" : "";
      const visitId = card.getAttribute("data-visit-id");
      const marker = visitId ? workflow.querySelector(`[data-map-marker="${visitId}"]`) : null;
      if (marker) marker.textContent = String(index + 1);
    });
  }
  document.querySelectorAll("[data-move]").forEach(function (button) {
    button.addEventListener("click", function () {
      const card = button.closest(".visit-card");
      const list = card?.parentElement;
      if (!card || !list) return;
      const direction = button.getAttribute("data-move");
      if (direction === "up" && card.previousElementSibling) list.insertBefore(card, card.previousElementSibling);
      if (direction === "down" && card.nextElementSibling) list.insertBefore(card.nextElementSibling, card);
      refreshSequence(list);
      card.classList.add("is-dirty");
      const name = card.querySelector(".visit-main strong")?.textContent || "Visita";
      const position = card.querySelector(".visit-position")?.textContent || "";
      if (liveRegion) liveRegion.textContent = `${name} se movió a la posición ${position}. El orden todavía no se guardó.`;
      document.querySelectorAll("[data-preview-status]").forEach(function (node) { node.textContent = "Vista previa obsoleta"; node.classList.add("warning"); });
      document.querySelectorAll("[data-adjusted-status]").forEach(function (node) { node.textContent = "Propuesta ajustada manualmente"; node.classList.add("warning"); });
    });
  });
  document.querySelectorAll(".ordered-visits").forEach(refreshSequence);

  document.querySelectorAll("[data-view-toggle]").forEach(function (control) {
    control.addEventListener("click", function () {
      const scope = control.closest(".workflow-body, .routes-panel");
      const root = control.closest("[data-mobile-workspace]") || (scope && scope.querySelector("[data-mobile-workspace]"));
      if (!root) return;
      const target = control.getAttribute("data-view-toggle");
      root.classList.toggle("mobile-map-hidden", target === "list");
      root.classList.toggle("mobile-list-hidden", target === "map");
      (scope || root).querySelectorAll("[data-view-toggle]").forEach(function (button) { button.setAttribute("aria-pressed", String(button === control)); });
    });
  });

  const busyStates = new Set((body.dataset.busyStates || "").split(/\s+/).filter(Boolean));
  const overlay = Array.from(document.querySelectorAll("[data-overlay]")).find(function (node) {
    return node instanceof HTMLElement && node.getClientRects().length > 0;
  });
  if (overlay instanceof HTMLElement) {
    const focusable = Array.from(overlay.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,[href],[tabindex]:not([tabindex='-1'])")).filter(function (node) {
      return node instanceof HTMLElement && node.getClientRects().length > 0;
    });
    const initial = overlay.querySelector("[data-initial-focus]") || focusable[0];
    if (initial instanceof HTMLElement) window.setTimeout(function () { initial.focus(); }, 0);
    overlay.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !busyStates.has(state)) {
        const fallback = body.dataset.overlayReturn || "ready";
        window.location.href = stateUrl(fallback);
      }
      if (event.key === "Tab" && focusable.length) {
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }
})();
