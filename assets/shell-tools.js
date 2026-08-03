(function () {
  "use strict";

  var activeMenu = null;

  window.AUTOHAUS_SHELL = {
    checkSystem: checkSystemStatus,
    setUser: setUser,
    setSystemStatus: setSystemStatus,
    showToast: showToast
  };

  document.addEventListener("DOMContentLoaded", function () {
    bindMenuButtons();
    bindSearchButtons();
    bindCopyButtons();
    bindGlobalClose();
    initializeUser();
    checkSystemStatus();
    loadNotifications();
  });

  function bindMenuButtons() {
    document.querySelectorAll("[data-shell-menu-button]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        var menu = document.getElementById(button.getAttribute("aria-controls"));
        if (!menu) return;
        toggleMenu(button, menu);
      });
    });
  }

  function bindSearchButtons() {
    document.querySelectorAll("[data-shell-search]").forEach(function (button) {
      button.addEventListener("click", function () {
        var target = findSearchTarget();
        if (!target) {
          showToast("In dieser Ansicht ist keine Suche verfügbar.");
          return;
        }
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(function () {
          target.focus();
          if (target.select) target.select();
        }, 160);
      });
    });
  }

  function bindCopyButtons() {
    document.querySelectorAll("[data-shell-copy]").forEach(function (button) {
      button.addEventListener("click", function () {
        var text = button.getAttribute("data-shell-copy") || supportText();
        copyText(text);
      });
    });
  }

  function bindGlobalClose() {
    document.addEventListener("click", function (event) {
      if (event.target && event.target.closest && event.target.closest(".shell-tool")) return;
      closeMenus();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenus();
    });
  }

  function toggleMenu(button, menu) {
    var isOpen = !menu.hidden;
    closeMenus();
    if (isOpen) return;
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    activeMenu = menu;
  }

  function closeMenus() {
    document.querySelectorAll("[data-shell-menu-button]").forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".shell-menu").forEach(function (menu) {
      menu.hidden = true;
    });
    activeMenu = null;
  }

  function findSearchTarget() {
    var launchpadSearch = document.getElementById("tileSearch");
    if (isVisible(launchpadSearch)) return launchpadSearch;

    var activeView = document.querySelector(".view.active");
    if (activeView) {
      var viewSearch = activeView.querySelector('input[type="search"], input[id$="Search"], .toolbar input:not([type="hidden"])');
      if (isVisible(viewSearch)) return viewSearch;
    }

    return document.querySelector('input[type="search"], input[id$="Search"]');
  }

  function isVisible(element) {
    return Boolean(element && element.offsetParent !== null && !element.disabled);
  }

  function initializeUser() {
    var nameElement = document.querySelector("[data-shell-user-name]");
    var name = nameElement ? nameElement.textContent.trim() : "SAP Benutzer";
    setUser(name, "");
  }

  function checkSystemStatus() {
    var statusButton = document.getElementById("systemStatus");
    if (!statusButton) return;

    setSystemStatus("checking", "System wird geprüft", "API und Datenbank werden geprüft.", "Prüfung läuft", "Prüfung läuft");
    fetch(apiUrl("/health"), { credentials: "include" })
      .then(function (response) {
        if (!response.ok) throw new Error("System nicht erreichbar");
        return response.json();
      })
      .then(function (health) {
        var dbState = health && health.database === "connected" ? "HANA verbunden" : "API bereit";
        setSystemStatus("good", "System geprüft", "Die Anwendung ist erreichbar.", "API erreichbar", dbState);
      })
      .catch(function () {
        setSystemStatus("error", "Systemfehler", "API oder Datenbank ist aktuell nicht erreichbar.", "Fehler", "Nicht erreichbar");
      });
  }

  function setSystemStatus(state, title, detail, apiState, dbState) {
    var button = document.getElementById("systemStatus");
    if (!button) return;

    button.classList.remove("is-checking", "is-good", "is-error");
    button.classList.add(state === "good" ? "is-good" : state === "error" ? "is-error" : "is-checking");
    button.setAttribute("aria-label", title);
    button.title = title;

    setTextAll("[data-shell-system-title]", title);
    setTextAll("[data-shell-system-detail]", detail);
    setTextAll("[data-shell-api-state]", apiState || "");
    setTextAll("[data-shell-db-state]", dbState || "");
  }

  function loadNotifications() {
    var list = document.querySelector("[data-shell-notification-list]");
    if (!list) return;

    setNotificationLoading();
    fetch(apiUrl("/admin/summary"), { credentials: "include" })
      .then(function (response) {
        if (!response.ok) throw new Error("Benachrichtigungen nicht erreichbar");
        return response.json();
      })
      .then(renderNotifications)
      .catch(function () {
        renderNotifications(localNotificationSummary());
      });
  }

  function renderNotifications(summary) {
    var finance = summary && summary.finance ? summary.finance : {};
    var workflow = summary && summary.workflow ? summary.workflow : {};
    var openInvoices = numberOrZero(finance.openInvoices);
    var openTasks = numberOrZero(workflow.openTasks);
    var openTickets = numberOrZero(workflow.openTickets);
    var items = [];

    if (openInvoices > 0) {
      items.push({ tone: "danger", title: openInvoices + " offene Rechnungen", text: "Finanzen prüfen und Zahlungseingänge kontrollieren." });
    }
    if (openTasks > 0) {
      items.push({ tone: "warning", title: openTasks + " offene Aufgaben", text: "Heute fällige Arbeit im Team prüfen." });
    }
    if (openTickets > 0) {
      items.push({ tone: "warning", title: openTickets + " offene Tickets", text: "Service- und interne Tickets nach Priorität bearbeiten." });
    }

    var count = openInvoices + openTasks + openTickets;
    setNotificationCount(count);
    setTextAll("[data-shell-notification-summary]", count ? count + " offene Hinweise im System" : "Keine offenen Hinweise");

    var list = document.querySelector("[data-shell-notification-list]");
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div class="notification-empty">Alles ruhig. Es gibt aktuell keine offenen Systemhinweise.</div>';
      return;
    }

    list.innerHTML = items.map(function (item) {
      return '<div class="notification-item ' + item.tone + '"><span>' + escapeHtml(item.title) + '</span><strong>' + escapeHtml(item.text) + '</strong></div>';
    }).join("");
  }

  function setNotificationLoading() {
    setNotificationCount(0);
    setTextAll("[data-shell-notification-summary]", "Aktuelle Hinweise werden geladen.");
  }

  function setNotificationCount(count) {
    document.querySelectorAll("[data-shell-notification-count]").forEach(function (badge) {
      badge.hidden = count < 1;
      badge.textContent = count > 99 ? "99+" : String(count);
    });
  }

  function localNotificationSummary() {
    var state = readLocalState();
    if (!state) return null;
    return {
      finance: {
        openInvoices: openItems(state.invoices, "Bezahlt")
      },
      workflow: {
        openTasks: openItems(state.tasks, "Erledigt"),
        openTickets: openItems(state.tickets, "Erledigt")
      }
    };
  }

  function readLocalState() {
    try {
      return JSON.parse(localStorage.getItem("autohaus-hessen-erp-v5") || "null");
    } catch (error) {
      return null;
    }
  }

  function openItems(items, doneStatus) {
    if (!Array.isArray(items)) return 0;
    return items.filter(function (item) {
      return item && item.status !== doneStatus;
    }).length;
  }

  function setUser(name, roleLabel) {
    var hasName = typeof name === "string" && name.trim();
    var userName = hasName ? name.trim() : "";
    if (hasName) {
      document.querySelectorAll("[data-shell-user-name]").forEach(function (element) {
        element.textContent = userName;
      });
      document.querySelectorAll("[data-shell-user-initials]").forEach(function (element) {
        element.textContent = initials(userName);
      });
    }
    if (roleLabel) {
      document.querySelectorAll("[data-shell-user-role]").forEach(function (element) {
        element.textContent = roleLabel;
      });
    }
  }

  function initials(name) {
    var clean = String(name || "").replace(/<[^>]+>/g, "").trim();
    if (!clean || clean === "SAP Benutzer") return "S";
    if (clean.indexOf("@") > -1) clean = clean.split("@")[0].replace(/[._-]+/g, " ");
    var parts = clean.split(/\s+/).filter(Boolean);
    if (!parts.length) return "S";
    var first = parts[0].charAt(0);
    var second = parts.length > 1 ? parts[1].charAt(0) : parts[0].charAt(1);
    return (first + (second || "")).toUpperCase();
  }

  function apiUrl(path) {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:4004/api" + path;
    }
    return "/api" + path;
  }

  function numberOrZero(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function setTextAll(selector, value) {
    document.querySelectorAll(selector).forEach(function (element) {
      element.textContent = value;
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function supportText() {
    return [
      "Autohaus HESSEN ERP Support",
      "IT-Support: support@autohaus-hessen.example | +49 69 100200-99",
      "SAP/BTP Admin: btp-admin@autohaus-hessen.example",
      "Fachlicher Support: service@autohaus-hessen.example",
      "System: SAP BTP, AppRouter, XSUAA, ERP API, SAP HANA Cloud"
    ].join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("Supportdaten wurden kopiert.");
      }).catch(function () {
        fallbackCopy(text);
      });
      return;
    }
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand("copy");
      showToast("Supportdaten wurden kopiert.");
    } catch (error) {
      showToast("Kopieren ist im Browser blockiert.");
    }
    document.body.removeChild(field);
  }

  function showToast(message) {
    var toast = document.getElementById("shellToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "shellToast";
      toast.className = "shell-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3600);
  }
}());
