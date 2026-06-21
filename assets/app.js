(function () {
  "use strict";

  var STORAGE_KEY = "autohaus-hessen-erp-v5";
  var OLD_KEY = "autohaus-hessen-demo-v2";
  var LEGACY_KEYS = ["autohaus-hessen-demo-v4", "autohaus-hessen-demo-v3", OLD_KEY];
  var state = loadState();
  var currentView = "dashboard";
  var enterpriseBackend = "browser";
  var syncTimer = null;
  var appContext = readAppContext();
  var operationsSummary = null;
  var operationsLoading = false;
  var operationsLoadedAt = 0;

  var roles = {
    admin: {
      label: "Admin",
      views: ["dashboard", "vehicles", "customers", "sales", "finance", "documents", "tasks", "tickets", "correspondence", "hr", "audit"],
      edit: true,
      del: true,
      admin: true,
      finance: true,
      print: true
    },
    owner: {
      label: "Chef",
      views: ["dashboard", "vehicles", "customers", "sales", "finance", "documents", "tasks", "tickets", "correspondence", "audit"],
      edit: true,
      del: false,
      admin: false,
      finance: true,
      print: true
    },
    employee: {
      label: "Mitarbeiter",
      views: ["dashboard", "vehicles", "customers", "sales", "documents", "tasks", "tickets", "correspondence"],
      edit: true,
      del: false,
      admin: false,
      finance: false,
      print: true
    },
    sales: {
      label: "Verkauf",
      views: ["dashboard", "vehicles", "customers", "sales", "documents", "tasks", "tickets", "correspondence"],
      edit: true,
      del: false,
      admin: false,
      finance: false,
      print: true
    },
    finance: {
      label: "Finanzen",
      views: ["dashboard", "customers", "finance", "documents", "tasks", "tickets", "correspondence"],
      edit: true,
      del: false,
      admin: false,
      finance: true,
      print: true
    },
    hr: {
      label: "Personal",
      views: ["dashboard", "tasks", "tickets", "hr"],
      edit: true,
      del: false,
      admin: false,
      finance: false,
      print: false
    }
  };

  var views = {
    dashboard: "Dashboard",
    vehicles: "Fahrzeuge",
    customers: "Kunden",
    sales: "Verkauf",
    finance: "Finanzen",
    documents: "Dokumente",
    tasks: "Aufgaben",
    tickets: "Tickets",
    correspondence: "Briefe & Versand",
    hr: "Personal",
    audit: "Sicherheit"
  };

  var appContexts = {
    full: {
      label: "Fiori App Suite",
      note: "Alle freigegebenen Unternehmensbereiche in einer Suite.",
      views: Object.keys(views)
    },
    management: {
      label: "Management",
      note: "Management-App mit Dashboard, Steuerung und Sicherheitsprotokoll.",
      views: ["dashboard", "audit"]
    },
    salesInventory: {
      label: "Verkauf & Bestand",
      note: "Fiori-App-Kontext für Fahrzeuge, Kunden und Verkauf. Andere Abteilungen sind hier ausgeblendet.",
      views: ["vehicles", "customers", "sales"]
    },
    backoffice: {
      label: "Backoffice",
      note: "Fiori-App-Kontext für Finanzen, Dokumente und Personal.",
      views: ["finance", "documents", "hr"]
    },
    workflow: {
      label: "Zusammenarbeit",
      note: "Fiori-App-Kontext für Aufgaben, Tickets und Korrespondenz.",
      views: ["tasks", "tickets", "correspondence"]
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    waitForDevelopmentMode(function () {
      bindNavigation();
      bindForms();
      window.addEventListener("hashchange", applyHashView);
      window.setInterval(applyHashView, 250);
      byId("roleSelect").value = state.session.role;
      applyAppContext();
      applyRole();
      setView(allowedView(window.location.hash.replace("#", "") || inferInitialView()));
      applyLetterTemplate();
      render();
      loadCloudUser();
      loadEnterpriseState();
    });
  });

  function waitForDevelopmentMode(callback) {
    Promise.resolve(window.AUTOHAUS_DEVELOPMENT_MODE_READY).then(function () {
      if (window.AUTOHAUS_DEVELOPMENT_LOCKED) return;
      callback();
    });
  }

  function loadState() {
    var saved = readStored(STORAGE_KEY);
    if (!saved) {
      LEGACY_KEYS.some(function (key) {
        saved = readStored(key);
        return !!saved;
      });
      if (saved) saved = migrate(saved);
    }
    return normalizeState(saved || seedState());
  }

  function readStored(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (e) {
      localStorage.removeItem(key);
      return null;
    }
  }

  function migrate(old) {
    old.version = 4;
    old.session = old.session || { role: "admin" };
    old.notes = old.notes || [];
    old.requests = (old.requests || []).map(function (r) {
      r.sentAt = r.sentAt || "";
      return r;
    });
    old.reminders = (old.reminders || []).map(function (m) {
      m.sentAt = m.sentAt || "";
      m.level = Number(m.level || 1);
      m.dueDate = m.dueDate || addDays(7);
      m.status = m.status && m.status !== "Erstellt" ? m.status : reminderLevelLabel(m.level);
      return m;
    });
    old.payrolls = (old.payrolls || []).map(function (p) {
      p.sentAt = p.sentAt || "";
      return p;
    });
    old.tasks = old.tasks || [];
    old.tasks = old.tasks.map(normalizeTask);
    old.tickets = (old.tickets || []).map(normalizeTicket);
    old.letters = (old.letters || []).map(function (l) {
      l.sentAt = l.sentAt || "";
      return l;
    });
    old.invoices = (old.invoices || []).map(function (i) {
      i.sentAt = i.sentAt || "";
      return i;
    });
    old.customers = (old.customers || []).map(function (c) {
      c.notes = c.notes || [];
      return c;
    });
    old.employees = (old.employees || []).map(function (e) {
      e.monthlySalary = Number(e.monthlySalary || defaultSalary(e.role));
      return e;
    });
    old.audit = old.audit || [];
    old.audit.unshift({ time: now(), action: "Demo aktualisiert", detail: "Rollen, Briefe, Versandstatus und professionelle Mustertexte aktiviert." });
    return old;
  }

  function normalizeState(data) {
    data.version = 5;
    data.session = data.session || { role: "admin" };
    data.vehicles = data.vehicles || [];
    data.customers = data.customers || [];
    data.sales = data.sales || [];
    data.payrolls = data.payrolls || [];
    data.tasks = (data.tasks || []).map(normalizeTask);
    data.tickets = (data.tickets || []).map(normalizeTicket);
    data.employees = (data.employees || []).map(normalizeEmployee);
    data.requests = data.requests || [];
    data.invoices = data.invoices || [];
    data.reminders = (data.reminders || []).map(normalizeReminder);
    data.letters = data.letters || [];
    data.notes = data.notes || [];
    data.audit = data.audit || [];
    return data;
  }

  function normalizeTask(task) {
    task.type = task.type || "Aufgabe";
    task.time = task.time || "";
    task.priority = task.priority || "Normal";
    task.area = task.area || "Verkauf";
    task.status = task.status || "Offen";
    return task;
  }

  function normalizeReminder(reminder) {
    reminder.level = Number(reminder.level || 1);
    reminder.dueDate = reminder.dueDate || addDays(reminder.level === 1 ? 7 : reminder.level === 2 ? 5 : 3);
    reminder.status = reminder.status && reminder.status !== "Erstellt" ? reminder.status : reminderLevelLabel(reminder.level);
    reminder.sentAt = reminder.sentAt || "";
    return reminder;
  }

  function normalizeTicket(ticket) {
    ticket.area = ticket.area || "Verkauf";
    ticket.priority = ticket.priority || "Normal";
    ticket.status = ticket.status || "Offen";
    ticket.createdAt = ticket.createdAt || today();
    ticket.dueDate = ticket.dueDate || "";
    ticket.ownerName = ticket.ownerName || "";
    ticket.customerName = ticket.customerName || "";
    ticket.vehicleName = ticket.vehicleName || "";
    ticket.description = ticket.description || "";
    return ticket;
  }

  function normalizeEmployee(employee) {
    employee.monthlySalary = Number(employee.monthlySalary || defaultSalary(employee.role));
    employee.personnelNo = employee.personnelNo || employee.id || "";
    employee.startDate = employee.startDate || today();
    employee.contractType = employee.contractType || "Vollzeit";
    employee.weeklyHours = Number(employee.weeklyHours || 40);
    employee.taxClass = employee.taxClass || "I";
    employee.federalState = employee.federalState || "Hessen";
    employee.healthInsurance = employee.healthInsurance || "Gesetzlich";
    employee.children = Number(employee.children || 0);
    employee.churchTax = employee.churchTax || "Nein";
    employee.vacationDays = Number(employee.vacationDays || 28);
    employee.status = employee.status || "Aktiv";
    return employee;
  }

  function seedState() {
    return {
      version: 4,
      session: { role: "admin" },
      vehicles: [
        { id: "FZ-1001", fin: "WVWZZZCDZRW100142", brand: "Volkswagen", model: "Golf 8 Variant", year: 2024, color: "Graphitgrau", km: 12400, price: 28900, status: "Bestand" },
        { id: "FZ-1002", fin: "WBA5A71090FN22133", brand: "BMW", model: "530e Touring", year: 2023, color: "Alpinweiss", km: 18200, price: 48900, status: "Reserviert" },
        { id: "FZ-1003", fin: "WAUZZZF44PN044812", brand: "Audi", model: "A4 Avant", year: 2023, color: "Navarrablau", km: 22100, price: 37900, status: "Werkstatt" }
      ],
      customers: [
        { id: "KD-2001", type: "Privat", salutation: "Herr", firstName: "Mehmet", lastName: "Yilmaz", company: "", street: "Mainzer Landstr. 21", zip: "60329", city: "Frankfurt", phone: "+49 69 441122", email: "mehmet.yilmaz@example.de", notes: [] },
        { id: "KD-2002", type: "Gewerbe", salutation: "Firma", firstName: "", lastName: "Hessen Logistik GmbH", company: "Hessen Logistik GmbH", street: "Industriestr. 8", zip: "63065", city: "Offenbach", phone: "+49 69 778899", email: "einkauf@hessen-logistik.example", notes: [] }
      ],
      sales: [],
      invoices: [
        { id: "RG-3001", saleId: "ALT-1", customerName: "Hessen Logistik GmbH", vehicleName: "BMW 530e Touring", date: today(), dueDate: addDays(14), gross: 48900, paid: 10000, status: "Teilbezahlt", sentAt: "" }
      ],
      employees: [
        { id: "MA-4001", personnelNo: "P-1001", name: "Sara Becker", role: "Verkauf", email: "s.becker@autohaus-hessen.example", phone: "+49 69 100200", monthlySalary: 3600, taxClass: "I", federalState: "Hessen", healthInsurance: "Gesetzlich", children: 0, churchTax: "Nein", contractType: "Vollzeit", weeklyHours: 40, vacationDays: 28, startDate: today(), status: "Aktiv" },
        { id: "MA-4002", personnelNo: "P-1002", name: "Nico Weber", role: "Finanzen", email: "n.weber@autohaus-hessen.example", phone: "+49 69 100201", monthlySalary: 3900, taxClass: "IV", federalState: "Hessen", healthInsurance: "Gesetzlich", children: 1, churchTax: "Nein", contractType: "Vollzeit", weeklyHours: 40, vacationDays: 28, startDate: today(), status: "Aktiv" },
        { id: "MA-4003", personnelNo: "P-1003", name: "Lea Hoffmann", role: "Service", email: "l.hoffmann@autohaus-hessen.example", phone: "+49 69 100202", monthlySalary: 3300, taxClass: "I", federalState: "Hessen", healthInsurance: "Gesetzlich", children: 0, churchTax: "Nein", contractType: "Vollzeit", weeklyHours: 40, vacationDays: 28, startDate: today(), status: "Aktiv" }
      ],
      notes: [],
      requests: [],
      reminders: [],
      payrolls: [],
      tickets: [
        { id: "TS-13001", createdAt: today(), dueDate: today(), area: "Service", priority: "Hoch", title: "Werkstattfreigabe Audi A4 klären", ownerId: "MA-4003", ownerName: "Lea Hoffmann", customerId: "", customerName: "", vehicleId: "FZ-1003", vehicleName: "Audi A4 Avant", description: "Status, HU/AU und Aufbereitung prüfen und Rückmeldung an Verkauf geben.", status: "Offen" },
        { id: "TS-13002", createdAt: today(), dueDate: addDays(1), area: "Finanzen", priority: "Normal", title: "Restzahlung Hessen Logistik abstimmen", ownerId: "MA-4002", ownerName: "Nico Weber", customerId: "KD-2002", customerName: "Hessen Logistik GmbH", vehicleId: "FZ-1002", vehicleName: "BMW 530e Touring", description: "Offenen Betrag zur Rechnung RG-3001 prüfen und Zahlungseingang dokumentieren.", status: "In Arbeit" }
      ],
      tasks: [
        { id: "TK-12001", type: "Aufgabe", dueDate: today(), time: "10:00", area: "Verkauf", priority: "Hoch", title: "Angebot für Mehmet Yilmaz nachfassen", customerId: "KD-2001", customerName: "Mehmet Yilmaz", vehicleId: "FZ-1001", vehicleName: "Volkswagen Golf 8 Variant", note: "Finanzierung und Inzahlungnahme ansprechen.", status: "Offen" },
        { id: "TK-12002", type: "Aufgabe", dueDate: addDays(2), time: "09:30", area: "Finanzen", priority: "Normal", title: "Teilzahlung Hessen Logistik prüfen", customerId: "KD-2002", customerName: "Hessen Logistik GmbH", vehicleId: "FZ-1002", vehicleName: "BMW 530e Touring", note: "Restbetrag zur Rechnung RG-3001 kontrollieren.", status: "Offen" },
        { id: "TK-12003", type: "Termin", dueDate: today(), time: "15:00", area: "Service", priority: "Normal", title: "Werkstattstatus Audi A4 prüfen", customerId: "", customerName: "", vehicleId: "FZ-1003", vehicleName: "Audi A4 Avant", note: "HU/AU und Aufbereitung abstimmen.", status: "Offen" }
      ],
      letters: [
        {
          id: "BR-10001",
          date: today(),
          customerId: "KD-2001",
          customerName: "Mehmet Yilmaz",
          subject: "Ihr Fahrzeugwunsch bei Autohaus HESSEN",
          body: "Sehr geehrter Herr Yilmaz,\n\nvielen Dank für Ihr Interesse an einem Fahrzeug aus unserem Bestand. Wir begleiten Sie von der Auswahl über Finanzierung und Zulassung bis zur Übergabe mit einem festen Ansprechpartner.\n\nGerne bereiten wir für Sie ein individuelles Angebot inklusive Inzahlungnahme-Prüfung vor.\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH",
          status: "Entwurf",
          sentAt: ""
        }
      ],
      audit: [
        { time: now(), action: "System initialisiert", detail: "Lokale Demo-Daten wurden angelegt." }
      ]
    };
  }

  function bindNavigation() {
    document.querySelectorAll("[data-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        var view = button.getAttribute("data-view");
        if (!canUseView(view)) return toast("Diese Fiori-App zeigt diesen Bereich nicht oder die Rolle hat keinen Zugriff.");
        setView(view);
      });
    });

    byId("roleSelect").addEventListener("change", function (event) {
      state.session.role = event.target.value;
      saveState("Rolle gewechselt", "Aktive Rolle: " + role().label);
      applyRole();
      if (!canView(currentView)) setView(allowedView("dashboard"));
      render();
      toast("Rolle gewechselt: " + role().label);
    });

    byId("exportData").addEventListener("click", exportData);
    byId("refreshOperations").addEventListener("click", function () {
      loadOperationsSummary(true);
    });
    byId("downloadBackup").addEventListener("click", downloadBackup);
    byId("launchpadButton").addEventListener("click", function () {
      window.location.href = "index.html";
    });
    byId("logoutButton").addEventListener("click", logoutUser);
    byId("resetDemo").addEventListener("click", function () {
      if (!role().admin) return toast("Nur Admin darf die Demo zurücksetzen.");
      if (confirm("Demo-Daten wirklich zurücksetzen?")) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(OLD_KEY);
        state = seedState();
        saveState("Demo zurückgesetzt", "Alle lokalen Daten wurden neu angelegt.");
        byId("roleSelect").value = state.session.role;
        applyRole();
        setView("dashboard");
        toast("Demo-Daten wurden zurückgesetzt.");
      }
    });

    byId("printDocumentList").addEventListener("click", function () {
      printDocument("overview");
    });
  }

  function bindForms() {
    byId("vehicleForm").addEventListener("submit", onVehicleSubmit);
    byId("customerForm").addEventListener("submit", onCustomerSubmit);
    byId("noteForm").addEventListener("submit", onNoteSubmit);
    byId("saleForm").addEventListener("submit", onSaleSubmit);
    byId("requestForm").addEventListener("submit", onRequestSubmit);
    byId("paymentForm").addEventListener("submit", onPaymentSubmit);
    byId("employeeForm").addEventListener("submit", onEmployeeSubmit);
    byId("letterForm").addEventListener("submit", onLetterSubmit);
    byId("taskForm").addEventListener("submit", onTaskSubmit);
    byId("ticketForm").addEventListener("submit", onTicketSubmit);
    byId("letterTemplate").addEventListener("change", applyLetterTemplate);
    byId("letterCustomer").addEventListener("change", applyLetterTemplate);
    byId("previewLetter").addEventListener("click", previewLetter);

    ["vehicleSearch", "vehicleStatus", "customerSearch", "invoiceStatus", "taskStatus", "taskArea", "ticketStatus", "ticketArea"].forEach(function (id) {
      byId(id).addEventListener("input", render);
      byId(id).addEventListener("change", render);
    });
  }

  function applyHashView() {
    var hashView = window.location.hash.replace("#", "");
    if (views[hashView] && hashView !== currentView) setView(allowedView(hashView));
  }

  function inferInitialView() {
    var initial = queryParam("app");
    if (views[initial]) return initial;
    if (context().views.length) return context().views[0];
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf("zahfahrzeug") > -1) return "vehicles";
    if (path.indexOf("zahkunde") > -1) return "customers";
    if (path.indexOf("zahverkauf") > -1) return "sales";
    if (path.indexOf("zahdashboard") > -1) return "dashboard";
    return "dashboard";
  }

  function setView(view) {
    view = allowedView(view);
    currentView = view;
    if (window.location.hash !== "#" + view) window.location.hash = view;
    document.querySelectorAll(".view").forEach(function (el) {
      el.classList.toggle("active", el.id === "view-" + view);
    });
    document.querySelectorAll("[data-view]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-view") === view);
    });
    byId("pageTitle").textContent = views[view];
    render();
  }

  function applyRole() {
    byId("activeRole").textContent = role().label;
    document.querySelectorAll("[data-view]").forEach(function (button) {
      var visible = canUseView(button.getAttribute("data-view"));
      button.hidden = !visible;
    });
    byId("resetDemo").hidden = !role().admin;
    byId("exportData").hidden = !(role().admin || state.session.role === "owner");
  }

  function readAppContext() {
    var workspace = queryParam("workspace");
    var app = queryParam("app");
    if (workspace === "salesInventory") return "salesInventory";
    if (workspace === "backoffice") return "backoffice";
    if (workspace === "workflow") return "workflow";
    if (app === "dashboard" || app === "audit") return "management";
    if (app === "vehicles" || app === "customers" || app === "sales") return "salesInventory";
    if (app === "finance" || app === "documents" || app === "hr") return "backoffice";
    if (app === "tasks" || app === "tickets" || app === "correspondence") return "workflow";
    return "full";
  }

  function applyAppContext() {
    var current = context();
    setText("appContextLabel", current.label);
    setText("appContextNote", current.note);
    document.body.setAttribute("data-app-context", appContext);
  }

  function context() {
    return appContexts[appContext] || appContexts.full;
  }

  function appCanView(view) {
    return context().views.indexOf(view) > -1;
  }

  function canUseView(view) {
    return canView(view) && appCanView(view);
  }

  function queryParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function render() {
    renderDashboard();
    renderVehicles();
    renderCustomers();
    renderSales();
    renderFinance();
    renderDocuments();
    renderTasks();
    renderTickets();
    renderLetters();
    renderHr();
    renderAudit();
    fillSelects();
    applyFormAccess();
  }

  function renderDashboard() {
    var openInvoices = state.invoices.filter(function (i) { return i.status !== "Bezahlt"; });
    var revenue = state.invoices.reduce(function (sum, i) { return sum + Number(i.paid || 0); }, 0);
    var inventoryValue = state.vehicles.filter(function (v) { return v.status !== "Verkauft"; }).reduce(function (sum, v) { return sum + Number(v.price || 0); }, 0);
    var openTasks = state.tasks.filter(function (t) { return t.status !== "Erledigt"; });
    setText("kpiVehicles", state.vehicles.filter(function (v) { return v.status === "Bestand"; }).length);
    setText("kpiCustomers", state.customers.length);
    setText("kpiOpenInvoices", openInvoices.length);
    setText("kpiRevenue", formatMoney(revenue));
    setText("kpiTasks", openTasks.length);
    setText("kpiInventoryValue", formatMoney(inventoryValue));
    renderRows("recentTable", state.invoices.slice(0, 6), function (i) {
      return [i.date, i.customerName, i.vehicleName, moneyCell(i.gross), statusBadge(i.status)];
    }, 5);
    renderRows("dashboardTaskTable", openTasks.slice(0, 6), function (t) {
      return [t.dueDate, t.title, t.area, statusBadge(t.status)];
    }, 4);
    renderDashboardQuickActions(openInvoices, openTasks);
    renderDepartmentCockpit(openInvoices, revenue, inventoryValue, openTasks);
  }

  function renderDashboardQuickActions(openInvoices, openTasks) {
    var container = byId("dashboardQuickActions");
    if (!container) return;
    var available = state.vehicles.filter(function (v) { return v.status === "Bestand"; }).length;
    var openTickets = state.tickets.filter(function (ticket) { return ticket.status !== "Erledigt"; });
    var payrollMonth = state.payrolls.filter(function (p) { return p.period === currentPayrollPeriod(); }).length;
    var actions = [
      { view: "vehicles", label: "Fahrzeug erfassen", detail: available + " Fahrzeuge verfügbar", badge: "Bestand" },
      { view: "customers", label: "Kundenakte öffnen", detail: state.customers.length + " Kunden im System", badge: "CRM" },
      { view: "finance", label: "Offene Posten prüfen", detail: openInvoices.length + " Rechnungen offen", badge: "Finanzen" },
      { view: "tasks", label: "Aufgaben planen", detail: openTasks.length + " Aufgaben offen", badge: "Team" },
      { view: "tickets", label: "Tickets steuern", detail: openTickets.length + " Tickets offen", badge: "Service" },
      { view: "hr", label: "Lohnabrechnung", detail: payrollMonth + " Abrechnungen im Monat", badge: "Personal" }
    ].filter(function (item) {
      return canUseView(item.view);
    });

    container.innerHTML = actions.map(function (item) {
      return '<button class="quick-action" type="button" data-quick-view="' + escapeHtml(item.view) + '">' +
        '<span>' + escapeHtml(item.badge) + '</span>' +
        '<strong>' + escapeHtml(item.label) + '</strong>' +
        '<small>' + escapeHtml(item.detail) + '</small>' +
        '</button>';
    }).join("");

    container.querySelectorAll("[data-quick-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        setView(button.getAttribute("data-quick-view"));
      });
    });
  }

  function renderDepartmentCockpit(openInvoices, revenue, inventoryValue, openTasks) {
    var container = byId("departmentCards");
    if (!container) return;
    var unpaid = openInvoices.reduce(function (sum, i) { return sum + Math.max(0, Number(i.gross || 0) - Number(i.paid || 0)); }, 0);
    var available = state.vehicles.filter(function (v) { return v.status === "Bestand"; }).length;
    var workshop = state.vehicles.filter(function (v) { return v.status === "Werkstatt"; }).length;
    var offers = state.requests.filter(function (r) { return r.type === "Angebot"; }).length;
    var inquiries = state.requests.filter(function (r) { return r.type === "Anfrage"; }).length;
    var payrollMonth = state.payrolls.filter(function (p) { return p.period === currentPayrollPeriod(); }).length;
    var openTickets = state.tickets.filter(function (ticket) { return ticket.status !== "Erledigt"; });
    var cards = [
      {
        area: "Geschäftsführung",
        text: "Überblick über Umsatz, Bestand, offene Aufgaben und Risiko.",
        lines: [["Monatsumsatz", formatMoney(revenue)], ["Bestandswert", formatMoney(inventoryValue)], ["Offene Tickets", String(openTickets.length)]]
      },
      {
        area: "Verkauf",
        text: "Anfragen, Angebote, Probefahrten und Kundenkontakt sauber steuern.",
        lines: [["Kunden", String(state.customers.length)], ["Anfragen", String(inquiries)], ["Tickets", String(openTickets.filter(function (t) { return t.area === "Verkauf"; }).length)]]
      },
      {
        area: "Finanzen",
        text: "Rechnungen, Zahlungseingänge, offene Posten und Mahnungen im Blick.",
        lines: [["Offene Rechnungen", String(openInvoices.length)], ["Offener Betrag", formatMoney(unpaid)], ["Tickets", String(openTickets.filter(function (t) { return t.area === "Finanzen"; }).length)]]
      },
      {
        area: "Fahrzeugbestand",
        text: "Bestand, Reservierung, Werkstattstatus und Fahrzeugakte je Fahrzeug.",
        lines: [["Verfügbar", String(available)], ["Werkstatt", String(workshop)], ["Service-Tickets", String(openTickets.filter(function (t) { return t.area === "Service"; }).length)]]
      },
      {
        area: "Personal",
        text: "Mitarbeiter, Rollen und monatliche Lohnabrechnungen vorbereiten.",
        lines: [["Aktive Mitarbeiter", String(state.employees.filter(function (e) { return e.status === "Aktiv"; }).length)], ["Lohnabrechnungen", String(payrollMonth)], ["Tickets", String(openTickets.filter(function (t) { return t.area === "Personal"; }).length)]]
      },
      {
        area: "Dokumente",
        text: "Rechnungen, Angebote, Briefe, Kaufverträge und Versandstatus archivieren.",
        lines: [["Dokumente", String(documentRows().length)], ["Briefe", String(state.letters.length)], ["Tickets", String(openTickets.filter(function (t) { return t.area === "Dokumente"; }).length)]]
      }
    ];
    container.innerHTML = cards.map(function (card) {
      return '<article class="department-card"><div class="department-card-title">' + escapeHtml(card.area) + '</div>' +
        '<p>' + escapeHtml(card.text) + '</p>' +
        card.lines.map(function (line) {
          return '<div class="metric-line"><span>' + escapeHtml(line[0]) + '</span><strong>' + escapeHtml(line[1]) + '</strong></div>';
        }).join("") + '</article>';
    }).join("");
  }

  function renderVehicles() {
    var q = value("vehicleSearch").toLowerCase();
    var status = value("vehicleStatus");
    var rows = state.vehicles.filter(function (v) {
      var text = [v.fin, v.brand, v.model, v.color].join(" ").toLowerCase();
      return (!q || text.indexOf(q) > -1) && (!status || v.status === status);
    });

    renderRows("vehicleTable", rows, function (v) {
      return [
        v.fin,
        v.brand,
        v.model,
        String(v.year),
        v.color,
        Number(v.km).toLocaleString("de-DE") + " km",
        moneyCell(v.price),
        statusBadge(v.status),
        { html: actions([
          ["Bearbeiten", "editVehicle", v.id, "", role().edit],
          ["Akte", "openVehicleFile", v.id, "", role().print],
          ["Reservieren", "reserveVehicle", v.id, "", role().edit],
          ["Kaufvertrag", "printVehicleContract", v.id, "", role().print],
          ["Löschen", "deleteVehicle", v.id, "danger", role().del]
        ]) }
      ];
    }, 9);
  }

  function renderCustomers() {
    var q = value("customerSearch").toLowerCase();
    var rows = state.customers.filter(function (c) {
      return [c.id, c.firstName, c.lastName, c.company, c.city, c.email].join(" ").toLowerCase().indexOf(q) > -1;
    });

    renderRows("customerTable", rows, function (c) {
      return [
        c.id,
        c.type,
        customerName(c),
        c.city,
        c.phone,
        c.email,
        String(noteCount(c.id)),
        { html: actions([
          ["Bearbeiten", "editCustomer", c.id, "", role().edit],
          ["Akte", "openCustomerFile", c.id, "", role().print],
          ["Drucken", "printCustomer", c.id, "", role().print],
          ["Löschen", "deleteCustomer", c.id, "danger", role().del]
        ]) }
      ];
    }, 8);

    renderRows("noteTable", state.notes.slice(0, 8), function (n) {
      return [n.date, n.customerName, n.text];
    }, 3);
  }

  function renderSales() {
    renderRows("salesTable", state.sales, function (s) {
      return [s.id, s.date, s.customerName, s.vehicleName, moneyCell(s.gross), statusBadge(s.status)];
    }, 6);

    renderRows("requestTable", state.requests, function (r) {
      return [
        r.id,
        r.type,
        r.customerName,
        r.vehicleName || "-",
        moneyCell(r.amount),
        statusBadge(r.status),
        r.sentAt ? "Gesendet " + r.sentAt : "Entwurf",
        { html: actions([
          ["Bearbeiten", "editRequest", r.id, "", role().edit],
          ["Drucken", "printRequest", r.id, "", role().print],
          ["E-Mail", "sendRequest", r.id, "", role().print]
        ]) }
      ];
    }, 8);
  }

  function renderFinance() {
    var filter = value("invoiceStatus");
    var rows = state.invoices.filter(function (i) { return !filter || i.status === filter; });
    renderRows("invoiceTable", rows, function (i) {
      return [
        i.id,
        i.date,
        i.dueDate,
        i.customerName,
        i.vehicleName,
        moneyCell(i.gross),
        moneyCell(i.paid),
        moneyCell(Math.max(0, i.gross - i.paid)),
        reminderStatusCell(i),
        statusBadge(i.status),
        i.sentAt ? "Gesendet " + i.sentAt : "Entwurf",
        { html: actions([
          ["Bearbeiten", "editInvoice", i.id, "", role().finance],
          ["Rechnung", "printInvoice", i.id, "", role().print],
          ["E-Mail", "sendInvoice", i.id, "", role().print],
          [nextReminderActionLabel(i), "createReminder", i.id, "danger", role().finance && i.status !== "Bezahlt" && nextReminderLevel(i.id) <= 3]
        ]) }
      ];
    }, 12);
  }

  function renderDocuments() {
    var docs = documentRows();
    renderRows("documentTable", docs, function (d) {
      return [
        d.date,
        d.type,
        d.id,
        d.customerName,
        moneyCell(d.amount),
        statusBadge(d.status),
        d.sentAt ? "Gesendet " + d.sentAt : "Entwurf",
        { html: actions([
          ["Drucken", "printDoc", d.docKey, "", role().print],
          ["E-Mail", "sendDoc", d.docKey, "", role().print]
        ]) }
      ];
    }, 8);
  }

  function reminderStatusCell(invoice) {
    var currentLevel = lastReminderLevel(invoice.id);
    return currentLevel ? statusBadge(reminderLevelLabel(currentLevel)) : { html: '<span class="status info">Keine</span>' };
  }

  function nextReminderActionLabel(invoice) {
    var level = nextReminderLevel(invoice.id);
    return level <= 3 ? level + ". Mahnung" : "Mahnstopp";
  }

  function renderTasks() {
    var filter = value("taskStatus");
    var area = value("taskArea");
    var rows = filteredTasks(filter, area);
    renderRows("taskTable", rows, function (t) {
      return [
        t.dueDate,
        t.time || "-",
        t.type || "Aufgabe",
        t.area,
        t.title,
        t.customerName || "-",
        t.vehicleName || "-",
        priorityBadge(t.priority),
        statusBadge(t.status),
        { html: actions([
          ["Erledigt", "completeTask", t.id, "", role().edit && t.status !== "Erledigt"],
          ["Als Ticket", "taskToTicket", t.id, "", role().edit && t.status !== "Erledigt"],
          ["Öffnen", "openTask", t.id, "", role().print],
          ["Löschen", "deleteTask", t.id, "danger", role().del]
        ]) }
      ];
    }, 10);
    renderDepartmentCalendar();
  }

  function filteredTasks(status, area) {
    return state.tasks.filter(function (t) {
      return (!status || t.status === status) && (!area || t.area === area);
    }).sort(function (a, b) {
      var first = String(a.dueDate) + " " + String(a.time || "");
      var second = String(b.dueDate) + " " + String(b.time || "");
      return first.localeCompare(second);
    });
  }

  function renderDepartmentCalendar() {
    var board = byId("departmentCalendar");
    if (!board) return;
    var areas = ["Verkauf", "Service", "Finanzen", "Personal", "Management", "Dokumente"];
    var tasksByArea = areas.map(function (area) {
      return {
        area: area,
        tasks: filteredTasks("", area).filter(function (t) { return t.status !== "Erledigt"; }).slice(0, 6)
      };
    });
    board.innerHTML = tasksByArea.map(function (group) {
      return '<article class="calendar-column"><div class="calendar-column-head"><strong>' + escapeHtml(group.area) + '</strong><span>' + group.tasks.length + ' offen</span></div>' +
        (group.tasks.length ? group.tasks.map(calendarItemHtml).join("") : '<div class="calendar-empty">Keine offenen Termine.</div>') +
        '</article>';
    }).join("");
    board.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", handleTableAction);
    });
  }

  function calendarItemHtml(task) {
    return '<button class="calendar-item" type="button" data-action="openTask" data-id="' + escapeHtml(task.id) + '">' +
      '<span class="calendar-date">' + escapeHtml(task.dueDate) + (task.time ? " - " + escapeHtml(task.time) : "") + '</span>' +
      '<span class="calendar-title">' + escapeHtml(task.title) + '</span>' +
      '<span class="calendar-meta">' + escapeHtml(task.type || "Aufgabe") + ' - ' + escapeHtml(task.priority || "Normal") + '</span>' +
      '</button>';
  }

  function renderTickets() {
    var rows = filteredTickets(value("ticketStatus"), value("ticketArea"));
    renderRows("ticketTable", rows, function (ticket) {
      return [
        ticket.id,
        ticket.dueDate || "-",
        ticket.area,
        ticket.title,
        ticket.ownerName || "-",
        ticket.customerName || "-",
        ticket.vehicleName || "-",
        priorityBadge(ticket.priority),
        statusBadge(ticket.status),
        { html: actions([
          ["Starten", "startTicket", ticket.id, "", role().edit && ticket.status === "Offen"],
          ["Erledigt", "completeTicket", ticket.id, "", role().edit && ticket.status !== "Erledigt"],
          ["Öffnen", "openTicket", ticket.id, "", role().print],
          ["Löschen", "deleteTicket", ticket.id, "danger", role().del]
        ]) }
      ];
    }, 10);
    renderTicketBoard(rows);
  }

  function filteredTickets(status, area) {
    return state.tickets.filter(function (ticket) {
      return (!status || ticket.status === status) && (!area || ticket.area === area);
    }).sort(function (a, b) {
      var statusOrder = { "Offen": "1", "In Arbeit": "2", "Erledigt": "3" };
      return (statusOrder[a.status] + String(a.dueDate || "9999")).localeCompare(statusOrder[b.status] + String(b.dueDate || "9999"));
    });
  }

  function renderTicketBoard(rows) {
    var board = byId("ticketBoard");
    if (!board) return;
    var columns = ["Offen", "In Arbeit", "Erledigt"];
    board.innerHTML = columns.map(function (status) {
      var tickets = rows.filter(function (ticket) { return ticket.status === status; });
      return '<section class="ticket-column"><div class="ticket-column-head"><strong>' + escapeHtml(status) + '</strong><span>' + tickets.length + '</span></div>' +
        (tickets.length ? tickets.map(ticketCardHtml).join("") : '<div class="calendar-empty">Keine Tickets.</div>') +
        '</section>';
    }).join("");
    board.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", handleTableAction);
    });
  }

  function ticketCardHtml(ticket) {
    return '<button class="ticket-card" type="button" data-action="openTicket" data-id="' + escapeHtml(ticket.id) + '">' +
      '<span class="ticket-card-top"><strong>' + escapeHtml(ticket.id) + '</strong><span>' + escapeHtml(ticket.area) + '</span></span>' +
      '<span class="calendar-title">' + escapeHtml(ticket.title) + '</span>' +
      '<span class="calendar-meta">' + escapeHtml(ticket.ownerName || "Nicht zugewiesen") + ' - ' + escapeHtml(ticket.priority || "Normal") + (ticket.dueDate ? ' - ' + escapeHtml(ticket.dueDate) : '') + '</span>' +
      '</button>';
  }

  function renderLetters() {
    renderRows("letterTable", state.letters, function (letter) {
      return [
        letter.date,
        letter.id,
        letter.customerName,
        letter.subject,
        statusBadge(letter.status),
        { html: actions([
          ["Drucken", "printLetter", letter.id, "", role().print],
          ["E-Mail", "sendLetter", letter.id, "", role().print],
          ["Löschen", "deleteLetter", letter.id, "danger", role().del]
        ]) }
      ];
    }, 6);
  }

  function renderHr() {
    var activeEmployees = state.employees.filter(function (e) { return e.status === "Aktiv"; });
    var payrollsThisMonth = state.payrolls.filter(function (p) { return p.period === currentPayrollPeriod(); });
    var hrTotals = activeEmployees.reduce(function (sum, employee) {
      var calc = payrollCalculation(employee);
      sum.gross += calc.gross;
      sum.employerCost += calc.employerTotal;
      return sum;
    }, { gross: 0, employerCost: 0 });
    setText("hrActiveEmployees", activeEmployees.length);
    setText("hrGrossPayroll", formatMoney(hrTotals.gross));
    setText("hrEmployerCost", formatMoney(hrTotals.employerCost));
    setText("hrPayrollCount", payrollsThisMonth.length + " / " + activeEmployees.length);
    renderRows("employeeTable", state.employees, function (e) {
      var calc = payrollCalculation(e);
      return [
        e.id,
        e.name,
        e.role,
        e.contractType + " / " + Number(e.weeklyHours || 0) + "h",
        "Kl. " + e.taxClass + " / " + e.healthInsurance,
        moneyCell(e.monthlySalary),
        moneyCell(calc.net),
        moneyCell(calc.employerTotal),
        statusBadge(e.status),
        { html: actions([
          ["Bearbeiten", "editEmployee", e.id, "", role().edit],
          ["Lohnabrechnung", "createPayroll", e.id, "", role().admin || state.session.role === "hr"],
          ["Löschen", "deleteEmployee", e.id, "danger", role().del]
        ]) }
      ];
    }, 10);
    renderRows("payrollTable", state.payrolls, function (p) {
      return [
        p.id,
        p.period,
        p.employeeName,
        moneyCell(p.gross),
        moneyCell(p.totalDeductions || (Number(p.tax || 0) + Number(p.social || 0))),
        moneyCell(p.net),
        moneyCell(p.employerTotal || p.gross),
        statusBadge(p.status),
        { html: actions([
          ["Drucken", "printDoc", "payroll:" + p.id, "", role().print || state.session.role === "hr"],
          ["E-Mail", "sendDoc", "payroll:" + p.id, "", role().print || state.session.role === "hr"]
        ]) }
      ];
    }, 9);
  }

  function renderAudit() {
    renderOperationsPanel();
    if (currentView === "audit") loadOperationsSummary(false);
    renderRows("auditTable", state.audit, function (a) {
      return [a.time, a.action, a.detail];
    }, 3);
  }

  function renderOperationsPanel() {
    var summary = operationsSummary || localOperationsSummary();
    var backend = enterpriseBackend === "api" ? "ERP-API aktiv" : "Browser-Speicher";
    var database = summary.database === "connected" || summary.database === "verbunden" ? "SAP HANA verbunden" :
      summary.database === "degraded" ? "HANA nicht erreichbar" : summary.storage || "Lokal";
    var tableStatus = summary.database === "degraded" ? "Verbindung prüfen" :
      summary.tableCount ? summary.tableCount + " Tabellen" : "Lokaler Modus";
    setText("opsBackendStatus", backend);
    setText("opsDatabaseStatus", database);
    setText("opsTableStatus", tableStatus);
    setText("opsAuditStatus", String(summary.counts && summary.counts.audit ? summary.counts.audit : state.audit.length));
    setText("opsLastSync", operationsText(summary));
    renderReadiness(summary.readiness || localReadiness());
  }

  function operationsText(summary) {
    var counts = summary.counts || {};
    var openInvoices = summary.finance ? summary.finance.openInvoices : state.invoices.filter(function (i) { return i.status !== "Bezahlt"; }).length;
    var openTasks = summary.workflow ? summary.workflow.openTasks : state.tasks.filter(function (t) { return t.status !== "Erledigt"; }).length;
    var parts = [
      "Datenbestand: " + Number(counts.customers || state.customers.length).toLocaleString("de-DE") + " Kunden",
      Number(counts.vehicles || state.vehicles.length).toLocaleString("de-DE") + " Fahrzeuge",
      openInvoices + " offene Rechnungen",
      openTasks + " offene Aufgaben"
    ];
    if (summary.time) parts.push("Stand: " + new Date(summary.time).toLocaleString("de-DE"));
    return parts.join(" · ");
  }

  function localOperationsSummary() {
    var openInvoices = state.invoices.filter(function (i) { return i.status !== "Bezahlt"; });
    var openTasks = state.tasks.filter(function (t) { return t.status !== "Erledigt"; });
    var openTickets = state.tickets.filter(function (t) { return t.status !== "Erledigt"; });
    return {
      storage: enterpriseBackend === "api" ? "ERP-API" : "Browser-Speicher",
      database: enterpriseBackend === "api" ? "connected" : "local",
      tableCount: enterpriseBackend === "api" ? 14 : 0,
      time: new Date().toISOString(),
      counts: {
        vehicles: state.vehicles.length,
        customers: state.customers.length,
        invoices: state.invoices.length,
        employees: state.employees.length,
        tasks: state.tasks.length,
        tickets: state.tickets.length,
        audit: state.audit.length
      },
      finance: { openInvoices: openInvoices.length },
      workflow: { openTasks: openTasks.length, openTickets: openTickets.length },
      readiness: localReadiness()
    };
  }

  function localReadiness() {
    return [
      { label: "SAP/BTP Login", status: enterpriseBackend === "api" ? "good" : "warn", text: enterpriseBackend === "api" ? "Benutzer läuft über die Cloud-App." : "Lokal oder Browser-Modus aktiv." },
      { label: "SAP HANA Cloud", status: enterpriseBackend === "api" ? "good" : "warn", text: enterpriseBackend === "api" ? "Zentrale API ist aktiv." : "Noch nicht mit der API verbunden." },
      { label: "Datensicherung", status: "warn", text: "Backup über Admin-Knopf herunterladen und extern ablegen." }
    ];
  }

  function loadOperationsSummary(force) {
    var url = enterpriseApiUrl("/admin/summary");
    if (!url || !window.fetch) return;
    if (!force && operationsLoadedAt && Date.now() - operationsLoadedAt < 30000) return;
    if (operationsLoading) return;
    operationsLoading = true;
    fetch(url, { credentials: "include" })
      .then(function (response) {
        if (!response.ok) throw new Error("Betriebsstatus nicht verfügbar");
        return response.json();
      })
      .then(function (summary) {
        operationsSummary = summary;
        operationsLoadedAt = Date.now();
        renderOperationsPanel();
        if (force) toast("Systemstatus wurde geprüft.");
      })
      .catch(function () {
        operationsSummary = localOperationsSummary();
        renderOperationsPanel();
        if (force) toast("API-Status konnte nicht gelesen werden.");
      })
      .finally(function () {
        operationsLoading = false;
      });
  }

  function renderReadiness(items) {
    var container = byId("readinessList");
    if (!container) return;
    container.textContent = "";
    items.forEach(function (item) {
      var row = document.createElement("div");
      var badge = document.createElement("span");
      badge.className = "status " + (item.status || "warn");
      badge.textContent = item.status === "good" ? "Bereit" : item.status === "bad" ? "Fehler" : "Prüfen";
      var title = document.createElement("strong");
      title.textContent = item.label;
      var text = document.createElement("p");
      text.textContent = item.text || "";
      row.appendChild(badge);
      row.appendChild(title);
      row.appendChild(text);
      container.appendChild(row);
    });
  }

  function downloadBackup() {
    if (!(role().admin || state.session.role === "owner")) return toast("Nur Admin oder Chef dürfen Backups erstellen.");
    var url = enterpriseApiUrl("/admin/backup");
    if (enterpriseBackend === "api" && url && window.fetch) {
      fetch(url, { credentials: "include" })
        .then(function (response) {
          if (!response.ok) throw new Error("Backup nicht verfügbar");
          return response.json();
        })
        .then(function (backup) {
          downloadJson(backup, "autohaus-hessen-backup-" + today() + ".json");
          if (backup && backup.data) {
            state = normalizeState(backup.data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            operationsSummary = null;
            render();
          }
          toast("Backup wurde heruntergeladen.");
        })
        .catch(function () {
          toast("Backup über API nicht möglich. Lokaler Export wird erstellt.");
          downloadLocalBackup();
        });
      return;
    }
    downloadLocalBackup();
  }

  function downloadLocalBackup() {
    var backup = {
      exportType: "AUTOHAUS_HESSEN_LOCAL_BACKUP",
      exportedAt: new Date().toISOString(),
      storage: enterpriseBackend,
      data: state
    };
    downloadJson(backup, "autohaus-hessen-lokal-backup-" + today() + ".json");
    saveState("Lokales Backup erstellt", "JSON-Backup wurde im Browser heruntergeladen.");
    render();
  }

  function downloadJson(data, filename) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderRows(tableId, rows, map, colCount) {
    var table = byId(tableId);
    if (!table) return;
    var tbody = table.querySelector("tbody");
    tbody.textContent = "";
    if (!rows.length) {
      var emptyRow = document.createElement("tr");
      var td = document.createElement("td");
      td.className = "empty";
      td.colSpan = colCount;
      td.textContent = "Noch keine Daten vorhanden.";
      emptyRow.appendChild(td);
      tbody.appendChild(emptyRow);
      return;
    }

    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      map(row).forEach(function (cell) {
        var td = document.createElement("td");
        if (cell && cell.html) td.innerHTML = cell.html;
        else td.textContent = cell == null ? "" : String(cell);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", handleTableAction);
    });
  }

  function onVehicleSubmit(event) {
    event.preventDefault();
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var vehicle = formData("vehicleForm");
    if (!vehicle.fin || !vehicle.brand || !vehicle.model || !vehicle.price) return toast("Bitte Fahrzeugdaten vollständig ausfüllen.");
    vehicle.id = nextId("FZ", state.vehicles);
    vehicle.year = Number(vehicle.year || new Date().getFullYear());
    vehicle.km = Number(vehicle.km || 0);
    vehicle.price = Number(vehicle.price || 0);
    vehicle.status = "Bestand";
    state.vehicles.unshift(vehicle);
    saveState("Fahrzeug angelegt", vehicle.brand + " " + vehicle.model + " (" + vehicle.fin + ")");
    event.target.reset();
    render();
    toast("Fahrzeug wurde angelegt.");
  }

  function onCustomerSubmit(event) {
    event.preventDefault();
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var customer = formData("customerForm");
    if (!customer.lastName || !customer.city || !customer.email) return toast("Bitte Kunde mit Name, Ort und E-Mail erfassen.");
    customer.id = nextId("KD", state.customers);
    customer.notes = [];
    state.customers.unshift(customer);
    saveState("Kunde angelegt", customerName(customer));
    event.target.reset();
    render();
    toast("Kunde wurde angelegt.");
  }

  function onNoteSubmit(event) {
    event.preventDefault();
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var data = formData("noteForm");
    var customer = findById(state.customers, data.customerId);
    if (!customer || !data.text) return toast("Bitte Kunde und Notiz angeben.");
    var note = { id: nextId("NT", state.notes), date: today(), customerId: customer.id, customerName: customerName(customer), text: data.text };
    state.notes.unshift(note);
    customer.notes = customer.notes || [];
    customer.notes.unshift(note.id);
    saveState("Kunden-Notiz angelegt", customerName(customer));
    event.target.reset();
    render();
    toast("Notiz wurde gespeichert.");
  }

  function onSaleSubmit(event) {
    event.preventDefault();
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var data = formData("saleForm");
    var customer = findById(state.customers, data.customerId);
    var vehicle = findById(state.vehicles, data.vehicleId);
    if (!customer || !vehicle) return toast("Bitte Kunde und verfügbares Fahrzeug auswählen.");
    var discount = Number(data.discount || 0);
    var deposit = Number(data.deposit || 0);
    var gross = Math.max(0, Number(vehicle.price) - discount);
    var sale = {
      id: nextId("AU", state.sales),
      date: today(),
      customerId: customer.id,
      customerName: customerName(customer),
      vehicleId: vehicle.id,
      vehicleName: vehicle.brand + " " + vehicle.model,
      gross: gross,
      status: "Auftrag"
    };
    var invoice = {
      id: nextId("RG", state.invoices),
      saleId: sale.id,
      customerName: sale.customerName,
      vehicleName: sale.vehicleName,
      date: today(),
      dueDate: addDays(14),
      gross: gross,
      paid: deposit,
      status: deposit >= gross ? "Bezahlt" : deposit > 0 ? "Teilbezahlt" : "Offen",
      sentAt: ""
    };
    vehicle.status = "Reserviert";
    state.sales.unshift(sale);
    state.invoices.unshift(invoice);
    saveState("Verkauf erstellt", sale.id + " mit Rechnung " + invoice.id);
    event.target.reset();
    render();
    toast("Auftrag und Rechnung wurden erstellt.");
  }

  function onRequestSubmit(event) {
    event.preventDefault();
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var data = formData("requestForm");
    var customer = findById(state.customers, data.customerId);
    var vehicle = findById(state.vehicles, data.vehicleId);
    if (!customer) return toast("Bitte Kunde auswählen.");
    var doc = {
      id: nextId(data.type === "Angebot" ? "AG" : "AN", state.requests),
      type: data.type,
      date: today(),
      validUntil: data.validUntil || addDays(14),
      customerId: customer.id,
      customerName: customerName(customer),
      vehicleId: vehicle ? vehicle.id : "",
      vehicleName: vehicle ? vehicle.brand + " " + vehicle.model : "Nach Kundenwunsch",
      amount: Number(data.amount || (vehicle ? vehicle.price : 0)),
      text: data.text || "",
      status: data.type === "Angebot" ? "Offen" : "Neu",
      sentAt: ""
    };
    state.requests.unshift(doc);
    saveState(data.type + " erstellt", doc.id + " für " + doc.customerName);
    event.target.reset();
    render();
    toast(data.type + " wurde gespeichert.");
  }

  function onPaymentSubmit(event) {
    event.preventDefault();
    if (!role().finance) return toast("Nur Finanzen/Admin/Chef dürfen Zahlungen buchen.");
    var data = formData("paymentForm");
    var invoice = findById(state.invoices, data.invoiceId);
    var amount = Number(data.amount || 0);
    if (!invoice || amount <= 0) return toast("Bitte Rechnung und Zahlungsbetrag angeben.");
    invoice.paid = Math.min(Number(invoice.gross), Number(invoice.paid || 0) + amount);
    invoice.status = invoice.paid >= invoice.gross ? "Bezahlt" : "Teilbezahlt";
    saveState("Zahlung gebucht", invoice.id + ": " + formatMoney(amount));
    event.target.reset();
    render();
    toast("Zahlung wurde gebucht.");
  }

  function onEmployeeSubmit(event) {
    event.preventDefault();
    if (!(role().admin || state.session.role === "hr")) return toast("Nur Admin oder Personal dürfen Mitarbeiter bearbeiten.");
    var employee = formData("employeeForm");
    if (!employee.name || !employee.role || !employee.email) return toast("Bitte Name, Bereich und E-Mail angeben.");
    employee.id = nextId("MA", state.employees);
    employee.personnelNo = employee.personnelNo || "P-" + String(Number(employee.id.replace(/[^0-9]/g, "")) + 6000);
    employee.monthlySalary = Number(employee.monthlySalary || defaultSalary(employee.role));
    employee.weeklyHours = Number(employee.weeklyHours || 40);
    employee.children = Number(employee.children || 0);
    employee.vacationDays = Number(employee.vacationDays || 28);
    employee.startDate = employee.startDate || today();
    employee.status = "Aktiv";
    normalizeEmployee(employee);
    state.employees.unshift(employee);
    saveState("Mitarbeiter angelegt", employee.name + " - " + employee.role);
    event.target.reset();
    render();
    toast("Mitarbeiter wurde angelegt.");
  }

  function onLetterSubmit(event) {
    event.preventDefault();
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var data = formData("letterForm");
    var customer = findById(state.customers, data.customerId);
    if (!customer || !data.subject || !data.body) return toast("Bitte Kunde, Betreff und Brieftext angeben.");
    var letter = {
      id: nextId("BR", state.letters),
      date: today(),
      customerId: customer.id,
      customerName: customerName(customer),
      subject: data.subject,
      body: data.body,
      status: "Entwurf",
      sentAt: ""
    };
    state.letters.unshift(letter);
    saveState("Brief erstellt", letter.id + " für " + letter.customerName);
    event.target.reset();
    applyLetterTemplate();
    render();
    toast("Brief wurde professionell gespeichert.");
  }

  function onTaskSubmit(event) {
    event.preventDefault();
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var data = formData("taskForm");
    var customer = findById(state.customers, data.customerId);
    var vehicle = findById(state.vehicles, data.vehicleId);
    if (!data.title || !data.dueDate) return toast("Bitte Titel und Fälligkeit angeben.");
    var task = {
      id: nextId("TK", state.tasks),
      type: data.type || "Aufgabe",
      dueDate: data.dueDate,
      time: data.time || "",
      area: data.area || "Verkauf",
      priority: data.priority || "Normal",
      title: data.title,
      customerId: customer ? customer.id : "",
      customerName: customer ? customerName(customer) : "",
      vehicleId: vehicle ? vehicle.id : "",
      vehicleName: vehicle ? vehicle.brand + " " + vehicle.model : "",
      note: data.note || "",
      status: "Offen"
    };
    state.tasks.unshift(task);
    saveState("Aufgabe angelegt", task.title);
    event.target.reset();
    render();
    toast("Aufgabe wurde gespeichert.");
  }

  function onTicketSubmit(event) {
    event.preventDefault();
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var data = formData("ticketForm");
    var owner = findById(state.employees, data.ownerId);
    var customer = findById(state.customers, data.customerId);
    var vehicle = findById(state.vehicles, data.vehicleId);
    if (!data.title || !data.description) return toast("Bitte Titel und Beschreibung angeben.");
    var ticket = {
      id: nextId("TS", state.tickets),
      createdAt: today(),
      dueDate: data.dueDate || "",
      area: data.area || "Verkauf",
      priority: data.priority || "Normal",
      title: data.title,
      ownerId: owner ? owner.id : "",
      ownerName: owner ? owner.name : "",
      customerId: customer ? customer.id : "",
      customerName: customer ? customerName(customer) : "",
      vehicleId: vehicle ? vehicle.id : "",
      vehicleName: vehicle ? vehicle.brand + " " + vehicle.model : "",
      description: data.description || "",
      status: "Offen"
    };
    state.tickets.unshift(ticket);
    saveState("Ticket angelegt", ticket.id + " - " + ticket.title);
    event.target.reset();
    render();
    toast("Ticket wurde angelegt.");
  }

  function handleTableAction(event) {
    var action = event.currentTarget.getAttribute("data-action");
    var id = event.currentTarget.getAttribute("data-id");

    if (action === "reserveVehicle") return reserveVehicle(id);
    if (action === "editVehicle") return editVehicle(id);
    if (action === "editCustomer") return editCustomer(id);
    if (action === "openVehicleFile") return openVehicleFile(id);
    if (action === "openCustomerFile") return openCustomerFile(id);
    if (action === "editRequest") return editRequest(id);
    if (action === "editInvoice") return editInvoice(id);
    if (action === "editEmployee") return editEmployee(id);
    if (action === "createReminder") return createReminder(id);
    if (action === "printInvoice") return printDocument("invoice", id);
    if (action === "printRequest") return printDocument("request", id);
    if (action === "printCustomer") return printDocument("customer", id);
    if (action === "printLetter") return printDocument("letter", id);
    if (action === "printVehicleContract") return printDocument("vehicleContract", id);
    if (action === "createPayroll") return createPayroll(id);
    if (action === "completeTask") return completeTask(id);
    if (action === "taskToTicket") return createTicketFromTask(id);
    if (action === "openTask") return openTask(id);
    if (action === "startTicket") return startTicket(id);
    if (action === "completeTicket") return completeTicket(id);
    if (action === "openTicket") return openTicket(id);
    if (action === "printDoc") return printByDocKey(id);
    if (action === "sendInvoice") return sendDocument("invoice", id);
    if (action === "sendRequest") return sendDocument("request", id);
    if (action === "sendLetter") return sendDocument("letter", id);
    if (action === "sendDoc") return sendByDocKey(id);
    if (action === "deleteVehicle") return removeItem("vehicles", id, "Fahrzeug gelöscht");
    if (action === "deleteCustomer") return removeItem("customers", id, "Kunde gelöscht");
    if (action === "deleteEmployee") return removeItem("employees", id, "Mitarbeiter gelöscht");
    if (action === "deleteLetter") return removeItem("letters", id, "Brief gelöscht");
    if (action === "deleteTask") return removeItem("tasks", id, "Aufgabe gelöscht");
    if (action === "deleteTicket") return removeItem("tickets", id, "Ticket gelöscht");
  }

  function completeTask(id) {
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var task = findById(state.tasks, id);
    if (!task) return;
    task.status = "Erledigt";
    saveState("Aufgabe erledigt", task.title);
    render();
    toast("Aufgabe wurde erledigt.");
  }

  function openTask(id) {
    var task = findById(state.tasks, id);
    if (!task) return;
    openSideSheet("Aufgabe " + task.id, [
      ["Titel", task.title],
      ["Art", task.type || "Aufgabe"],
      ["Bereich", task.area],
      ["Fällig", task.dueDate],
      ["Uhrzeit", task.time || "-"],
      ["Priorität", task.priority || "Normal"],
      ["Kunde", task.customerName || "-"],
      ["Fahrzeug", task.vehicleName || "-"],
      ["Status", task.status],
      ["Notiz", task.note || "-"]
    ]);
  }

  function createTicketFromTask(id) {
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var task = findById(state.tasks, id);
    if (!task) return;
    var ticket = {
      id: nextId("TS", state.tickets),
      createdAt: today(),
      dueDate: task.dueDate || "",
      area: task.area || "Verkauf",
      priority: task.priority || "Normal",
      title: task.title,
      ownerId: "",
      ownerName: "",
      customerId: task.customerId || "",
      customerName: task.customerName || "",
      vehicleId: task.vehicleId || "",
      vehicleName: task.vehicleName || "",
      description: task.note || "Aus Aufgabe " + task.id + " erstellt.",
      status: "Offen"
    };
    state.tickets.unshift(ticket);
    task.status = "Erledigt";
    saveState("Aufgabe in Ticket umgewandelt", task.id + " -> " + ticket.id);
    render();
    toast("Ticket " + ticket.id + " wurde aus der Aufgabe erstellt.");
  }

  function startTicket(id) {
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var ticket = findById(state.tickets, id);
    if (!ticket) return;
    ticket.status = "In Arbeit";
    saveState("Ticket gestartet", ticket.id + " - " + ticket.title);
    render();
    toast("Ticket ist jetzt in Arbeit.");
  }

  function completeTicket(id) {
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var ticket = findById(state.tickets, id);
    if (!ticket) return;
    ticket.status = "Erledigt";
    ticket.closedAt = now();
    saveState("Ticket erledigt", ticket.id + " - " + ticket.title);
    render();
    toast("Ticket wurde erledigt.");
  }

  function openTicket(id) {
    var ticket = findById(state.tickets, id);
    if (!ticket) return;
    openSideSheet("Ticket " + ticket.id, [
      ["Titel", ticket.title],
      ["Status", ticket.status],
      ["Abteilung", ticket.area],
      ["Priorität", ticket.priority],
      ["Verantwortlich", ticket.ownerName || "-"],
      ["Erstellt", ticket.createdAt],
      ["Fällig", ticket.dueDate || "-"],
      ["Kunde", ticket.customerName || "-"],
      ["Fahrzeug", ticket.vehicleName || "-"],
      ["Beschreibung", ticket.description || "-"],
      ["Erledigt am", ticket.closedAt || "-"]
    ]);
  }

  function reserveVehicle(id) {
    if (!role().edit) return toast("Keine Bearbeitungsrechte.");
    var vehicle = findById(state.vehicles, id);
    if (!vehicle) return;
    vehicle.status = vehicle.status === "Reserviert" ? "Bestand" : "Reserviert";
    saveState("Fahrzeugstatus geändert", vehicle.fin + " -> " + vehicle.status);
    render();
  }

  function editVehicle(id) {
    var v = findById(state.vehicles, id);
    if (!v || !role().edit) return;
    openEditDialog("Fahrzeug bearbeiten", [
      { key: "price", label: "Verkaufspreis EUR", type: "number", value: v.price },
      { key: "km", label: "Kilometerstand", type: "number", value: v.km },
      { key: "status", label: "Status", type: "select", value: v.status, options: ["Bestand", "Reserviert", "Werkstatt"] }
    ], function (data) {
      v.price = Number(data.price || v.price);
      v.km = Number(data.km || v.km);
      v.status = data.status || v.status;
      saveState("Fahrzeug bearbeitet", v.fin);
      render();
      toast("Fahrzeug wurde aktualisiert.");
    });
  }

  function editCustomer(id) {
    var c = findById(state.customers, id);
    if (!c || !role().edit) return;
    openEditDialog("Kunde bearbeiten", [
      { key: "phone", label: "Telefon", value: c.phone },
      { key: "email", label: "E-Mail", type: "email", value: c.email },
      { key: "city", label: "Ort", value: c.city }
    ], function (data) {
      c.phone = data.phone || c.phone;
      c.email = data.email || c.email;
      c.city = data.city || c.city;
      saveState("Kunde bearbeitet", customerName(c));
      render();
      toast("Kunde wurde aktualisiert.");
    });
  }

  function editRequest(id) {
    var r = findById(state.requests, id);
    if (!r || !role().edit) return;
    openEditDialog(r.type + " bearbeiten", [
      { key: "amount", label: "Betrag EUR", type: "number", value: r.amount },
      { key: "validUntil", label: "Gültig bis", type: "date", value: r.validUntil },
      { key: "status", label: "Status", type: "select", value: r.status, options: ["Neu", "Offen", "In Bearbeitung", "Angenommen", "Abgelehnt"] },
      { key: "text", label: "Text", type: "textarea", value: r.text }
    ], function (data) {
      r.amount = Number(data.amount || r.amount);
      r.validUntil = data.validUntil || r.validUntil;
      r.status = data.status || r.status;
      r.text = data.text || r.text;
      saveState(r.type + " bearbeitet", r.id);
      render();
      toast(r.type + " wurde aktualisiert.");
    });
  }

  function editInvoice(id) {
    var i = findById(state.invoices, id);
    if (!i || !role().finance) return;
    openEditDialog("Rechnung bearbeiten", [
      { key: "dueDate", label: "Fälligkeitsdatum", type: "date", value: i.dueDate },
      { key: "paid", label: "Bereits bezahlt EUR", type: "number", value: i.paid },
      { key: "status", label: "Status", type: "select", value: i.status, options: ["Offen", "Teilbezahlt", "Bezahlt"] }
    ], function (data) {
      i.dueDate = data.dueDate || i.dueDate;
      i.paid = Math.min(Number(i.gross), Number(data.paid || i.paid || 0));
      i.status = data.status || (i.paid >= i.gross ? "Bezahlt" : i.paid > 0 ? "Teilbezahlt" : "Offen");
      saveState("Rechnung bearbeitet", i.id);
      render();
      toast("Rechnung wurde aktualisiert.");
    });
  }

  function editEmployee(id) {
    var e = findById(state.employees, id);
    if (!e || !(role().admin || state.session.role === "hr")) return;
    openEditDialog("Mitarbeiter bearbeiten", [
      { key: "role", label: "Bereich", type: "select", value: e.role, options: ["Verkauf", "Finanzen", "Service", "Einkauf", "Personal", "Geschäftsführung"] },
      { key: "personnelNo", label: "Personalnummer", value: e.personnelNo || e.id },
      { key: "startDate", label: "Eintritt", type: "date", value: e.startDate || today() },
      { key: "contractType", label: "Vertragsart", type: "select", value: e.contractType || "Vollzeit", options: ["Vollzeit", "Teilzeit", "Minijob", "Ausbildung"] },
      { key: "weeklyHours", label: "Wochenstunden", type: "number", value: e.weeklyHours || 40 },
      { key: "email", label: "E-Mail", type: "email", value: e.email },
      { key: "phone", label: "Telefon", value: e.phone },
      { key: "monthlySalary", label: "Brutto/Monat EUR", type: "number", value: e.monthlySalary || defaultSalary(e.role) },
      { key: "taxClass", label: "Steuerklasse", type: "select", value: e.taxClass || "I", options: ["I", "II", "III", "IV", "V", "VI"] },
      { key: "federalState", label: "Bundesland", type: "select", value: e.federalState || "Hessen", options: ["Hessen", "Bayern", "Baden-Württemberg", "Berlin", "Hamburg", "NRW", "Andere"] },
      { key: "healthInsurance", label: "Krankenversicherung", type: "select", value: e.healthInsurance || "Gesetzlich", options: ["Gesetzlich", "Privat"] },
      { key: "children", label: "Kinder", type: "number", value: e.children || 0 },
      { key: "churchTax", label: "Kirchensteuer", type: "select", value: e.churchTax || "Nein", options: ["Nein", "Ja"] },
      { key: "vacationDays", label: "Urlaubstage/Jahr", type: "number", value: e.vacationDays || 28 },
      { key: "status", label: "Status", type: "select", value: e.status, options: ["Aktiv", "Inaktiv", "Urlaub", "Gesperrt"] }
    ], function (data) {
      e.role = data.role || e.role;
      e.personnelNo = data.personnelNo || e.personnelNo || e.id;
      e.startDate = data.startDate || e.startDate;
      e.contractType = data.contractType || e.contractType;
      e.weeklyHours = Number(data.weeklyHours || e.weeklyHours || 40);
      e.email = data.email || e.email;
      e.phone = data.phone || e.phone;
      e.monthlySalary = Number(data.monthlySalary || e.monthlySalary || defaultSalary(e.role));
      e.taxClass = data.taxClass || e.taxClass || "I";
      e.federalState = data.federalState || e.federalState || "Hessen";
      e.healthInsurance = data.healthInsurance || e.healthInsurance || "Gesetzlich";
      e.children = Number(data.children || e.children || 0);
      e.churchTax = data.churchTax || e.churchTax || "Nein";
      e.vacationDays = Number(data.vacationDays || e.vacationDays || 28);
      e.status = data.status || e.status;
      normalizeEmployee(e);
      saveState("Mitarbeiter bearbeitet", e.name);
      render();
      toast("Mitarbeiter wurde aktualisiert.");
    });
  }

  function openEditDialog(title, fields, onSave) {
    closeEditDialog();
    var overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.id = "editDialog";
    overlay.innerHTML = '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="editDialogTitle">' +
      '<div class="modal-header"><h2 id="editDialogTitle"></h2><button class="icon-btn" type="button" data-close-dialog>&times;</button></div>' +
      '<form class="modal-body form-grid" id="editDialogForm"></form>' +
      '<div class="modal-actions"><button class="btn" type="button" data-close-dialog>Abbrechen</button><button class="btn primary" type="submit" form="editDialogForm">Speichern</button></div>' +
      '</section>';
    document.body.appendChild(overlay);
    byId("editDialogTitle").textContent = title;
    var form = byId("editDialogForm");
    fields.forEach(function (field) {
      var wrap = document.createElement("div");
      wrap.className = "field full";
      var label = document.createElement("label");
      label.textContent = field.label;
      var input;
      if (field.type === "select") {
        input = document.createElement("select");
        (field.options || []).forEach(function (option) {
          var opt = document.createElement("option");
          opt.value = option;
          opt.textContent = option;
          input.appendChild(opt);
        });
      } else if (field.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 4;
      } else {
        input = document.createElement("input");
        input.type = field.type || "text";
      }
      input.name = field.key;
      input.value = field.value == null ? "" : field.value;
      wrap.appendChild(label);
      wrap.appendChild(input);
      form.appendChild(wrap);
    });
    overlay.querySelectorAll("[data-close-dialog]").forEach(function (button) {
      button.addEventListener("click", closeEditDialog);
    });
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeEditDialog();
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = {};
      new FormData(form).forEach(function (value, key) {
        data[key] = String(value).trim();
      });
      onSave(data);
      closeEditDialog();
    });
    var firstInput = form.querySelector("input, select, textarea");
    if (firstInput) firstInput.focus();
  }

  function closeEditDialog() {
    var dialog = byId("editDialog");
    if (dialog) dialog.remove();
  }

  function createPayroll(employeeId) {
    if (!(role().admin || state.session.role === "hr")) return toast("Nur Admin oder Personal dürfen Lohnabrechnungen erstellen.");
    var employee = findById(state.employees, employeeId);
    if (!employee) return toast("Mitarbeiter wurde nicht gefunden.");
    var period = currentPayrollPeriod();
    var existing = state.payrolls.find(function (p) {
      return p.employeeId === employee.id && p.period === period;
    });
    if (!existing) {
      var calc = payrollCalculation(employee);
      existing = {
        id: nextId("LA", state.payrolls),
        date: today(),
        period: period,
        employeeId: employee.id,
        employeeName: employee.name,
        role: employee.role,
        personnelNo: employee.personnelNo || employee.id,
        taxClass: employee.taxClass,
        federalState: employee.federalState,
        healthInsurance: employee.healthInsurance,
        contractType: employee.contractType,
        weeklyHours: employee.weeklyHours,
        gross: calc.gross,
        wageTax: calc.wageTax,
        churchTax: calc.churchTax,
        soli: calc.soli,
        pensionEmployee: calc.pensionEmployee,
        unemploymentEmployee: calc.unemploymentEmployee,
        healthEmployee: calc.healthEmployee,
        careEmployee: calc.careEmployee,
        social: calc.employeeSocial,
        tax: calc.employeeTax,
        totalDeductions: calc.totalDeductions,
        net: calc.net,
        employerSocial: calc.employerSocial,
        employerTotal: calc.employerTotal,
        status: "Erstellt",
        sentAt: ""
      };
      state.payrolls.unshift(existing);
      saveState("Lohnabrechnung erstellt", existing.id + " für " + employee.name + " (" + period + ")");
    } else {
      saveState("Lohnabrechnung geöffnet", existing.id + " für " + employee.name + " (" + period + ")");
    }
    render();
    printDocument("payroll", existing.id);
  }

  function openCustomerFile(id) {
    var customer = findById(state.customers, id);
    if (!customer) return;
    var cname = customerName(customer);
    var customerInvoices = state.invoices.filter(function (i) { return i.customerName === cname; });
    var customerRequests = state.requests.filter(function (r) { return r.customerId === customer.id; });
    var customerTasks = state.tasks.filter(function (t) { return t.customerId === customer.id; });
    var customerNotes = state.notes.filter(function (n) { return n.customerId === customer.id; });
    openSideSheet("Kundenakte " + customer.id, [
      ["Name", cname],
      ["Typ", customer.type],
      ["Adresse", [customer.street, customer.zip, customer.city].filter(Boolean).join(", ") || "-"],
      ["Telefon", customer.phone || "-"],
      ["E-Mail", customer.email || "-"],
      ["Anfragen / Angebote", String(customerRequests.length)],
      ["Rechnungen", String(customerInvoices.length)],
      ["Offener Betrag", formatMoney(customerInvoices.reduce(function (sum, i) { return sum + Math.max(0, i.gross - i.paid); }, 0))],
      ["Offene Aufgaben", String(customerTasks.filter(function (t) { return t.status !== "Erledigt"; }).length)],
      ["Letzte Notizen", customerNotes.slice(0, 5).map(function (n) { return escapeHtml(n.date + ": " + n.text); }).join("<br>") || "-", true]
    ]);
  }

  function openVehicleFile(id) {
    var vehicle = findById(state.vehicles, id);
    if (!vehicle) return;
    var vehicleSales = state.sales.filter(function (s) { return s.vehicleId === vehicle.id; });
    var vehicleRequests = state.requests.filter(function (r) { return r.vehicleId === vehicle.id; });
    var vehicleTasks = state.tasks.filter(function (t) { return t.vehicleId === vehicle.id; });
    openSideSheet("Fahrzeugakte " + vehicle.id, [
      ["Fahrzeug", vehicle.brand + " " + vehicle.model],
      ["FIN", vehicle.fin],
      ["Baujahr", vehicle.year],
      ["Farbe", vehicle.color],
      ["Kilometer", Number(vehicle.km).toLocaleString("de-DE") + " km"],
      ["Preis", formatMoney(vehicle.price)],
      ["Status", vehicle.status],
      ["Anfragen / Angebote", String(vehicleRequests.length)],
      ["Aufträge", String(vehicleSales.length)],
      ["Offene Aufgaben", String(vehicleTasks.filter(function (t) { return t.status !== "Erledigt"; }).length)],
      ["Aktionen", "Kaufvertrag, Reservierung, Angebot und Aufgaben sind direkt aus der Fahrzeugliste steuerbar."]
    ]);
  }

  function lastReminderLevel(invoiceId) {
    return state.reminders.filter(function (reminder) {
      return reminder.invoiceId === invoiceId;
    }).reduce(function (max, reminder) {
      return Math.max(max, Number(reminder.level || 1));
    }, 0);
  }

  function nextReminderLevel(invoiceId) {
    return lastReminderLevel(invoiceId) + 1;
  }

  function reminderLevelLabel(level) {
    level = Number(level || 1);
    return level + ". Mahnung";
  }

  function reminderText(reminder) {
    var level = Number(reminder && reminder.level || 1);
    if (level === 1) {
      return {
        print: "Bei der Durchsicht unserer offenen Posten ist uns aufgefallen, dass die unten genannte Rechnung noch nicht vollständig ausgeglichen wurde. Bitte begleichen Sie den offenen Betrag bis zum genannten Zahlungsziel.",
        email: "bei der Durchsicht unserer Unterlagen ist uns aufgefallen, dass die unten genannte Rechnung noch offen ist. Bitte begleichen Sie den Betrag bis zum angegebenen Zahlungsziel.",
        followup: "Freundliche Zahlungserinnerung ohne zusätzliche Eskalation."
      };
    }
    if (level === 2) {
      return {
        print: "Trotz vorheriger Erinnerung ist zu der unten genannten Rechnung weiterhin ein Betrag offen. Wir bitten Sie, den offenen Betrag kurzfristig zu begleichen oder sich bei Rückfragen direkt mit unserer Finanzabteilung in Verbindung zu setzen.",
        email: "trotz vorheriger Erinnerung ist zu der unten genannten Rechnung weiterhin ein Betrag offen. Bitte begleichen Sie den Betrag kurzfristig oder kontaktieren Sie unsere Finanzabteilung.",
        followup: "Zweite Mahnstufe mit verkürzter Zahlungsfrist."
      };
    }
    return {
      print: "Dies ist die dritte und letzte Mahnung zu der unten genannten Rechnung. Sollte der offene Betrag nicht fristgerecht eingehen, behalten wir uns weitere kaufmännische und rechtliche Schritte vor.",
      email: "dies ist die dritte und letzte Mahnung zu der unten genannten Rechnung. Bitte gleichen Sie den offenen Betrag fristgerecht aus, um weitere Schritte zu vermeiden.",
      followup: "Letzte Mahnstufe vor weiterer kaufmännischer Prüfung."
    };
  }

  function createReminder(invoiceId) {
    if (!role().finance) return toast("Keine Berechtigung für Mahnungen.");
    var invoice = findById(state.invoices, invoiceId);
    if (!invoice || invoice.status === "Bezahlt") return toast("Diese Rechnung ist bereits bezahlt.");
    var level = nextReminderLevel(invoice.id);
    if (level > 3) return toast("Für diese Rechnung wurde bereits die 3. Mahnung erstellt.");
    var dueDate = addDays(level === 1 ? 7 : level === 2 ? 5 : 3);
    var reminder = {
      id: nextId("MH", state.reminders),
      invoiceId: invoice.id,
      level: level,
      date: today(),
      dueDate: dueDate,
      customerName: invoice.customerName,
      amount: Math.max(0, invoice.gross - invoice.paid),
      status: reminderLevelLabel(level),
      sentAt: ""
    };
    invoice.reminderLevel = level;
    invoice.reminderDate = today();
    state.reminders.unshift(reminder);
    saveState(reminderLevelLabel(level) + " erstellt", reminder.id + " zu " + invoice.id);
    render();
    printDocument("reminder", reminder.id);
  }

  function removeItem(collection, id, action) {
    if (!role().del) return toast("Nur Admin darf löschen.");
    if (!confirm("Eintrag wirklich löschen?")) return;
    state[collection] = state[collection].filter(function (item) { return item.id !== id; });
    saveState(action, id);
    render();
    toast("Eintrag wurde gelöscht.");
  }

  function openSideSheet(title, rows) {
    var backdrop = byId("sideSheet");
    if (!backdrop) return;
    backdrop.hidden = false;
    backdrop.innerHTML = '<aside class="side-sheet" role="dialog" aria-modal="true">' +
      '<div class="side-sheet-header"><h2></h2><button class="icon-btn" type="button" data-close-sheet>&times;</button></div>' +
      '<div class="side-sheet-body"></div></aside>';
    backdrop.querySelector("h2").textContent = title;
    var body = backdrop.querySelector(".side-sheet-body");
    rows.forEach(function (row) {
      var item = document.createElement("div");
      item.className = "fact-row";
      item.innerHTML = '<div class="fact-label">' + escapeHtml(row[0]) + '</div><div class="fact-value">' + (row[2] ? row[1] : escapeHtml(row[1])) + '</div>';
      body.appendChild(item);
    });
    backdrop.querySelector("[data-close-sheet]").addEventListener("click", closeSideSheet);
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) closeSideSheet();
    }, { once: true });
  }

  function closeSideSheet() {
    var backdrop = byId("sideSheet");
    if (!backdrop) return;
    backdrop.hidden = true;
    backdrop.textContent = "";
  }

  function fillSelects() {
    fillSelect("saleCustomer", state.customers, function (c) { return customerName(c) + " - " + c.city; });
    fillSelect("saleVehicle", state.vehicles.filter(function (v) { return v.status === "Bestand"; }), function (v) {
      return v.brand + " " + v.model + " - " + formatMoney(v.price);
    });
    fillSelect("paymentInvoice", state.invoices.filter(function (i) { return i.status !== "Bezahlt"; }), function (i) {
      return i.id + " - " + i.customerName + " - offen " + formatMoney(i.gross - i.paid);
    });
    fillSelect("noteCustomer", state.customers, function (c) { return customerName(c); });
    fillSelect("requestCustomer", state.customers, function (c) { return customerName(c) + " - " + c.city; });
    fillSelect("requestVehicle", state.vehicles, function (v) { return v.brand + " " + v.model + " - " + formatMoney(v.price); });
    fillSelect("letterCustomer", state.customers, function (c) { return customerName(c) + " - " + c.city; });
    fillSelect("taskCustomer", state.customers, function (c) { return customerName(c) + " - " + c.city; });
    fillSelect("taskVehicle", state.vehicles, function (v) { return v.brand + " " + v.model + " - " + v.fin; });
    fillSelect("ticketOwner", state.employees, function (e) { return e.name + " - " + e.role; });
    fillSelect("ticketCustomer", state.customers, function (c) { return customerName(c) + " - " + c.city; });
    fillSelect("ticketVehicle", state.vehicles, function (v) { return v.brand + " " + v.model + " - " + v.fin; });
  }

  function fillSelect(id, items, labelFn) {
    var select = byId(id);
    if (!select) return;
    var selected = select.value;
    select.textContent = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Bitte wählen";
    select.appendChild(placeholder);
    items.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.id;
      option.textContent = labelFn(item);
      select.appendChild(option);
    });
    select.value = selected;
  }

  function applyFormAccess() {
    var canEdit = role().edit;
    ["vehicleForm", "customerForm", "noteForm", "saleForm", "requestForm", "letterForm", "taskForm", "ticketForm"].forEach(function (formId) {
      setFormDisabled(formId, !canEdit);
    });
    setFormDisabled("paymentForm", !role().finance);
    setFormDisabled("employeeForm", !(role().admin || state.session.role === "hr"));
  }

  function setFormDisabled(formId, disabled) {
    var form = byId(formId);
    if (!form) return;
    Array.from(form.elements).forEach(function (el) {
      el.disabled = disabled;
    });
  }

  function documentRows() {
    return []
      .concat(state.requests.map(function (r) {
        return { docKey: "request:" + r.id, date: r.date, type: r.type, id: r.id, customerName: r.customerName, amount: r.amount, status: r.status, sentAt: r.sentAt };
      }))
      .concat(state.invoices.map(function (i) {
        return { docKey: "invoice:" + i.id, date: i.date, type: "Rechnung", id: i.id, customerName: i.customerName, amount: i.gross, status: i.status, sentAt: i.sentAt };
      }))
      .concat(state.reminders.map(function (m) {
        return { docKey: "reminder:" + m.id, date: m.date, type: reminderLevelLabel(m.level), id: m.id, customerName: m.customerName, amount: m.amount, status: m.status, sentAt: m.sentAt };
      }))
      .concat(state.payrolls.map(function (p) {
        return { docKey: "payroll:" + p.id, date: p.date, type: "Lohnabrechnung", id: p.id, customerName: p.employeeName, amount: p.net, status: p.status, sentAt: p.sentAt };
      }))
      .concat(state.letters.map(function (l) {
        return { docKey: "letter:" + l.id, date: l.date, type: "Brief", id: l.id, customerName: l.customerName, amount: 0, status: l.status, sentAt: l.sentAt };
      }))
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  function printByDocKey(key) {
    var parts = key.split(":");
    printDocument(parts[0], parts[1]);
  }

  function sendByDocKey(key) {
    var parts = key.split(":");
    sendDocument(parts[0], parts[1]);
  }

  function printDocument(type, id) {
    if (!canPrintDocument(type)) return toast("Diese Rolle darf dieses Dokument nicht drucken.");
    var html = buildDocumentHtml(type, id);
    openPrintPreview(html, type, id);
    saveState("Dokument geöffnet", type + (id ? " " + id : ""));
  }

  function openPrintPreview(html, type, id) {
    closePrintPreview();
    var overlay = document.createElement("div");
    overlay.className = "modal-backdrop print-backdrop";
    overlay.id = "printPreview";
    var modal = document.createElement("section");
    modal.className = "print-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    var header = document.createElement("div");
    header.className = "modal-header";
    var title = document.createElement("h2");
    title.textContent = "Druckvorschau";
    var close = document.createElement("button");
    close.className = "icon-btn";
    close.type = "button";
    close.innerHTML = "&times;";
    close.addEventListener("click", closePrintPreview);
    header.appendChild(title);
    header.appendChild(close);
    var frame = document.createElement("iframe");
    frame.className = "print-frame";
    frame.title = "Druckvorschau";
    frame.srcdoc = html;
    var actions = document.createElement("div");
    actions.className = "modal-actions";
    var cancel = document.createElement("button");
    cancel.className = "btn";
    cancel.type = "button";
    cancel.textContent = "Schließen";
    cancel.addEventListener("click", closePrintPreview);
    var send = document.createElement("button");
    send.className = "btn";
    send.type = "button";
    send.textContent = "E-Mail vorbereiten";
    send.hidden = !canSendDocument(type);
    send.addEventListener("click", function () {
      sendDocument(type, id);
    });
    var print = document.createElement("button");
    print.className = "btn primary";
    print.type = "button";
    print.textContent = "Drucken / PDF speichern";
    print.addEventListener("click", function () {
      if (frame.contentWindow) frame.contentWindow.print();
    });
    actions.appendChild(cancel);
    actions.appendChild(send);
    actions.appendChild(print);
    modal.appendChild(header);
    modal.appendChild(frame);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function closePrintPreview() {
    var preview = byId("printPreview");
    if (preview) preview.remove();
  }

  function sendDocument(type, id) {
    if (!canPrintDocument(type)) return toast("Diese Rolle darf dieses Dokument nicht versenden.");
    if (!canSendDocument(type)) return toast("Für dieses Dokument ist kein E-Mail-Versand vorgesehen.");
    var doc = getDocumentRecord(type, id);
    if (!doc.record) return toast("Dokument wurde nicht gefunden.");
    var customer = doc.customer || findCustomerByName(doc.record.customerName);
    var email = doc.email || (customer ? customer.email : "");
    var subject = doc.subject;
    var body = doc.body + "\n\nHinweis: Das druckbare Original können Sie in der Dokumentenansicht als PDF speichern und anhängen.";
    window.location.href = "mailto:" + encodeURIComponent(email || "") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    doc.record.sentAt = now();
    if (doc.record.status === "Entwurf") doc.record.status = "Versandbereit";
    saveState("Versand vorbereitet", subject);
    render();
    toast("E-Mail-Entwurf wurde vorbereitet.");
  }

  function canPrintDocument(type) {
    return role().print || type === "overview" || (type === "payroll" && (role().admin || state.session.role === "hr"));
  }

  function canSendDocument(type) {
    return ["invoice", "request", "reminder", "letter", "payroll"].indexOf(type) > -1;
  }

  function getDocumentRecord(type, id) {
    if (type === "invoice") {
      var invoice = findById(state.invoices, id);
      return {
        record: invoice,
        customer: findCustomerByName(invoice && invoice.customerName),
        subject: invoice ? "Rechnung " + invoice.id + " - Autohaus HESSEN GmbH" : "",
        body: invoice ? "Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unsere Rechnung " + invoice.id + " zum Fahrzeug " + invoice.vehicleName + ". Der offene Betrag beträgt " + formatMoney(Math.max(0, invoice.gross - invoice.paid)) + ".\n\nBitte begleichen Sie den Betrag bis zum " + invoice.dueDate + ".\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH" : ""
      };
    }
    if (type === "request") {
      var request = findById(state.requests, id);
      return {
        record: request,
        customer: findById(state.customers, request && request.customerId),
        subject: request ? request.type + " " + request.id + " - Autohaus HESSEN GmbH" : "",
        body: request ? "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihr Interesse. Wir senden Ihnen " + request.type.toLowerCase() + " " + request.id + " zum Fahrzeug " + request.vehicleName + ".\n\nBetrag: " + formatMoney(request.amount) + "\nGültig bis: " + request.validUntil + "\n\n" + (request.text || "Gerne stehen wir für Rückfragen und die nächsten Schritte zur Verfügung.") + "\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH" : ""
      };
    }
    if (type === "reminder") {
      var reminder = findById(state.reminders, id);
      var reminderInvoice = findById(state.invoices, reminder && reminder.invoiceId);
      var reminderTone = reminderText(reminder);
      return {
        record: reminder,
        customer: findCustomerByName(reminder && reminder.customerName),
        subject: reminder ? reminderLevelLabel(reminder.level) + " " + reminder.id + " zu Rechnung " + reminder.invoiceId : "",
        body: reminder ? "Sehr geehrte Damen und Herren,\n\n" + reminderTone.email + "\n\nRechnung: " + reminder.invoiceId + "\nFahrzeug: " + (reminderInvoice ? reminderInvoice.vehicleName : "-") + "\nOffener Betrag: " + formatMoney(reminder.amount) + "\nZahlbar bis: " + reminder.dueDate + "\n\nSollte die Zahlung bereits erfolgt sein, betrachten Sie dieses Schreiben bitte als gegenstandslos.\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH" : ""
      };
    }
    if (type === "letter") {
      var letter = findById(state.letters, id);
      return {
        record: letter,
        customer: findById(state.customers, letter && letter.customerId),
        subject: letter ? letter.subject : "",
        body: letter ? letter.body : ""
      };
    }
    if (type === "payroll") {
      var payroll = findById(state.payrolls, id);
      var employee = findById(state.employees, payroll && payroll.employeeId);
      return {
        record: payroll,
        customer: null,
        subject: payroll ? "Lohnabrechnung " + payroll.period + " - Autohaus HESSEN GmbH" : "",
        body: payroll ? "Hallo " + payroll.employeeName + ",\n\nanbei erhalten Sie die Lohnabrechnung für " + payroll.period + ".\n\nAus Datenschutzgründen sollte die finale Abrechnung nur über einen geschützten Kanal versendet werden.\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH" : "",
        email: employee ? employee.email : ""
      };
    }
    return { record: null, customer: null, subject: "", body: "" };
  }

  function previewLetter() {
    var customer = findById(state.customers, value("letterCustomer"));
    var letter = {
      id: "Vorschau",
      date: today(),
      customerId: customer ? customer.id : "",
      customerName: customer ? customerName(customer) : "Kunde",
      subject: value("letterSubject") || "Ihr Anliegen bei Autohaus HESSEN",
      body: byId("letterBody").value || letterTemplates().welcome.body(customer)
    };
    state.letters.unshift(letter);
    printDocument("letter", letter.id);
    state.letters.shift();
    saveState();
  }

  function applyLetterTemplate() {
    var templateKey = value("letterTemplate") || "welcome";
    var template = letterTemplates()[templateKey] || letterTemplates().welcome;
    var customer = findById(state.customers, value("letterCustomer"));
    byId("letterSubject").value = template.subject(customer);
    byId("letterBody").value = template.body(customer);
  }

  function letterTemplates() {
    return {
      welcome: {
        subject: function () { return "Ihr Fahrzeugwunsch bei Autohaus HESSEN"; },
        body: function (c) { return salutation(c) + "\n\nvielen Dank für Ihr Interesse an Autohaus HESSEN. Wir betreuen Sie persönlich von der Fahrzeugauswahl über Finanzierung und Zulassung bis zur professionellen Übergabe.\n\nGerne erstellen wir für Sie ein individuelles Angebot und prüfen auf Wunsch auch Inzahlungnahme, Garantiepaket und Serviceleistungen.\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH"; }
      },
      offerFollowup: {
        subject: function () { return "Rückfrage zu Ihrem Angebot"; },
        body: function (c) { return salutation(c) + "\n\nwir hoffen, unser Angebot entspricht Ihren Vorstellungen. Gerne klären wir offene Fragen zu Ausstattung, Finanzierung, Liefertermin oder Zulassung in einem kurzen persönlichen Gespräch.\n\nWenn Sie möchten, reservieren wir das Fahrzeug verbindlich für Sie und bereiten die nächsten Schritte vor.\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH"; }
      },
      appointment: {
        subject: function () { return "Bestätigung Ihres Termins"; },
        body: function (c) { return salutation(c) + "\n\nhiermit bestätigen wir Ihren Termin in unserem Autohaus. Ihr Ansprechpartner bereitet alle relevanten Unterlagen vor, damit Beratung, Probefahrt oder Fahrzeugübergabe reibungslos ablaufen.\n\nBitte bringen Sie bei einer Probefahrt Ihren Führerschein und Personalausweis mit.\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH"; }
      },
      service: {
        subject: function () { return "Information zu Service und Fahrzeugbetreuung"; },
        body: function (c) { return salutation(c) + "\n\nwir möchten, dass Ihr Fahrzeug langfristig zuverlässig bleibt. Unser Team unterstützt Sie bei Wartung, Garantie, Reifen, HU/AU und saisonalen Checks mit klaren Terminen und transparenter Kostenübersicht.\n\nGerne stimmen wir den nächsten passenden Termin mit Ihnen ab.\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH"; }
      },
      payment: {
        subject: function () { return "Freundliche Zahlungserinnerung"; },
        body: function (c) { return salutation(c) + "\n\nbei der Durchsicht unserer Unterlagen ist uns aufgefallen, dass zu einem Vorgang noch ein Betrag offen ist. Falls die Zahlung bereits erfolgt ist, betrachten Sie dieses Schreiben bitte als gegenstandslos.\n\nAndernfalls bitten wir um Ausgleich innerhalb der nächsten Tage. Bei Rückfragen helfen wir Ihnen gerne weiter.\n\nMit freundlichen Grüßen\nAutohaus HESSEN GmbH"; }
      }
    };
  }

  function buildDocumentHtml(type, id) {
    var title = "Dokument";
    var rows = [];
    var intro = "";

    if (type === "invoice") {
      var invoice = findById(state.invoices, id);
      if (!invoice) return missingDocumentHtml();
      return buildProfessionalInvoiceHtml(invoice);
    } else if (type === "request") {
      var req = findById(state.requests, id);
      if (!req) return missingDocumentHtml();
      title = req.type + " " + req.id;
      intro = req.type === "Angebot" ?
        "Vielen Dank für Ihr Interesse. Auf Basis Ihrer Anfrage erhalten Sie nachfolgend unser professionelles Fahrzeugangebot. Dieses Angebot ist bis zum genannten Datum gültig, sofern das Fahrzeug zwischenzeitlich nicht verkauft wurde." :
        "Ihre Anfrage wurde aufgenommen. Die folgenden Angaben dienen als Grundlage für Beratung, Angebotserstellung und weitere Abstimmung.";
      rows = [
        ["Kunde", req.customerName],
        ["Fahrzeug", req.vehicleName],
        ["Datum", req.date],
        ["Gültig bis", req.validUntil],
        ["Betrag", formatMoney(req.amount)],
        ["Status", req.status],
        ["Beschreibung", req.text || "Ausstattung, Konditionen und weitere Details werden im persönlichen Beratungsgespräch abgestimmt."],
        ["Nächste Schritte", req.type === "Angebot" ? "Bei Annahme bereiten wir Reservierung, Kaufvertrag, Finanzierung und Übergabe vor." : "Ein Mitarbeiter prüft Verfügbarkeit, Ausstattung, Budget und gewünschten Termin."],
        ["Unterschrift Kunde", "<br><br>______________________________<br>Ort, Datum / Unterschrift"]
      ];
    } else if (type === "reminder") {
      var rem = findById(state.reminders, id);
      if (!rem) return missingDocumentHtml();
      var remInvoice = findById(state.invoices, rem.invoiceId);
      var remText = reminderText(rem);
      title = reminderLevelLabel(rem.level) + " " + rem.id;
      intro = remText.print;
      rows = [
        ["Kunde", rem.customerName],
        ["Rechnung", rem.invoiceId],
        ["Fahrzeug", remInvoice ? remInvoice.vehicleName : "-"],
        ["Mahnstufe", reminderLevelLabel(rem.level)],
        ["Mahndatum", rem.date],
        ["Zahlbar bis", rem.dueDate || "-"],
        ["Offener Betrag", formatMoney(rem.amount)],
        ["Status", rem.status],
        ["Hinweis", remText.followup]
      ];
    } else if (type === "customer") {
      var customer = findById(state.customers, id);
      if (!customer) return missingDocumentHtml();
      title = "Kundenblatt " + customer.id;
      intro = "Kundenstammdaten und aktuelle Vertriebsnotizen.";
      rows = [
        ["Name", customerName(customer)],
        ["Typ", customer.type],
        ["Adresse", [customer.street, customer.zip, customer.city].filter(Boolean).join(", ")],
        ["Telefon", customer.phone],
        ["E-Mail", customer.email],
        ["Notizen", state.notes.filter(function (n) { return n.customerId === customer.id; }).map(function (n) { return n.date + ": " + n.text; }).join("<br>") || "-"]
      ];
    } else if (type === "vehicleContract") {
      var contractVehicle = findById(state.vehicles, id);
      if (!contractVehicle) return missingDocumentHtml();
      title = "Kaufvertrag " + contractVehicle.id;
      intro = "Kaufvertrag für ein gebrauchtes Kraftfahrzeug zwischen Autohaus HESSEN GmbH als Verkäufer und dem unten genannten Käufer. Bitte Käuferdaten, Ausweisnummer und Zahlungsart vor Unterzeichnung vollständig ergänzen.";
      rows = [
        ["Verkäufer", "Autohaus HESSEN GmbH, Musterstraße 1, 60311 Frankfurt am Main"],
        ["Käufer", "Name/Firma: ________________________________<br>Adresse: ___________________________________<br>Telefon/E-Mail: _____________________________<br>Ausweis-/Register-Nr.: ______________________"],
        ["Fahrzeug", contractVehicle.brand + " " + contractVehicle.model],
        ["FIN", contractVehicle.fin],
        ["Baujahr", contractVehicle.year],
        ["Farbe", contractVehicle.color],
        ["Kilometerstand", Number(contractVehicle.km).toLocaleString("de-DE") + " km"],
        ["Kaufpreis brutto", formatMoney(contractVehicle.price)],
        ["Anzahlung", "________________ EUR"],
        ["Restbetrag", "________________ EUR"],
        ["Zahlungsart", "Bar / Überweisung / Finanzierung"],
        ["Übergabetermin", "____.____.________ um ______ Uhr"],
        ["Unterlagen", "Zulassungsbescheinigung Teil I/II, HU/AU, Serviceheft, Fahrzeugschlüssel und sonstige vereinbarte Unterlagen werden bei Übergabe geprüft."],
        ["Vereinbarungen", "Das Fahrzeug wird im besichtigten Zustand verkauft. Zusätzliche Zusagen, Garantiepakete, Gewährleistung oder Sonderausstattung sind schriftlich im Vertrag zu ergänzen."],
        ["Unterschriften", "<br><br>______________________________<br>Ort, Datum<br><br>______________________________<br>Verkäufer<br><br>______________________________<br>Käufer"]
      ];
    } else if (type === "payroll") {
      var payroll = findById(state.payrolls, id);
      if (!payroll) return missingDocumentHtml();
      var payrollEmployee = findById(state.employees, payroll.employeeId);
      title = "Lohnabrechnung " + payroll.period;
      intro = "Monatliche Muster-Lohnabrechnung für interne Verwaltungszwecke. Für den produktiven Einsatz müssen Steuerklasse, Sozialversicherung, Zuschläge, Abwesenheiten und gesetzliche Vorgaben durch ein Lohnprogramm oder Steuerbüro geprüft werden.";
      rows = [
        ["Arbeitgeber", "Autohaus HESSEN GmbH, Musterstraße 1, 60311 Frankfurt am Main"],
        ["Mitarbeiter", payroll.employeeName],
        ["Mitarbeiter-Nr.", payroll.personnelNo || payroll.employeeId],
        ["Bereich", payroll.role],
        ["Vertrag", (payroll.contractType || "-") + " / " + (payroll.weeklyHours || "-") + " Wochenstunden"],
        ["E-Mail", payrollEmployee ? payrollEmployee.email : "-"],
        ["Steuerdaten", "Steuerklasse " + (payroll.taxClass || "-") + ", Bundesland " + (payroll.federalState || "-") + ", KV " + (payroll.healthInsurance || "-")],
        ["Abrechnungsmonat", payroll.period],
        ["Erstellt am", payroll.date],
        ["Bruttolohn", formatMoney(payroll.gross)],
        ["Lohnsteuer Muster", "- " + formatMoney(payroll.wageTax || payroll.tax || 0)],
        ["Kirchensteuer Muster", "- " + formatMoney(payroll.churchTax || 0)],
        ["Solidaritätszuschlag Muster", "- " + formatMoney(payroll.soli || 0)],
        ["Rentenversicherung AN", "- " + formatMoney(payroll.pensionEmployee || 0)],
        ["Arbeitslosenversicherung AN", "- " + formatMoney(payroll.unemploymentEmployee || 0)],
        ["Krankenversicherung AN", "- " + formatMoney(payroll.healthEmployee || 0)],
        ["Pflegeversicherung AN", "- " + formatMoney(payroll.careEmployee || 0)],
        ["Summe Abzüge", "<strong>- " + formatMoney(payroll.totalDeductions || ((payroll.tax || 0) + (payroll.social || 0))) + "</strong>"],
        ["Auszahlungsbetrag netto", "<strong>" + formatMoney(payroll.net) + "</strong>"],
        ["Arbeitgeberanteile Muster", formatMoney(payroll.employerSocial || 0)],
        ["Gesamtkosten Unternehmen", "<strong>" + formatMoney(payroll.employerTotal || payroll.gross) + "</strong>"],
        ["Status", payroll.status],
        ["Hinweis", "Musterabrechnung für interne Planung. Produktiv nur mit zertifiziertem Lohnprogramm/Steuerbüro, ELStAM, Krankenkassenmeldungen und gesetzlichen Prüfungen."],
        ["Freigabe", "<br><br>______________________________<br>Personal / Geschäftsführung"]
      ];
    } else if (type === "letter") {
      var letter = findById(state.letters, id);
      if (!letter) return missingDocumentHtml();
      title = "Brief " + letter.id;
      intro = letter.body.replace(/\n/g, "<br>");
      rows = [
        ["Kunde", letter.customerName],
        ["Datum", letter.date],
        ["Betreff", letter.subject],
        ["Status", letter.status]
      ];
    } else {
      title = "Dokumentenübersicht";
      intro = "Übersicht aller Angebote, Anfragen, Rechnungen, Mahnungen und Briefe.";
      rows = documentRows().map(function (d) {
        return [d.type + " " + d.id, d.customerName + " - " + (d.amount ? formatMoney(d.amount) + " - " : "") + d.status];
      });
    }

    return buildProfessionalDocumentHtml(title, intro, rows);
  }

  function buildProfessionalDocumentHtml(title, intro, rows) {
    return '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title>' +
      '<style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;background:#eef2f6;color:#16202d;font:13px Arial,sans-serif}.toolbar{width:210mm;margin:18px auto 10px;text-align:right}.btn{border:1px solid #0a6ed1;background:#0a6ed1;color:#fff;padding:10px 14px;border-radius:6px;font-weight:700}.sheet{width:210mm;min-height:297mm;margin:0 auto 24px;background:#fff;padding:18mm 17mm;box-shadow:0 18px 50px rgba(20,35,55,.18)}.top{display:grid;grid-template-columns:1fr 72mm;gap:16mm;align-items:start;border-bottom:4px solid #0a6ed1;padding-bottom:10mm}.brand{display:flex;gap:11px;align-items:center}.mark{width:42px;height:42px;background:#0a6ed1;color:#fff;display:grid;place-items:center;font-size:18px;font-weight:800;border-radius:6px}.brand h1{margin:0;font-size:22px;letter-spacing:0}.brand small{color:#667085}.company{color:#475467;line-height:1.55}.doc-meta{margin-top:14mm;display:grid;grid-template-columns:1fr 70mm;gap:14mm}.doc-chip{background:#f6f8fb;border:1px solid #d8e0ea;border-radius:8px;padding:12px;color:#475467;line-height:1.55}.title{margin:13mm 0 5mm;font-size:25px;letter-spacing:0}.intro{color:#475467;line-height:1.6;margin-bottom:8mm}.data{width:100%;border-collapse:collapse;border:1px solid #d8e0ea}.data tr:nth-child(even){background:#fbfcfe}.data td{border-bottom:1px solid #dde4ee;padding:11px 10px;vertical-align:top}.data tr:last-child td{border-bottom:0}.label{width:58mm;color:#667085;font-weight:800;background:#f6f8fb}.value{line-height:1.55}.closing{margin-top:12mm;display:grid;grid-template-columns:1fr 1fr;gap:22mm}.line{border-top:1px solid #1d2939;padding-top:6px;color:#667085;font-size:11px}.footer{margin-top:14mm;border-top:1px solid #dde4ee;padding-top:6mm;color:#667085;font-size:10.5px;line-height:1.45}@media print{body{background:#fff}.toolbar{display:none}.sheet{margin:0;box-shadow:none;width:auto;min-height:auto}}</style>' +
      '</head><body><div class="toolbar"><button class="btn" onclick="window.print()">Drucken / PDF speichern</button></div><main class="sheet">' +
      '<section class="top"><div class="brand"><div class="mark">AH</div><div><h1>Autohaus HESSEN GmbH</h1><small>Fahrzeughandel · Service · Finanzierung</small></div></div><div class="company">Musterstraße 1<br>60311 Frankfurt am Main<br>info@autohaus-hessen.example<br>+49 69 100200</div></section>' +
      '<section class="doc-meta"><div><h1 class="title">' + escapeHtml(title) + '</h1><p class="intro">' + String(intro) + '</p></div><div class="doc-chip"><strong>Dokument</strong><br>' + escapeHtml(title) + '<br><br><strong>Erstellt am</strong><br>' + escapeHtml(today()) + '<br><br><strong>Quelle</strong><br>Autohaus HESSEN Suite</div></section>' +
      '<table class="data"><tbody>' +
      rows.map(function (r) { return '<tr><td class="label">' + escapeHtml(r[0]) + '</td><td class="value">' + String(r[1]) + '</td></tr>'; }).join("") +
      '</tbody></table><section class="closing"><div class="line">Autohaus HESSEN GmbH</div><div class="line">Kunde / Empfänger</div></section>' +
      '<div class="footer">Dieses Dokument wurde digital aus der Autohaus HESSEN Management Suite erstellt. Für den Produktivbetrieb werden fortlaufende Nummernkreise, revisionssichere Archivierung, Rollenfreigaben und Steuerberaterfreigabe empfohlen.</div></main></body></html>';
  }

  function buildProfessionalInvoiceHtml(invoice) {
    var customer = findCustomerByName(invoice.customerName);
    var sale = findById(state.sales, invoice.saleId);
    var gross = Number(invoice.gross || 0);
    var paid = Number(invoice.paid || 0);
    var open = Math.max(0, gross - paid);
    var net = roundMoney(gross / 1.19);
    var vat = roundMoney(gross - net);
    var customerAddress = customer ? [customer.street, [customer.zip, customer.city].filter(Boolean).join(" ")].filter(Boolean).map(escapeHtml).join("<br>") : "";
    var paymentStatus = open <= 0 ? "vollständig bezahlt" : paid > 0 ? "teilbezahlt" : "offen";
    return '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Rechnung ' + escapeHtml(invoice.id) + '</title>' +
      '<style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;background:#eef2f6;color:#16202d;font:13px Arial,sans-serif}.toolbar{width:210mm;margin:18px auto 10px;text-align:right}.btn{border:1px solid #0a6ed1;background:#0a6ed1;color:#fff;padding:10px 14px;border-radius:6px;font-weight:700}.sheet{width:210mm;min-height:297mm;margin:0 auto 24px;background:#fff;padding:18mm 17mm;box-shadow:0 18px 50px rgba(20,35,55,.18)}.top{display:grid;grid-template-columns:1fr 72mm;gap:16mm;align-items:start;border-bottom:4px solid #0a6ed1;padding-bottom:10mm}.brand{display:flex;gap:11px;align-items:center}.mark{width:42px;height:42px;background:#0a6ed1;color:#fff;display:grid;place-items:center;font-size:18px;font-weight:800;border-radius:6px}.brand h1{margin:0;font-size:22px;letter-spacing:0}.brand small{color:#667085}.company{color:#475467;line-height:1.55}.meta{background:#f6f8fb;border:1px solid #d8e0ea;border-radius:8px;padding:12px}.meta-row,.total-row{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #dde4ee;padding:7px 0}.meta-row:last-child,.total-row:last-child{border-bottom:0}.label{color:#667085}.value{font-weight:800;text-align:right}.address{margin-top:16mm;display:grid;grid-template-columns:1fr 72mm;gap:16mm}.sender{font-size:10px;color:#667085;border-bottom:1px solid #cad3df;display:inline-block;margin-bottom:7px}.customer{line-height:1.55}.title{margin:15mm 0 5mm;font-size:25px;letter-spacing:0}.intro{color:#475467;line-height:1.55;margin-bottom:8mm}.items{width:100%;border-collapse:collapse}.items th{background:#172334;color:#fff;text-align:left;padding:10px 8px;font-size:12px}.items td{border-bottom:1px solid #dde4ee;padding:11px 8px;vertical-align:top}.right{text-align:right}.vehicle{font-weight:800}.small{font-size:12px;color:#667085;line-height:1.5}.summary{margin-top:8mm;margin-left:auto;width:82mm;border:1px solid #d8e0ea;border-radius:8px;padding:10px;background:#fbfcfe}.grand{font-size:18px;color:#0a6ed1}.payment{margin-top:9mm;display:grid;grid-template-columns:1fr 1fr;gap:8mm}.box{border:1px solid #d8e0ea;border-radius:8px;padding:11px;background:#fbfcfe}.box h2{margin:0 0 8px;font-size:14px}.box p{margin:0;color:#475467;line-height:1.55}.footer{margin-top:14mm;border-top:1px solid #dde4ee;padding-top:6mm;color:#667085;font-size:10.5px;line-height:1.45}.signature{margin-top:14mm;display:grid;grid-template-columns:1fr 1fr;gap:22mm}.line{border-top:1px solid #1d2939;padding-top:6px;color:#667085;font-size:11px}@media print{body{background:#fff}.toolbar{display:none}.sheet{margin:0;box-shadow:none;width:auto;min-height:auto}}</style>' +
      '</head><body><div class="toolbar"><button class="btn" onclick="window.print()">Drucken / PDF speichern</button></div><main class="sheet">' +
      '<section class="top"><div class="brand"><div class="mark">AH</div><div><h1>Autohaus HESSEN GmbH</h1><small>Fahrzeughandel · Service · Finanzierung</small></div></div><div class="company">Musterstraße 1<br>60311 Frankfurt am Main<br>info@autohaus-hessen.example<br>+49 69 100200</div></section>' +
      '<section class="address"><div><div class="sender">Autohaus HESSEN GmbH · Musterstraße 1 · 60311 Frankfurt am Main</div><div class="customer"><strong>' + escapeHtml(invoice.customerName) + '</strong><br>' + customerAddress + '</div></div><div class="meta"><div class="meta-row"><span class="label">Rechnung</span><span class="value">' + escapeHtml(invoice.id) + '</span></div><div class="meta-row"><span class="label">Datum</span><span class="value">' + escapeHtml(invoice.date) + '</span></div><div class="meta-row"><span class="label">Fällig</span><span class="value">' + escapeHtml(invoice.dueDate) + '</span></div><div class="meta-row"><span class="label">Status</span><span class="value">' + escapeHtml(invoice.status) + '</span></div></div></section>' +
      '<h1 class="title">Rechnung</h1><p class="intro">Vielen Dank für Ihr Vertrauen. Wir berechnen Ihnen gemäß Auftrag die nachfolgende Fahrzeuglieferung. Bitte verwenden Sie bei der Zahlung die Rechnungsnummer als Verwendungszweck.</p>' +
      '<table class="items"><thead><tr><th>Pos.</th><th>Beschreibung</th><th class="right">Menge</th><th class="right">Einzelpreis</th><th class="right">Gesamt</th></tr></thead><tbody><tr><td>1</td><td><div class="vehicle">' + escapeHtml(invoice.vehicleName) + '</div><div class="small">' + escapeHtml(sale && sale.note ? sale.note : "Fahrzeugverkauf laut Verkaufsauftrag") + '</div></td><td class="right">1</td><td class="right">' + formatMoney(gross) + '</td><td class="right">' + formatMoney(gross) + '</td></tr></tbody></table>' +
      '<section class="summary"><div class="total-row"><span>Nettobetrag</span><strong>' + formatMoney(net) + '</strong></div><div class="total-row"><span>Umsatzsteuer 19%</span><strong>' + formatMoney(vat) + '</strong></div><div class="total-row grand"><span>Rechnungsbetrag</span><strong>' + formatMoney(gross) + '</strong></div><div class="total-row"><span>Bereits bezahlt</span><strong>' + formatMoney(paid) + '</strong></div><div class="total-row"><span>Offener Betrag</span><strong>' + formatMoney(open) + '</strong></div></section>' +
      '<section class="payment"><div class="box"><h2>Zahlung</h2><p>Status: ' + escapeHtml(paymentStatus) + '<br>Fällig bis: ' + escapeHtml(invoice.dueDate) + '<br>Verwendungszweck: ' + escapeHtml(invoice.id) + '</p></div><div class="box"><h2>Bankverbindung</h2><p>Autohaus HESSEN GmbH<br>IBAN: DE00 0000 0000 0000 0000 00<br>BIC: AUTOHESSXXX<br>Bank: Musterbank Frankfurt</p></div></section>' +
      '<section class="signature"><div class="line">Autohaus HESSEN GmbH</div><div class="line">Kunde / Empfangsbestätigung</div></section>' +
      '<div class="footer">Geschäftsführung: Autohaus HESSEN GmbH · USt-IdNr.: DE000000000 · HRB Musterstadt 00000 · Dieses Dokument wurde digital aus der Autohaus HESSEN Management Suite erstellt. Für den Produktivbetrieb werden fortlaufende Nummernkreise, revisionssichere Archivierung und Steuerberaterfreigabe empfohlen.</div>' +
      '</main></body></html>';
  }

  function missingDocumentHtml() {
    return '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Dokument nicht gefunden</title></head><body>Dokument nicht gefunden.</body></html>';
  }

  function formData(formId) {
    var data = {};
    new FormData(byId(formId)).forEach(function (value, key) {
      data[key] = String(value).trim();
    });
    return data;
  }

  function saveState(action, detail) {
    if (action) {
      state.audit.unshift({ time: now(), action: action, detail: detail || "", role: role().label });
      state.audit = state.audit.slice(0, 100);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    syncEnterpriseState();
  }

  function enterpriseApiUrl(path) {
    if (window.location.protocol.indexOf("http") !== 0) return "";
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:4004/api" + path;
    }
    return "/api" + path;
  }

  function loadEnterpriseState() {
    var url = enterpriseApiUrl("/state");
    if (!url || !window.fetch) return;
    fetch(url, { credentials: "include" })
      .then(function (response) {
        if (!response.ok) throw new Error("ERP-API nicht verfügbar");
        return response.json();
      })
      .then(function (remoteState) {
        enterpriseBackend = "api";
        state = normalizeState(remoteState || seedState());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        if (!canView(currentView)) setView(allowedView("dashboard"));
        applyRole();
        render();
        updateRuntimeLabel();
      })
      .catch(function () {
        enterpriseBackend = "browser";
        updateRuntimeLabel();
      });
  }

  function syncEnterpriseState() {
    var url = enterpriseApiUrl("/state");
    if (enterpriseBackend !== "api" || !url || !window.fetch) return;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(function () {
      fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state)
      }).catch(function () {
        enterpriseBackend = "browser";
        updateRuntimeLabel();
      });
    }, 350);
  }

  function updateRuntimeLabel() {
    var el = byId("activeRole");
    if (!el) return;
    var suffix = enterpriseBackend === "api" ? " · ERP-API" : " · Browser-Speicher";
    if (el.textContent.indexOf(" · ERP-API") === -1 && el.textContent.indexOf(" · Browser-Speicher") === -1) {
      el.textContent = el.textContent + suffix;
      return;
    }
    el.textContent = el.textContent.replace(/ · ERP-API| · Browser-Speicher/g, "") + suffix;
  }

  function exportData() {
    if (!(role().admin || state.session.role === "owner")) return toast("Nur Admin oder Chef dürfen exportieren.");
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "autohaus-hessen-demo-daten.json";
    a.click();
    URL.revokeObjectURL(url);
    saveState("Daten exportiert", "JSON-Export wurde erstellt.");
    render();
  }

  function logoutUser(skipAudit) {
    if (!skipAudit) saveState("Abmeldung", "Benutzer hat Abmelden gewählt.");
    try {
      localStorage.removeItem("autohaus-hessen-session-last-activity");
    } catch (error) {
      // Die Cloud-Abmeldung darf nicht am lokalen Browser-Speicher scheitern.
    }
    if (window.location.hostname.indexOf("hana.ondemand.com") > -1) {
      window.location.href = "/logout";
      return;
    }
    toast("Lokale Demo: In der Cloud meldet dieser Button über SAP/BTP ab.");
  }

  function role() {
    return roles[state.session.role] || roles.admin;
  }

  function loadCloudUser() {
    if (window.location.hostname.indexOf("hana.ondemand.com") === -1) return;
    fetch("/user-api/currentUser", { credentials: "same-origin" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (user) {
        if (!user) return;
        var mappedRole = roleFromCloudUser(user);
        if (mappedRole && roles[mappedRole] && state.session.role !== mappedRole) {
          state.session.role = mappedRole;
          byId("roleSelect").value = mappedRole;
          saveState("BTP-Rolle erkannt", cloudUserName(user) + " -> " + role().label);
          if (!canView(currentView)) setView(allowedView("dashboard"));
          render();
        }
        byId("roleSelect").disabled = true;
        applyRole();
        byId("activeRole").textContent = role().label + " · " + cloudUserName(user);
        updateRuntimeLabel();
      })
      .catch(function () {
        byId("activeRole").textContent = role().label;
        updateRuntimeLabel();
      });
  }

  function roleFromCloudUser(user) {
    var scopes = (user.scopes || user.authorities || []).join(" ").toLowerCase();
    if (scopes.indexOf(".admin") > -1) return "admin";
    if (scopes.indexOf(".owner") > -1 || scopes.indexOf(".chef") > -1) return "owner";
    if (scopes.indexOf(".finance") > -1 || scopes.indexOf(".finanzen") > -1) return "finance";
    if (scopes.indexOf(".hr") > -1 || scopes.indexOf(".personal") > -1) return "hr";
    if (scopes.indexOf(".sales") > -1 || scopes.indexOf(".verkauf") > -1) return "sales";
    if (scopes.indexOf(".employee") > -1 || scopes.indexOf(".mitarbeiter") > -1) return "employee";
    return "";
  }

  function cloudUserName(user) {
    return user.email || user.mail || user.name || user.userName || "SAP Benutzer";
  }

  function canView(view) {
    return role().views.indexOf(view) > -1;
  }

  function allowedView(view) {
    if (canUseView(view)) return view;
    var scoped = context().views.find(function (candidate) { return canView(candidate); });
    if (scoped) return scoped;
    return role().views[0];
  }

  function customerName(c) {
    if (!c) return "";
    return c.company || [c.firstName, c.lastName].filter(Boolean).join(" ");
  }

  function salutation(c) {
    if (!c) return "Sehr geehrte Damen und Herren,";
    if (c.salutation === "Herr") return "Sehr geehrter Herr " + c.lastName + ",";
    if (c.salutation === "Frau") return "Sehr geehrte Frau " + c.lastName + ",";
    return "Sehr geehrte Damen und Herren,";
  }

  function findCustomerByName(name) {
    return state.customers.find(function (c) { return customerName(c) === name; });
  }

  function noteCount(customerId) {
    return state.notes.filter(function (n) { return n.customerId === customerId; }).length;
  }

  function findById(items, id) {
    return items.find(function (item) { return item.id === id; });
  }

  function nextId(prefix, items) {
    var base = prefix === "FZ" ? 1000 : prefix === "KD" ? 2000 : prefix === "RG" ? 3000 : prefix === "MA" ? 4000 : prefix === "AU" ? 5000 : prefix === "NT" ? 6000 : prefix === "AN" ? 7000 : prefix === "AG" ? 8000 : prefix === "BR" ? 10000 : prefix === "LA" ? 11000 : prefix === "TK" ? 12000 : prefix === "TS" ? 13000 : 9000;
    var max = items.reduce(function (m, item) {
      var n = Number(String(item.id || "").replace(/[^0-9]/g, ""));
      return Math.max(m, n);
    }, base);
    return prefix + "-" + String(max + 1);
  }

  function defaultSalary(area) {
    if (area === "Geschäftsführung") return 6500;
    if (area === "Finanzen") return 3900;
    if (area === "Verkauf") return 3600;
    if (area === "Service") return 3300;
    if (area === "Einkauf") return 3500;
    return 3200;
  }

  function currentPayrollPeriod() {
    var d = new Date();
    return String(d.getFullYear()) + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  function payrollCalculation(employee) {
    var gross = Number(employee.monthlySalary || defaultSalary(employee.role));
    if (employee.contractType === "Minijob") {
      return minijobCalculation(gross);
    }
    var wageTax = estimateWageTax(gross, employee.taxClass);
    var churchTax = employee.churchTax === "Ja" ? roundMoney(wageTax * churchTaxRate(employee.federalState)) : 0;
    var soli = wageTax > 1400 ? roundMoney(wageTax * 0.055) : 0;
    var pensionEmployee = roundMoney(gross * 0.093);
    var unemploymentEmployee = roundMoney(gross * 0.013);
    var healthEmployee = employee.healthInsurance === "Privat" ? 0 : roundMoney(gross * 0.0815);
    var careEmployee = roundMoney(gross * (Number(employee.children || 0) > 0 ? 0.017 : 0.023));
    var employeeSocial = roundMoney(pensionEmployee + unemploymentEmployee + healthEmployee + careEmployee);
    var employeeTax = roundMoney(wageTax + churchTax + soli);
    var totalDeductions = roundMoney(employeeSocial + employeeTax);
    var pensionEmployer = roundMoney(gross * 0.093);
    var unemploymentEmployer = roundMoney(gross * 0.013);
    var healthEmployer = employee.healthInsurance === "Privat" ? roundMoney(Math.min(gross * 0.0815, 421.76)) : roundMoney(gross * 0.0815);
    var careEmployer = roundMoney(gross * 0.017);
    var accidentInsurance = roundMoney(gross * 0.012);
    var insolvencyLevy = roundMoney(gross * 0.0006);
    var employerSocial = roundMoney(pensionEmployer + unemploymentEmployer + healthEmployer + careEmployer + accidentInsurance + insolvencyLevy);
    return {
      gross: roundMoney(gross),
      wageTax: wageTax,
      churchTax: churchTax,
      soli: soli,
      employeeTax: employeeTax,
      pensionEmployee: pensionEmployee,
      unemploymentEmployee: unemploymentEmployee,
      healthEmployee: healthEmployee,
      careEmployee: careEmployee,
      employeeSocial: employeeSocial,
      totalDeductions: totalDeductions,
      net: roundMoney(Math.max(0, gross - totalDeductions)),
      pensionEmployer: pensionEmployer,
      unemploymentEmployer: unemploymentEmployer,
      healthEmployer: healthEmployer,
      careEmployer: careEmployer,
      accidentInsurance: accidentInsurance,
      insolvencyLevy: insolvencyLevy,
      employerSocial: employerSocial,
      employerTotal: roundMoney(gross + employerSocial)
    };
  }

  function minijobCalculation(gross) {
    var employerPension = roundMoney(gross * 0.15);
    var employerHealth = roundMoney(gross * 0.13);
    var flatTax = roundMoney(gross * 0.02);
    var levies = roundMoney(gross * 0.014);
    var employerSocial = roundMoney(employerPension + employerHealth + flatTax + levies);
    return {
      gross: roundMoney(gross),
      wageTax: 0,
      churchTax: 0,
      soli: 0,
      employeeTax: 0,
      pensionEmployee: 0,
      unemploymentEmployee: 0,
      healthEmployee: 0,
      careEmployee: 0,
      employeeSocial: 0,
      totalDeductions: 0,
      net: roundMoney(gross),
      pensionEmployer: employerPension,
      unemploymentEmployer: 0,
      healthEmployer: employerHealth,
      careEmployer: 0,
      accidentInsurance: levies,
      insolvencyLevy: flatTax,
      employerSocial: employerSocial,
      employerTotal: roundMoney(gross + employerSocial)
    };
  }

  function estimateWageTax(gross, taxClass) {
    var annual = gross * 12;
    var allowance = taxClass === "III" ? 23500 : taxClass === "II" ? 14500 : taxClass === "V" || taxClass === "VI" ? 0 : 11750;
    var taxable = Math.max(0, annual - allowance);
    var annualTax = 0;
    if (taxable <= 12000) annualTax = taxable * 0.14;
    else if (taxable <= 45000) annualTax = 1680 + (taxable - 12000) * 0.24;
    else if (taxable <= 70000) annualTax = 9600 + (taxable - 45000) * 0.32;
    else annualTax = 17600 + (taxable - 70000) * 0.42;
    if (taxClass === "V") annualTax *= 1.18;
    if (taxClass === "VI") annualTax *= 1.32;
    return roundMoney(Math.max(0, annualTax / 12));
  }

  function churchTaxRate(federalState) {
    return federalState === "Bayern" || federalState === "Baden-Württemberg" ? 0.08 : 0.09;
  }

  function roundMoney(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function statusBadge(status) {
    var cls = status === "Bestand" || status === "Bezahlt" || status === "Aktiv" || status === "Versandbereit" || status === "Erledigt" ? "good" :
      status === "Reserviert" || status === "Teilbezahlt" || status === "Auftrag" || status === "Erstellt" || status === "Entwurf" || status === "In Arbeit" || status === "1. Mahnung" ? "warn" :
      status === "Offen" || status === "2. Mahnung" || status === "3. Mahnung" ? "bad" : "info";
    return { html: '<span class="status ' + cls + '">' + escapeHtml(status) + "</span>" };
  }

  function priorityBadge(priority) {
    var cls = priority === "Hoch" ? "bad" : priority === "Niedrig" ? "info" : "warn";
    return { html: '<span class="status ' + cls + '">' + escapeHtml(priority || "Normal") + "</span>" };
  }

  function actions(items) {
    return items.filter(function (item) { return item[4] !== false; }).map(function (item) {
      return actionButtonHtml(item[0], item[1], item[2], item[3]);
    }).join("");
  }

  function actionButtonHtml(label, action, id, tone) {
    return '<button class="btn ' + (tone || "") + '" data-action="' + action + '" data-id="' + escapeHtml(id) + '">' + escapeHtml(label) + "</button>";
  }

  function moneyCell(value) {
    return { html: '<span class="money">' + formatMoney(value) + "</span>" };
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  }

  function today() {
    return new Date().toISOString().split("T")[0];
  }

  function addDays(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  function now() {
    return new Date().toLocaleString("de-DE");
  }

  function value(id) {
    return byId(id).value || "";
  }

  function setText(id, text) {
    byId(id).textContent = text;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function toast(message) {
    var el = byId("toast");
    el.textContent = message;
    el.classList.add("show");
    window.setTimeout(function () { el.classList.remove("show"); }, 2400);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }
}());

