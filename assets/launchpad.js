(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    bindSearch();
    loadUser();
    checkSystem();
  });

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
}());
