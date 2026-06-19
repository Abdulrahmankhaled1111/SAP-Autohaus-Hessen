(function () {
  "use strict";

  const appName = "Autohaus HESSEN";
  let deferredPrompt = null;
  let installButton = null;
  let headerInstallButton = null;

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const canUseServiceWorker = "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1");

  if (canUseServiceWorker) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // The app still works in the browser if the service worker cannot be registered.
      });
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton("App installieren");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstallButton();
    showMessage("Die Autohaus-App wurde installiert.");
  });

  window.addEventListener("online", () => showMessage("Verbindung wiederhergestellt."));
  window.addEventListener("offline", () => showMessage("Offline: Aktuelle SAP-Daten sind erst wieder online verfuegbar."));

  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    showHeaderInstallButton();

    if (!isStandalone) {
      showInstallButton("Zum Home-Bildschirm");
    }
  });

  function showHeaderInstallButton() {
    if (isStandalone || headerInstallButton) return;

    const actions = document.querySelector(".shell-actions, .topbar-actions");
    if (!actions) return;

    headerInstallButton = document.createElement("button");
    headerInstallButton.className = actions.classList.contains("shell-actions") ? "shell-button pwa-header-install" : "btn pwa-header-install";
    headerInstallButton.type = "button";
    headerInstallButton.textContent = "App installieren";
    headerInstallButton.addEventListener("click", handleInstallClick);

    const logoutLink = actions.querySelector('a[href="/logout"], #logoutButton');
    actions.insertBefore(headerInstallButton, logoutLink || actions.firstChild);
  }

  function showInstallButton(label) {
    if (isStandalone) return;
    if (!document.body) return;

    if (!installButton) {
      installButton = document.createElement("button");
      installButton.className = "pwa-install-button";
      installButton.type = "button";
      installButton.addEventListener("click", handleInstallClick);
      document.body.appendChild(installButton);
    }

    installButton.textContent = label;
    installButton.hidden = false;
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (choice.outcome === "accepted") hideInstallButton();
      return;
    }

    if (isIos) {
      showMessage("iPhone: Teilen-Symbol oeffnen und \"Zum Home-Bildschirm\" waehlen.");
      return;
    }

    showMessage("Android/Chrome: Drei-Punkte-Menue oeffnen und \"App installieren\" oder \"Zum Startbildschirm\" waehlen.");
  }

  function hideInstallButton() {
    if (installButton) installButton.hidden = true;
  }

  function showMessage(message) {
    let toast = document.getElementById("pwaToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pwaToast";
      toast.className = "pwa-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => toast.classList.remove("is-visible"), 4800);
  }

  function injectStyles() {
    if (document.getElementById("pwaStyles")) return;

    const style = document.createElement("style");
    style.id = "pwaStyles";
    style.textContent = `
      .pwa-install-button {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 9999;
        min-height: 44px;
        max-width: min(260px, calc(100vw - 36px));
        padding: 0 18px;
        border: 0;
        border-radius: 6px;
        background: #0f6ab4;
        color: #fff;
        font: 700 0.95rem/1 Arial, Helvetica, sans-serif;
        letter-spacing: 0;
        box-shadow: 0 14px 30px rgba(15, 106, 180, 0.28);
        cursor: pointer;
      }

      .pwa-install-button:hover {
        background: #095b9f;
      }

      .pwa-header-install {
        white-space: nowrap;
      }

      .pwa-toast {
        position: fixed;
        left: 50%;
        bottom: 76px;
        z-index: 10000;
        width: min(420px, calc(100vw - 32px));
        padding: 12px 14px;
        border-radius: 6px;
        background: #1d2d3e;
        color: #fff;
        font: 600 0.92rem/1.35 Arial, Helvetica, sans-serif;
        letter-spacing: 0;
        box-shadow: 0 16px 34px rgba(22, 33, 45, 0.28);
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, 8px);
        transition: opacity 0.18s ease, transform 0.18s ease;
      }

      .pwa-toast.is-visible {
        opacity: 1;
        transform: translate(-50%, 0);
      }

      @media (max-width: 720px) {
        .pwa-install-button {
          right: 14px;
          bottom: 14px;
        }

        .pwa-toast {
          bottom: 70px;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
