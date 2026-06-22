(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    waitForDevelopmentMode(function () {
      bindSearch();
      loadUser();
      loadOverview();
      checkSystem();
    });
  });

  function waitForDevelopmentMode(callback) {
    Promise.resolve(window.AUTOHAUS_DEVELOPMENT_MODE_READY).then(function () {
      if (window.AUTOHAUS_DEVELOPMENT_LOCKED) return;
      callback();
    });
  }

  function bindSearch() {
    var search = document.getElementById("tileSearch");
    if (!search) return;
    search.addEventListener("input", function () {
      var query = search.value.trim().toLowerCase();
      document.querySelectorAll(".fiori-tile").forEach(function (tile) {
        var haystack = (tile.textContent + " " + (tile.getAttribute("data-title") || "")).toLowerCase();
        tile.hidden = query && haystack.indexOf(query) === -1;
      });
    });
  }

  function loadUser() {
    if (window.location.hostname.indexOf("hana.ondemand.com") === -1) {
      setText("currentUser", "Lokaler Benutzer");
      return;
    }
    fetch("/user-api/currentUser", { credentials: "same-origin" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (user) {
        if (!user) return;
        setText("currentUser", user.email || user.mail || user.name || user.userName || "SAP Benutzer");
      })
      .catch(function () {
        setText("currentUser", "SAP Benutzer");
      });
  }

  function checkSystem() {
    fetch(apiUrl("/health"), { credentials: "include" })
      .then(function (response) { return response.ok ? response.json() : Promise.reject(new Error("System nicht erreichbar")); })
      .then(function (health) {
        var status = document.getElementById("systemStatus");
        if (!status) return;
        status.textContent = health.database === "connected" ? "HANA verbunden" : "API bereit";
        status.classList.add("good");
      })
      .catch(function () {
        var status = document.getElementById("systemStatus");
        if (!status) return;
        status.textContent = "System wird geprüft";
        status.classList.add("warn");
      });
  }

  function loadOverview() {
    setOverviewLoading();
    fetch(apiUrl("/admin/summary"), { credentials: "include" })
      .then(function (response) { return response.ok ? response.json() : Promise.reject(new Error("Zusammenfassung nicht erreichbar")); })
      .then(function (summary) {
        setOverviewValue("lpOpenInvoices", summary.finance && summary.finance.openInvoices);
        setOverviewValue("lpOpenTasks", summary.workflow && summary.workflow.openTasks);
        setOverviewValue("lpVehicles", summary.counts && summary.counts.vehicles);
        setOverviewValue("lpTickets", summary.workflow && summary.workflow.openTickets);
      })
      .catch(loadOverviewFromState);
  }

  function loadOverviewFromState() {
    fetch(apiUrl("/state"), { credentials: "include" })
      .then(function (response) { return response.ok ? response.json() : Promise.reject(new Error("Datenstand nicht erreichbar")); })
      .then(function (state) {
        state = state || {};
        setOverviewValue("lpOpenInvoices", openItems(state.invoices, "Bezahlt"));
        setOverviewValue("lpOpenTasks", openItems(state.tasks, "Erledigt"));
        setOverviewValue("lpVehicles", Array.isArray(state.vehicles) ? state.vehicles.length : 0);
        setOverviewValue("lpTickets", openItems(state.tickets, "Erledigt"));
      })
      .catch(function () {
        ["lpOpenInvoices", "lpOpenTasks", "lpVehicles", "lpTickets"].forEach(function (id) {
          setOverviewUnavailable(id);
        });
      });
  }

  function setOverviewLoading() {
    ["lpOpenInvoices", "lpOpenTasks", "lpVehicles", "lpTickets"].forEach(function (id) {
      setText(id, "...");
      setOverviewState(id, "is-loading");
    });
  }

  function openItems(items, doneStatus) {
    if (!Array.isArray(items)) return 0;
    return items.filter(function (item) {
      return item && item.status !== doneStatus;
    }).length;
  }

  function apiUrl(path) {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:4004/api" + path;
    }
    return "/api" + path;
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function setOverviewValue(id, value) {
    setOverviewState(id, "is-ready");
    setText(id, formatNumber(value));
  }

  function setOverviewUnavailable(id) {
    setOverviewState(id, "is-unavailable");
    setText(id, "n/v");
  }

  function setOverviewState(id, stateClass) {
    var element = document.getElementById(id);
    if (!element || !element.parentElement) return;
    element.parentElement.classList.remove("is-loading", "is-ready", "is-unavailable");
    element.parentElement.classList.add(stateClass);
  }

  function formatNumber(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = 0;
    return number.toLocaleString("de-DE");
  }
}());
