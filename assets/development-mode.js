(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var preview = params.get("preview") === "dev";

  window.AUTOHAUS_DEVELOPMENT_LOCKED = false;
  window.AUTOHAUS_DEVELOPMENT_MODE_READY = fetch("/development-mode.json?ts=" + Date.now(), { cache: "no-store" })
    .then(function (response) { return response.ok ? response.json() : { enabled: false }; })
    .then(function (config) {
      if (!config.enabled && !preview) return config;
      window.AUTOHAUS_DEVELOPMENT_LOCKED = true;
      showDevelopmentLock(config);
      return config;
    })
    .catch(function () {
      window.AUTOHAUS_DEVELOPMENT_LOCKED = false;
    });

  function showDevelopmentLock(config) {
    injectStyles();
    var overlay = document.createElement("section");
    overlay.className = "development-lock";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="development-card">' +
      '<div class="development-head"><div class="development-mark">AH</div><div><h1>' + escapeHtml(config.headline || "Autohaus HESSEN wird gerade aktualisiert") + '</h1><p>SAP Fiori ERP System</p></div></div>' +
      '<div class="development-body">' +
      '<div class="development-status">' + escapeHtml(config.title || "Entwicklungsmodus") + '</div>' +
      '<p>' + escapeHtml(config.message || "Das System wird aktuell weiterentwickelt und ist vorübergehend nicht verfügbar.") + '</p>' +
      '<div class="development-grid">' +
      '<div><span>Status</span><strong>Anmeldung gesperrt</strong></div>' +
      '<div><span>Freigabe</span><strong>' + escapeHtml(config.expectedUntil || "Nach Abschluss") + '</strong></div>' +
      '<div><span>Ansprechpartner</span><strong>' + escapeHtml(config.contact || "Administration") + '</strong></div>' +
      '</div>' +
      '<div class="development-actions"><button type="button" onclick="window.location.reload()">Status erneut prüfen</button><a href="/logout">Abmelden</a></div>' +
      '</div></div>';
    document.body.appendChild(overlay);
  }

  function injectStyles() {
    if (document.getElementById("developmentModeStyles")) return;
    var style = document.createElement("style");
    style.id = "developmentModeStyles";
    style.textContent =
      ".development-lock{position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,rgba(23,35,52,.96),rgba(36,59,85,.94));display:grid;place-items:center;padding:24px;color:#1f2a37;font:14px/1.5 '72','Segoe UI',Arial,sans-serif}" +
      ".development-card{width:min(760px,100%);background:#fff;border:1px solid #d8e0ea;border-radius:8px;overflow:hidden;box-shadow:0 26px 80px rgba(0,0,0,.35)}" +
      ".development-head{background:linear-gradient(90deg,#172334,#243b55);color:#fff;padding:24px;display:flex;align-items:center;gap:14px}" +
      ".development-mark{width:48px;height:48px;border-radius:8px;background:#0a6ed1;display:grid;place-items:center;font-weight:850;box-shadow:0 10px 28px rgba(10,110,209,.3)}" +
      ".development-head h1{margin:0;font-size:23px;letter-spacing:0}.development-head p{margin:2px 0 0;color:#c9d7e6;font-weight:650}" +
      ".development-body{padding:24px;display:grid;gap:16px}.development-status{border:1px solid #f1d29a;border-left:4px solid #c47f00;border-radius:8px;background:#fff8eb;color:#5f3b00;padding:14px 16px;font-weight:800}" +
      ".development-body p{margin:0;color:#475467}.development-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.development-grid div{border:1px solid #d8e0ea;border-radius:8px;background:#fbfcfe;padding:13px}.development-grid span{display:block;color:#667085;font-size:12px;font-weight:800;text-transform:uppercase}.development-grid strong{display:block;margin-top:5px}" +
      ".development-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}.development-actions button,.development-actions a{min-height:40px;border:1px solid #b8c3cf;border-radius:8px;background:#fff;color:#1f2a37;padding:10px 14px;text-decoration:none;font-weight:750;cursor:pointer}.development-actions a{border-color:#0a6ed1;background:#0a6ed1;color:#fff}" +
      "@media(max-width:720px){.development-lock{padding:14px}.development-head{align-items:flex-start}.development-grid{grid-template-columns:1fr}.development-actions button,.development-actions a{width:100%;text-align:center}}";
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }
}());
