(function () {
  "use strict";

  var STORAGE_KEY = "autohaus-hessen-session-last-activity";
  var TIMEOUT_MS = 10 * 60 * 1000;
  var WARNING_SECONDS = 60;
  var lastWriteAt = 0;
  var autoLogoutStarted = false;
  var labelOverrideUntil = 0;

  document.addEventListener("DOMContentLoaded", function () {
    if (!readLastActivity()) writeLastActivity(Date.now());
    bindActivity();
    bindSessionButton();
    window.setInterval(checkSession, 1000);
    updateSessionButton();
  });

  function bindActivity() {
    ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "focus"].forEach(function (eventName) {
      window.addEventListener(eventName, function () {
        recordActivity(false);
      }, { passive: true });
    });

    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) updateSessionButton();
    });
  }

  function bindSessionButton() {
    var button = document.getElementById("sessionSecurity");
    if (!button) return;
    button.addEventListener("click", function () {
      recordActivity(true);
      labelOverrideUntil = Date.now() + 1400;
      updateSessionButton();
    });
  }

  function recordActivity(force) {
    if (autoLogoutStarted) return;
    var now = Date.now();
    if (!force && now - lastWriteAt < 1200) return;
    lastWriteAt = now;
    writeLastActivity(now);
    updateSessionButton();
  }

  function checkSession() {
    if (autoLogoutStarted) return;
    var inactiveFor = Date.now() - readLastActivity();
    if (inactiveFor >= TIMEOUT_MS) {
      autoLogoutStarted = true;
      updateSessionButton(true);
      logout();
      return;
    }
    updateSessionButton();
  }

  function updateSessionButton(isLoggingOut) {
    var button = document.getElementById("sessionSecurity");
    var label = document.getElementById("sessionStateLabel");
    var countdown = document.getElementById("sessionCountdown");
    var progress = document.getElementById("sessionProgress");
    if (!button || !label || !countdown || !progress) return;

    var remaining = remainingSeconds();
    var percent = Math.max(0, Math.min(100, (remaining / (TIMEOUT_MS / 1000)) * 100));
    var warning = remaining <= WARNING_SECONDS;

    button.classList.toggle("warning", warning && !isLoggingOut);
    button.classList.toggle("danger", Boolean(isLoggingOut));
    label.textContent = isLoggingOut ? "Abmeldung" : Date.now() < labelOverrideUntil ? "verlängert" : warning ? "läuft ab" : "Sitzung";
    countdown.textContent = formatDuration(remaining);
    progress.style.width = percent + "%";
  }

  function remainingSeconds() {
    var inactiveFor = Date.now() - readLastActivity();
    return Math.max(0, Math.ceil((TIMEOUT_MS - inactiveFor) / 1000));
  }

  function readLastActivity() {
    try {
      return Number(localStorage.getItem(STORAGE_KEY) || 0);
    } catch (error) {
      return Date.now();
    }
  }

  function writeLastActivity(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (error) {
      // Wenn der Browser Speicher blockiert, läuft die aktuelle Seite trotzdem weiter.
    }
  }

  function logout() {
    if (window.location.hostname.indexOf("hana.ondemand.com") > -1) {
      window.location.href = "/logout";
      return;
    }
    var button = document.getElementById("sessionSecurity");
    if (button) button.title = "Lokale Demo: In der Cloud wird automatisch abgemeldet.";
  }

  function formatDuration(seconds) {
    var minutes = Math.floor(seconds / 60);
    var rest = seconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
  }
}());
