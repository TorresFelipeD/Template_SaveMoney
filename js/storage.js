const STORAGE_KEY = "savingsTemplates";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function writeAll(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function listTemplates() {
  return readAll().sort(
    (a, b) => (b.creadoEnISO || "").localeCompare(a.creadoEnISO || "")
  );
}

function getTemplate(id) {
  return readAll().find(x => x.id === id) || null;
}

function upsertTemplate(tpl) {
  const arr = readAll();
  const idx = arr.findIndex(x => x.id === tpl.id);
  if (idx >= 0) arr[idx] = tpl;
  else arr.push(tpl);
  writeAll(arr);
}

function deleteTemplate(id) {
  const arr = readAll().filter(x => x.id !== id);
  writeAll(arr);
}

function slugify(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function nowISOWithOffset() {
  const d = new Date();
  const tz = -d.getTimezoneOffset();
  const sign = tz >= 0 ? "+" : "-";
  const abs = Math.abs(tz);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");

  const YYYY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const hh24 = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${YYYY}-${MM}-${DD}T${hh24}:${min}:${ss}${sign}${hh}:${mm}`;
}

function formatCOP(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(n);
}

function formatDateLong(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function computeFechaMeta(creadoEnISO, diasResultantes) {
  const d = new Date(creadoEnISO || new Date());
  const ms = (diasResultantes > 0 ? diasResultantes - 1 : 0) * 24 * 60 * 60 * 1000;
  const meta = new Date(d.getTime() + ms);
  return meta.toISOString();
}

function ensureUUID() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function downloadJSON(obj, filenameHint = "plantilla.json") {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filenameHint;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

function validateTemplateShape(t) {
  const required = [
    "schemaVersion",
    "id",
    "nombre",
    "creadoEnISO",
    "metaCOP",
    "diasObjetivo",
    "denominaciones",
    "preferirMenosDias",
    "diasResultantes",
    "aportes",
    "marcados"
  ];

  for (const k of required) {
    if (!(k in t)) return `Falta el campo requerido: ${k}`;
  }

  if (t.schemaVersion !== 1) return "schemaVersion no soportada (debe ser 1).";
  if (!Array.isArray(t.denominaciones) || t.denominaciones.length === 0)
    return "denominaciones inválidas.";
  if (!Array.isArray(t.aportes) || !Array.isArray(t.marcados))
    return "aportes/marcados inválidos.";
  if (t.aportes.length !== t.diasResultantes)
    return "aportes.length debe igualar diasResultantes.";
  if (t.marcados.length !== t.diasResultantes)
    return "marcados.length debe igualar diasResultantes.";

  return null;
}

async function importFromJSONFile(file) {
  const text = await file.text();
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("JSON inválido.");
  }

  const err = validateTemplateShape(obj);
  if (err) throw new Error(err);

  const existing = getTemplate(obj.id);
  if (existing) {
    const replace = confirm(
      "Ya existe una plantilla con el mismo ID. ¿Reemplazarla?\nAceptar: REEMPLAZAR\nCancelar: DUPLICAR como nueva"
    );
    if (replace) {
      upsertTemplate(obj);
      return { action: "replaced", template: obj };
    } else {
      obj.id = ensureUUID();
      obj.nombre = obj.nombre + " (importada)";
      upsertTemplate(obj);
      return { action: "duplicated", template: obj };
    }
  } else {
    const sameName = listTemplates().find(
      x => x.nombre.trim().toLowerCase() === obj.nombre.trim().toLowerCase()
    );
    if (sameName) {
      obj.nombre = obj.nombre + " (importada)";
    }
    upsertTemplate(obj);
    return { action: "imported", template: obj };
  }
}

function localStamp() {
  const now = new Date();
  const offsetMin = -now.getTimezoneOffset(); // Bogotá → -300
  const local = new Date(now.getTime() + offsetMin * 60_000);

  // "YYYY-MM-DDTHH:MM:SS" -> "YYYY-MM-DD_HHMMSS"
  return local
    .toISOString()
    .slice(0, 19) // quitamos ms y 'Z'
    .replace("T", "_")
    .replace(/:/g, "");
}
