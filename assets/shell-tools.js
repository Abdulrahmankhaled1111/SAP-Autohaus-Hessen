(function () {
  "use strict";

  var activeMenu = null;

  window.AUTOHAUS_SHELL = {
    setUser: setUser,
    showToast: showToast
  };

  document.addEventListener("DOMContentLoaded", function () {
    bindMenuButtons();
    bindSearchButtons();
    bindCopyButtons();
    bindGlobalClose();
    initializeUser();
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
