"use strict";

const http = require("node:http");
const { existsSync } = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
let hanaClient = null;

try {
  hanaClient = require("@sap/hana-client");
} catch (error) {
  hanaClient = null;
}

const PORT = Number(process.env.PORT || 4004);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "erp-state.json");
const COLLECTION_ORDER = [
  "vehicles",
  "customers",
  "sales",
  "invoices",
  "requests",
  "letters",
  "notes",
  "employees",
  "payrolls",
  "tasks",
  "tickets",
  "reminders",
  "audit"
];
const COLLECTIONS = new Set(COLLECTION_ORDER);
const SYSTEM_TABLE = "ERP_SYSTEM_STATE";
const LEGACY_STATE_TABLE = "ERP_STATE";
const COLLECTION_TABLES = {
  vehicles: "ERP_VEHICLES",
  customers: "ERP_CUSTOMERS",
  sales: "ERP_SALES",
  invoices: "ERP_INVOICES",
  requests: "ERP_REQUESTS",
  letters: "ERP_LETTERS",
  notes: "ERP_NOTES",
  employees: "ERP_EMPLOYEES",
  payrolls: "ERP_PAYROLLS",
  tasks: "ERP_TASKS",
  tickets: "ERP_TICKETS",
  reminders: "ERP_REMINDERS",
  audit: "ERP_AUDIT_LOG"
};

const REQUIRED_FIELDS = {
  vehicles: ["fin", "brand", "model"],
  customers: ["lastName", "email"],
  employees: ["name", "email"],
  invoices: ["id", "customerName", "gross"],
  tasks: ["title", "dueDate"],
  tickets: ["title", "area"]
};

function seedState() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    version: 5,
    enterprise: {
      system: "Autohaus HESSEN ERP Core",
      storage: "Node ERP API",
      createdAt: new Date().toISOString()
    },
    session: { role: "admin" },
    vehicles: [
      { id: "FZ-1001", fin: "WVWZZZCDZRW100142", brand: "Volkswagen", model: "Golf 8 Variant", year: 2024, color: "Graphitgrau", km: 12400, price: 28900, status: "Bestand" },
      { id: "FZ-1002", fin: "WBA5A71090FN22133", brand: "BMW", model: "530e Touring", year: 2023, color: "Alpinweiss", km: 18200, price: 48900, status: "Reserviert" }
    ],
    customers: [
      { id: "KD-2001", type: "Privat", salutation: "Herr", firstName: "Mehmet", lastName: "Yilmaz", company: "", street: "Mainzer Landstr. 21", zip: "60329", city: "Frankfurt", phone: "+49 69 441122", email: "mehmet.yilmaz@example.de", notes: [] },
      { id: "KD-2002", type: "Gewerbe", salutation: "Firma", firstName: "", lastName: "Hessen Logistik GmbH", company: "Hessen Logistik GmbH", street: "Industriestr. 8", zip: "63065", city: "Offenbach", phone: "+49 69 778899", email: "einkauf@hessen-logistik.example", notes: [] }
    ],
    sales: [],
    invoices: [
      { id: "RG-3001", saleId: "ALT-1", customerName: "Hessen Logistik GmbH", vehicleName: "BMW 530e Touring", date: today, dueDate: today, gross: 48900, paid: 10000, status: "Teilbezahlt", sentAt: "" }
    ],
    employees: [
      { id: "MA-4001", personnelNo: "P-1001", name: "Sara Becker", role: "Verkauf", email: "s.becker@autohaus-hessen.example", phone: "+49 69 100200", monthlySalary: 3600, taxClass: "I", federalState: "Hessen", healthInsurance: "Gesetzlich", children: 0, churchTax: "Nein", contractType: "Vollzeit", weeklyHours: 40, vacationDays: 28, startDate: today, status: "Aktiv" }
    ],
    notes: [],
    requests: [],
    reminders: [],
    payrolls: [],
    tasks: [
      { id: "TK-12001", type: "Aufgabe", dueDate: today, time: "10:00", area: "Verkauf", priority: "Hoch", title: "Angebot nachfassen", customerId: "KD-2001", customerName: "Mehmet Yilmaz", vehicleId: "FZ-1001", vehicleName: "Volkswagen Golf 8 Variant", note: "Finanzierung und Inzahlungnahme ansprechen.", status: "Offen" }
    ],
    tickets: [
      { id: "TS-13001", createdAt: today, dueDate: today, area: "Service", priority: "Hoch", title: "Werkstattfreigabe klären", ownerId: "MA-4001", ownerName: "Sara Becker", customerId: "", customerName: "", vehicleId: "FZ-1001", vehicleName: "Volkswagen Golf 8 Variant", description: "Status, HU/AU und Aufbereitung prüfen.", status: "Offen" }
    ],
    letters: [],
    audit: [
      { time: new Date().toLocaleString("de-DE"), action: "ERP-API initialisiert", detail: "Zentrale Datenhaltung wurde vorbereitet.", role: "System" }
    ]
  };
}

async function readState() {
  if (hanaConfigured()) {
    try {
      return await readStateFromHana();
    } catch (error) {
      console.error("HANA read failed, using file fallback:", error.message);
    }
  }
  if (!existsSync(DATA_FILE)) {
    const initial = normalizeState(seedState());
    await writeState(initial);
    return initial;
  }
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return normalizeState(JSON.parse(raw));
}

async function writeState(state) {
  if (hanaConfigured()) {
    try {
      return await writeStateToHana(state);
    } catch (error) {
      console.error("HANA write failed, using file fallback:", error.message);
    }
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const normalized = normalizeState(state);
  const tmpFile = DATA_FILE + ".tmp";
  await fs.writeFile(tmpFile, JSON.stringify(normalized, null, 2));
  await fs.rename(tmpFile, DATA_FILE);
  return normalized;
}

function hanaConfigured() {
  return Boolean(hanaClient && hanaCredentials());
}

function hanaCredentials() {
  const services = JSON.parse(process.env.VCAP_SERVICES || "{}");
  const entries = Object.keys(services).flatMap(key => services[key] || []);
  const hana = entries.find(service => {
    const tags = service.tags || [];
    return service.label === "hana" || service.name === "autohaus-hessen-schema" || tags.includes("hana");
  });
  return hana && hana.credentials ? hana.credentials : null;
}

function hanaConnect() {
  const credentials = hanaCredentials();
  return new Promise((resolve, reject) => {
    if (!hanaClient || !credentials) return reject(new Error("HANA ist nicht konfiguriert."));
    const connection = hanaClient.createConnection();
    const options = {
      serverNode: credentials.host + ":" + credentials.port,
      uid: credentials.user,
      pwd: credentials.password,
      encrypt: "true",
      sslValidateCertificate: credentials.certificate ? "true" : "false"
    };
    if (credentials.certificate) {
      options.sslTrustStore = credentials.certificate;
    }
    connection.connect(options, error => {
      if (error) return reject(error);
      resolve(connection);
    });
  });
}

function hanaExec(connection, sql, params) {
  return new Promise((resolve, reject) => {
    connection.exec(sql, params || [], (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

async function withHana(work) {
  const connection = await hanaConnect();
  try {
    return await work(connection);
  } finally {
    connection.disconnect();
  }
}

async function ensureHanaTables(connection) {
  if (!(await hanaTableExists(connection, SYSTEM_TABLE))) {
    await hanaExec(connection, "CREATE COLUMN TABLE " + SYSTEM_TABLE + " (ID NVARCHAR(80) PRIMARY KEY, PAYLOAD NCLOB, UPDATED_AT TIMESTAMP, UPDATED_BY NVARCHAR(255))");
  }
  for (const tableName of Object.values(COLLECTION_TABLES)) {
    if (!(await hanaTableExists(connection, tableName))) {
      await hanaExec(connection, "CREATE COLUMN TABLE " + tableName + " (ID NVARCHAR(80) PRIMARY KEY, PAYLOAD NCLOB, CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UPDATED_AT TIMESTAMP, UPDATED_BY NVARCHAR(255))");
    }
  }
}

async function hanaTableExists(connection, tableName) {
  const rows = await hanaExec(connection, "SELECT TABLE_NAME FROM TABLES WHERE SCHEMA_NAME = CURRENT_SCHEMA AND TABLE_NAME = ?", [tableName]);
  return rows.length > 0;
}

async function readStateFromHana() {
  return withHana(async connection => {
    await ensureHanaTables(connection);
    const normalizedState = await readNormalizedStateFromHana(connection);
    if (normalizedState) return normalizedState;

    const legacyState = await readLegacyStateFromHana(connection);
    if (legacyState) {
      await writeNormalizedStateToHana(connection, legacyState);
      return legacyState;
    }

    const initial = normalizeState(seedState());
    await writeNormalizedStateToHana(connection, initial);
    return initial;
  });
}

async function writeStateToHana(state) {
  const normalized = normalizeState(state);
  return withHana(async connection => {
    await ensureHanaTables(connection);
    await writeNormalizedStateToHana(connection, normalized);
    return normalized;
  });
}

async function readNormalizedStateFromHana(connection) {
  const systemRows = await hanaExec(connection, "SELECT PAYLOAD FROM " + SYSTEM_TABLE + " WHERE ID = ?", ["main"]);
  const systemPayload = systemRows.length ? parsePayload(systemRows[0].PAYLOAD) : null;
  const collections = {};
  let rowCount = 0;

  for (const collection of COLLECTION_ORDER) {
    const tableName = COLLECTION_TABLES[collection];
    const rows = await hanaExec(connection, "SELECT PAYLOAD FROM " + tableName + " ORDER BY ID");
    collections[collection] = rows.map(row => parsePayload(row.PAYLOAD));
    rowCount += rows.length;
  }

  if (!systemPayload && rowCount === 0) return null;
  return normalizeState({
    ...(systemPayload || { version: 5, enterprise: seedState().enterprise, session: { role: "admin" } }),
    ...collections
  });
}

async function readLegacyStateFromHana(connection) {
  if (!(await hanaTableExists(connection, LEGACY_STATE_TABLE))) return null;
  const rows = await hanaExec(connection, "SELECT PAYLOAD FROM " + LEGACY_STATE_TABLE + " WHERE ID = ?", ["main"]);
  if (!rows.length) return null;
  return normalizeState(parsePayload(rows[0].PAYLOAD));
}

async function writeNormalizedStateToHana(connection, state) {
  await writeSystemPayload(connection, state);
  for (const collection of COLLECTION_ORDER) {
    await replaceCollection(connection, collection, state[collection] || []);
  }
}

async function writeSystemPayload(connection, state) {
  const payload = JSON.stringify(systemPayload(state));
  const rows = await hanaExec(connection, "SELECT ID FROM " + SYSTEM_TABLE + " WHERE ID = ?", ["main"]);
  if (rows.length) {
    await hanaExec(connection, "UPDATE " + SYSTEM_TABLE + " SET PAYLOAD = ?, UPDATED_AT = CURRENT_TIMESTAMP, UPDATED_BY = ? WHERE ID = ?", [payload, "Autohaus HESSEN API", "main"]);
    return;
  }
  await hanaExec(connection, "INSERT INTO " + SYSTEM_TABLE + " (ID, PAYLOAD, UPDATED_AT, UPDATED_BY) VALUES (?, ?, CURRENT_TIMESTAMP, ?)", ["main", payload, "Autohaus HESSEN API"]);
}

async function replaceCollection(connection, collection, items) {
  const tableName = COLLECTION_TABLES[collection];
  await hanaExec(connection, "DELETE FROM " + tableName);
  for (let index = 0; index < items.length; index += 1) {
    const item = { ...items[index] };
    item.id = item.id || fallbackItemId(collection, index);
    await hanaExec(connection, "INSERT INTO " + tableName + " (ID, PAYLOAD, UPDATED_AT, UPDATED_BY) VALUES (?, ?, CURRENT_TIMESTAMP, ?)", [String(item.id), JSON.stringify(item), "Autohaus HESSEN API"]);
  }
}

function systemPayload(state) {
  const payload = { ...state };
  for (const collection of COLLECTION_ORDER) {
    delete payload[collection];
  }
  return payload;
}

function fallbackItemId(collection, index) {
  const prefix = {
    vehicles: "FZ",
    customers: "KD",
    sales: "AU",
    invoices: "RG",
    requests: "AN",
    letters: "BR",
    notes: "NT",
    employees: "MA",
    payrolls: "LA",
    tasks: "TK",
    tickets: "TS",
    reminders: "RM",
    audit: "LG"
  }[collection] || "ERP";
  return prefix + "-AUTO-" + String(index + 1).padStart(5, "0");
}

function parsePayload(payload) {
  return JSON.parse(String(payload || "{}"));
}

async function storageHealth() {
  if (!hanaConfigured()) {
    return { storage: "Dateispeicher", connected: true };
  }
  try {
    await withHana(async connection => {
      await ensureHanaTables(connection);
    });
    return { storage: "SAP HANA Cloud", connected: true, model: "normalized", tables: Object.keys(COLLECTION_TABLES).length + 1 };
  } catch (error) {
    return { storage: "SAP HANA Cloud", connected: false, message: error.message };
  }
}

function normalizeState(state) {
  const data = state && typeof state === "object" ? state : seedState();
  data.version = 5;
  data.session = data.session || { role: "admin" };
  data.vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
  data.customers = Array.isArray(data.customers) ? data.customers : [];
  data.sales = Array.isArray(data.sales) ? data.sales : [];
  data.invoices = Array.isArray(data.invoices) ? data.invoices : [];
  data.requests = Array.isArray(data.requests) ? data.requests : [];
  data.reminders = Array.isArray(data.reminders) ? data.reminders : [];
  data.letters = Array.isArray(data.letters) ? data.letters : [];
  data.notes = Array.isArray(data.notes) ? data.notes : [];
  data.employees = Array.isArray(data.employees) ? data.employees : [];
  data.payrolls = Array.isArray(data.payrolls) ? data.payrolls : [];
  data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
  data.tickets = Array.isArray(data.tickets) ? data.tickets : [];
  data.audit = Array.isArray(data.audit) ? data.audit : [];
  return data;
}

function corsHeaders(req) {
  const origin = req.headers.origin || "";
  const allowedOrigin = origin && /^(https:\/\/.*\.hana\.ondemand\.com|http:\/\/localhost:\d+|http:\/\/127\.0\.0\.1:\d+)$/.test(origin)
    ? origin
    : "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Vary": "Origin"
  };
}

function send(req, res, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...securityHeaders(),
    ...corsHeaders(req)
  });
  res.end(payload);
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 8 * 1024 * 1024) {
        reject(new Error("Nutzlast ist zu groß."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("JSON konnte nicht gelesen werden."));
      }
    });
    req.on("error", reject);
  });
}

function requireAuth(req) {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.REQUIRE_AUTH === "false") return true;
  const token = bearerToken(req);
  if (!token) return false;
  try {
    req.authUser = verifyJwt(token);
    return true;
  } catch (error) {
    return false;
  }
}

function userName(req) {
  if (req.authUser) {
    return req.authUser.email || req.authUser.user_name || req.authUser.name || "SAP/BTP Benutzer";
  }
  return req.headers["x-forwarded-email"] || req.headers["x-forwarded-user"] || "SAP/BTP Benutzer";
}

function authScopes(req) {
  const user = req.authUser || {};
  const values = []
    .concat(user.scope || [])
    .concat(user.scopes || [])
    .concat(user.authorities || []);
  return values.filter(Boolean).map(value => String(value));
}

function canUseAdminEndpoint(req) {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.REQUIRE_AUTH === "false") return true;
  const scopes = authScopes(req).join(" ").toLowerCase();
  if (!scopes) return true;
  return [".admin", ".owner", ".chef"].some(scope => scopes.includes(scope));
}

function bearerToken(req) {
  const header = req.headers.authorization || req.headers["x-approuter-authorization"] || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function verifyJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Token ist unvollständig.");
  const header = parseJwtPart(parts[0]);
  const payload = parseJwtPart(parts[1]);
  if (header.alg !== "RS256") throw new Error("Token-Algorithmus wird nicht akzeptiert.");
  if (!payload.exp || payload.exp * 1000 < Date.now()) throw new Error("Token ist abgelaufen.");
  const publicKey = xsuaaVerificationKey();
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(parts[0] + "." + parts[1]);
  verifier.end();
  const signature = Buffer.from(parts[2].replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (!verifier.verify(publicKey, signature)) throw new Error("Token-Signatur ist ungültig.");
  return payload;
}

function parseJwtPart(part) {
  return JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
}

function xsuaaVerificationKey() {
  const credentials = xsuaaCredentials();
  const key = credentials.verificationkey || credentials.verificationKey || "";
  if (!key) throw new Error("XSUAA-Prüfschlüssel fehlt.");
  return key.replace(/\\n/g, "\n");
}

function xsuaaCredentials() {
  const services = JSON.parse(process.env.VCAP_SERVICES || "{}");
  const entries = Object.keys(services).flatMap(key => services[key] || []);
  const xsuaa = entries.find(service => {
    const tags = service.tags || [];
    return service.label === "xsuaa" || service.name === "autohaus-hessen-xsuaa" || tags.includes("xsuaa");
  });
  if (!xsuaa || !xsuaa.credentials) throw new Error("XSUAA-Servicebindung fehlt.");
  return xsuaa.credentials;
}

function validateCollectionItem(collection, item) {
  const required = REQUIRED_FIELDS[collection] || [];
  const missing = required.filter(field => item[field] === undefined || item[field] === "");
  if (missing.length) {
    const error = new Error("Pflichtfelder fehlen: " + missing.join(", "));
    error.status = 400;
    throw error;
  }
}

function nextId(collection, items) {
  const prefixes = {
    vehicles: "FZ",
    customers: "KD",
    sales: "AU",
    invoices: "RG",
    requests: "AN",
    letters: "BR",
    notes: "NT",
    employees: "MA",
    payrolls: "LA",
    tasks: "TK",
    tickets: "TS"
  };
  const prefix = prefixes[collection] || "ERP";
  const max = items.reduce((current, item) => {
    const number = Number(String(item.id || "").replace(/\D/g, ""));
    return Math.max(current, number || 0);
  }, 1000);
  return prefix + "-" + String(max + 1);
}

function audit(state, req, action, detail) {
  state.audit.unshift({
    time: new Date().toLocaleString("de-DE"),
    action,
    detail,
    role: userName(req)
  });
  state.audit = state.audit.slice(0, 500);
}

function collectionCounts(state) {
  return COLLECTION_ORDER.reduce((counts, collection) => {
    counts[collection] = Array.isArray(state[collection]) ? state[collection].length : 0;
    return counts;
  }, {});
}

function businessSummary(state, storage, req) {
  const counts = collectionCounts(state);
  const openInvoices = state.invoices.filter(invoice => invoice.status !== "Bezahlt");
  const openTasks = state.tasks.filter(task => task.status !== "Erledigt");
  const openTickets = state.tickets.filter(ticket => ticket.status !== "Erledigt");
  const inventoryValue = state.vehicles
    .filter(vehicle => vehicle.status !== "Verkauft")
    .reduce((sum, vehicle) => sum + Number(vehicle.price || 0), 0);
  const paidRevenue = state.invoices.reduce((sum, invoice) => sum + Number(invoice.paid || 0), 0);
  const openInvoiceAmount = openInvoices.reduce((sum, invoice) => {
    return sum + Math.max(0, Number(invoice.gross || 0) - Number(invoice.paid || 0));
  }, 0);
  const scopes = authScopes(req);
  return {
    system: "Autohaus HESSEN ERP Core",
    time: new Date().toISOString(),
    user: userName(req),
    roleSource: scopes.length ? "BTP-Rollensammlungen" : "BTP-Login ohne gelesene Scopes",
    storage: storage.storage,
    database: storage.connected ? "connected" : "degraded",
    dataModel: storage.model || "local",
    tableCount: storage.tables || 0,
    tables: [SYSTEM_TABLE].concat(Object.values(COLLECTION_TABLES)),
    counts,
    finance: {
      openInvoices: openInvoices.length,
      openInvoiceAmount,
      paidRevenue,
      inventoryValue
    },
    workflow: {
      openTasks: openTasks.length,
      openTickets: openTickets.length
    },
    readiness: readinessItems(storage, counts, scopes)
  };
}

function readinessItems(storage, counts, scopes) {
  const hanaReady = storage.storage === "SAP HANA Cloud" && storage.connected;
  return [
    {
      label: "SAP/BTP Login",
      status: "good",
      text: "Zugriff läuft über AppRouter und BTP-Anmeldung."
    },
    {
      label: "SAP HANA Cloud",
      status: hanaReady ? "good" : "warn",
      text: hanaReady ? "Zentrale Datenbank ist verbunden." : "Datenbank prüfen oder Verbindung wiederherstellen."
    },
    {
      label: "Normalisiertes Tabellenmodell",
      status: storage.model === "normalized" ? "good" : "warn",
      text: storage.model === "normalized" ? "ERP-Bereiche liegen in getrennten HANA-Tabellen." : "Lokaler Fallback oder altes Modell aktiv."
    },
    {
      label: "BTP-Rollen",
      status: scopes.length ? "good" : "warn",
      text: scopes.length ? "Benutzerrechte werden aus BTP-Scopes gelesen." : "Rollensammlungen in BTP weiter pflegen."
    },
    {
      label: "Audit-Protokoll",
      status: counts.audit > 0 ? "good" : "warn",
      text: counts.audit > 0 ? "Änderungen werden protokolliert." : "Noch keine Protokolleinträge vorhanden."
    },
    {
      label: "Datensicherung",
      status: "warn",
      text: "Manueller Backup-Export ist verfügbar. Für Produktion zusätzlich automatische Sicherung planen."
    }
  ];
}

function backupPayload(state, storage, req) {
  const data = normalizeState(JSON.parse(JSON.stringify(state)));
  const checksum = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  return {
    exportType: "AUTOHAUS_HESSEN_ERP_BACKUP",
    version: data.version,
    exportedAt: new Date().toISOString(),
    exportedBy: userName(req),
    storage: storage.storage,
    dataModel: storage.model || "local",
    checksum,
    data
  };
}

async function handleApi(req, res) {
  const url = new URL(req.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[1];
  const id = decodeURIComponent(parts[2] || "");

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  if (url.pathname === "/api/health") {
    const storage = await storageHealth();
    send(req, res, storage.connected ? 200 : 503, {
      status: storage.connected ? "ok" : "degraded",
      system: "Autohaus HESSEN ERP Core",
      storage: storage.storage,
      database: storage.connected ? "connected" : "not connected",
      dataModel: storage.model || "local",
      tables: storage.tables || 0,
      message: storage.connected ? "Datenbank bereit" : storage.message,
      time: new Date().toISOString()
    });
    return;
  }

  if (!requireAuth(req)) {
    send(req, res, 401, { error: "Nicht angemeldet. Zugriff nur über SAP/BTP AppRouter." });
    return;
  }

  const state = await readState();

  if (url.pathname === "/api/admin/summary" && req.method === "GET") {
    if (!canUseAdminEndpoint(req)) {
      send(req, res, 403, { error: "Nur Admin oder Chef dürfen den Systembetrieb einsehen." });
      return;
    }
    const storage = await storageHealth();
    send(req, res, 200, businessSummary(state, storage, req));
    return;
  }

  if (url.pathname === "/api/admin/backup" && req.method === "GET") {
    if (!canUseAdminEndpoint(req)) {
      send(req, res, 403, { error: "Nur Admin oder Chef dürfen Backups erstellen." });
      return;
    }
    audit(state, req, "Datensicherung erstellt", "Vollständiger ERP-Datenexport wurde heruntergeladen.");
    const stored = await writeState(state);
    const storage = await storageHealth();
    send(req, res, 200, backupPayload(stored, storage, req));
    return;
  }

  if (url.pathname === "/api/state" && req.method === "GET") {
    send(req, res, 200, state);
    return;
  }

  if (url.pathname === "/api/state" && req.method === "PUT") {
    const body = await readBody(req);
    const next = normalizeState(body);
    audit(next, req, "ERP-Daten synchronisiert", "Die Oberfläche hat den zentralen Datenstand aktualisiert.");
    send(req, res, 200, await writeState(next));
    return;
  }

  if (!COLLECTIONS.has(resource)) {
    send(req, res, 404, { error: "Unbekannter ERP-Bereich." });
    return;
  }

  if (req.method === "GET") {
    send(req, res, 200, state[resource]);
    return;
  }

  if (req.method === "POST") {
    const item = await readBody(req);
    item.id = item.id || nextId(resource, state[resource]);
    validateCollectionItem(resource, item);
    state[resource].push(item);
    audit(state, req, "Datensatz angelegt", resource + " " + item.id);
    send(req, res, 201, await writeState(state));
    return;
  }

  const index = state[resource].findIndex(item => String(item.id) === id);
  if (index === -1) {
    send(req, res, 404, { error: "Datensatz wurde nicht gefunden." });
    return;
  }

  if (req.method === "PUT") {
    const body = await readBody(req);
    const item = { ...state[resource][index], ...body, id };
    validateCollectionItem(resource, item);
    state[resource][index] = item;
    audit(state, req, "Datensatz geändert", resource + " " + id);
    send(req, res, 200, await writeState(state));
    return;
  }

  if (req.method === "DELETE") {
    state[resource].splice(index, 1);
    audit(state, req, "Datensatz gelöscht", resource + " " + id);
    send(req, res, 200, await writeState(state));
    return;
  }

  send(req, res, 405, { error: "Methode nicht erlaubt." });
}

const server = http.createServer((req, res) => {
  handleApi(req, res).catch(error => {
    send(req, res, error.status || 500, { error: error.message || "Interner ERP-Fehler." });
  });
});

server.listen(PORT, () => {
  console.log("Autohaus HESSEN ERP API laeuft auf Port " + PORT);
});
