// js/config.js  (script normal, no módulos)
(function () {

  // Helper: "UTC -5" o "UTC +05:30"
  function getUtcOffsetLabel(d = new Date()) {
    const offMin = -d.getTimezoneOffset();
    const sign   = offMin >= 0 ? "+" : "-";
    const abs    = Math.abs(offMin);
    const hh     = Math.floor(abs / 60);
    const mm     = abs % 60;
    return mm === 0
      ? `UTC ${sign}${hh}`                             // UTC -5
      : `UTC ${sign}${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`; // UTC +05:30
  }

  // Promesa global para que otros scripts puedan esperar el config
  window.configReady = (async () => {
    let cfg;
    try {
      const res = await fetch("./config.json", { cache: "no-cache" });
      cfg = await res.json();
    } catch (e) {
      cfg = { app: { origen: "SavingsTemplatesApp", versionApp: "0.0.0", locale: "es-CO" } };
      console.warn("No se pudo cargar config.json, usando defaults.", e);
    }

    // Exponer config global e inmutable
    window.APP_CONFIG = Object.freeze(cfg);

    // Pintar footer cuando el DOM esté listo
    const paint = () => {
      const y = document.getElementById("year");
      const n = document.getElementById("appName");
      const v = document.getElementById("appVersion");
      const u = document.getElementById("utcOffset");
      if (y) y.textContent = new Date().getFullYear();
      if (n) n.textContent = cfg.app.origen;
      if (v) v.textContent = cfg.app.versionApp;
      if (u) u.textContent = getUtcOffsetLabel(); // ← aquí pintamos el UTC
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", paint, { once: true });
    } else {
      paint();
    }

    return cfg;
  })();

})();
