(function () {
  "use strict";

  const icons = {
    "i-menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "i-grid": '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    "i-home": '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    "i-users": '<path d="M16 20v-1.5A4.5 4.5 0 0 0 11.5 14h-4A4.5 4.5 0 0 0 3 18.5V20"/><circle cx="9.5" cy="7" r="4"/><path d="M17 10.5a3.5 3.5 0 0 0 0-7M20.5 20v-1.5a4.5 4.5 0 0 0-3.4-4.36"/>',
    "i-client": '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M6 16c.6-1.7 1.6-2.6 3-2.6s2.4.9 3 2.6M15 9h3M15 13h3"/>',
    "i-route": '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h4a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4H8M8 8 6 6l2-2"/>',
    "i-pin": '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    "i-map": '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
    "i-calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    "i-report": '<path d="M5 20V10M12 20V4M19 20v-7"/><path d="M3 20h18"/>',
    "i-activity": '<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
    "i-settings": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    "i-sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"/>',
    "i-moon": '<path d="M20.5 15.5A8 8 0 0 1 8.5 3.5a8.5 8.5 0 1 0 12 12Z"/>',
    "i-bell": '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    "i-plus": '<path d="M12 5v14M5 12h14"/>',
    "i-play": '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
    "i-search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    "i-filter": '<path d="M4 5h16M7 12h10M10 19h4"/>',
    "i-more": '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
    "i-x": '<path d="m6 6 12 12M18 6 6 18"/>',
    "i-info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    "i-alert": '<path d="M12 3 2.7 20h18.6L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
    "i-empty": '<path d="M4 7h16v13H4zM8 7V4h8v3M8 12h8"/>',
    "i-eye": '<path d="M2.8 12s3.4-5 9.2-5 9.2 5 9.2 5-3.4 5-9.2 5-9.2-5-9.2-5Z"/><circle cx="12" cy="12" r="2.2"/>',
    "i-lock": '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    "i-mail": '<path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6"/>',
    "i-shield": '<path d="M12 3 5.5 5.7v5.4c0 4.4 2.6 7.9 6.5 9.9 3.9-2 6.5-5.5 6.5-9.9V5.7L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    "i-chevron": '<path d="m7 9 5 5 5-5"/>',
    "i-locate": '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    "i-wifi": '<path d="M5 10a11 11 0 0 1 14 0M8 14a6 6 0 0 1 8 0M11 18a1.5 1.5 0 0 1 2 0"/>',
    "i-clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "i-sale": '<path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6M20 16V6"/>',
    "i-visit": '<path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h3"/><path d="m15 15 1.5 1.5L20 13"/>',
    "i-target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    "i-arrow": '<path d="M5 12h14M14 7l5 5-5 5"/>'
  };

  function mountIconCatalog() {
    if (document.getElementById("golden-icon-catalog")) return;

    const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sprite.id = "golden-icon-catalog";
    sprite.setAttribute("aria-hidden", "true");
    sprite.setAttribute("focusable", "false");
    sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    sprite.innerHTML = Object.entries(icons)
      .map(([id, drawing]) => `<symbol id="${id}" viewBox="0 0 24 24">${drawing}</symbol>`)
      .join("");
    document.body.prepend(sprite);

    document.querySelectorAll("svg.icon use").forEach((use) => {
      const reference = use.getAttribute("href") || use.getAttribute("xlink:href") || "";
      const id = reference.includes("#") ? reference.slice(reference.lastIndexOf("#") + 1) : reference;
      if (icons[id]) {
        use.setAttribute("href", `#${id}`);
        use.removeAttribute("xlink:href");
      }
    });

    document.querySelectorAll("svg.icon").forEach((icon) => {
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountIconCatalog, { once: true });
  } else {
    mountIconCatalog();
  }
})();
