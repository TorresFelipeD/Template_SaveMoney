// ui-home.js
(async function () {
  // ✅ Esperar a que config.json esté cargado
  const CFG = await window.configReady; // { app: { origen, versionApp, locale } }
  const APP = CFG.app;

  const viewHome = document.getElementById("view-home");
  const tbody = document.getElementById("templatesTbody");
  const form = document.getElementById("newTemplateForm");
  const importInput = document.getElementById("importFileInput");
  const dropZone = document.getElementById("dropZone");

  function routeToEditor(id) {
    location.hash = `#editor/${id}`;
  }

  function renderList() {
    tbody.innerHTML = "";
    const arr = listTemplates();

    if (arr.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.innerHTML = "<em>No hay plantillas guardadas.</em>";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    for (const t of arr) {
      const tr = document.createElement("tr");
      const fechaMetaISO = computeFechaMeta(t.creadoEnISO, t.diasResultantes);
      const diasMarcados = (t.marcados || []).filter(Boolean).length;
      const denomMin = (t.denominaciones || []).slice().sort((a, b) => a - b)[0];

      tr.innerHTML = `
        <td>
          <div><strong>${t.nombre}</strong></div>
          <div class="muted">Denominaciones: ${t.denominaciones.join(", ")} <span class="badge min">min ${formatCOP(
            denomMin || 0
          )}</span></div>
        </td>
        <td class="nowrap">${formatDateLong(t.creadoEnISO)}</td>
        <td class="nowrap">${formatCOP(t.metaCOP)}</td>
        <td class="nowrap">${diasMarcados} / ${t.diasResultantes}</td>
        <td class="nowrap">${formatDateLong(fechaMetaISO)}</td>
        <td class="actions-row">
          <button class="btn" data-act="abrir" data-id="${t.id}">Abrir</button>
          <button class="btn" data-act="export-json" data-id="${t.id}">JSON</button>
          <button class="btn" data-act="export-pdf" data-id="${t.id}">PDF</button>
          <button class="btn danger" data-act="eliminar" data-id="${t.id}">Eliminar</button>
        </td>
      `;

      tbody.appendChild(tr);
    }
  }

  function parseDenoms(str) {
    return str
      .split(",")
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n) && n > 0)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);
  }

  form.addEventListener("submit", e => {
    e.preventDefault();

    const data = new FormData(form);
    const nombre = (data.get("nombre") || "").toString().trim();
    const metaCOP = parseInt(data.get("metaCOP"), 10);
    const diasObjetivo = parseInt(data.get("diasObjetivo"), 10);
    const denominaciones = parseDenoms((data.get("denominaciones") || "").toString());
    const preferirMenosDias = !!data.get("preferirMenosDias");

    try {
      const dist = distribute(metaCOP, diasObjetivo, denominaciones, preferirMenosDias);
      const id = ensureUUID();
      const now = nowISOWithOffset();

      const tpl = {
        schemaVersion: 1,
        id,
        nombre,
        creadoEnISO: now,
        ultimoGuardadoISO: now,
        metaCOP,
        diasObjetivo,
        denominaciones,
        preferirMenosDias,
        diasResultantes: dist.diasResultantes,
        aportes: dist.aportes,
        marcados: Array(dist.diasResultantes).fill(false),
        notas: "",
        app: { origen: APP.origen, versionApp: APP.versionApp, locale: APP.locale }
      };

      upsertTemplate(tpl);
      routeToEditor(id);
    } catch (err) {
      alert(err.message || String(err));
    }
  });

  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const act = btn.getAttribute("data-act");
    const tpl = getTemplate(id);
    if (!tpl) return;

    if (act === "abrir") {
      routeToEditor(id);
    } else if (act === "eliminar") {
      if (confirm(`¿Eliminar "${tpl.nombre}"? Esta acción no se puede deshacer.`)) {
        deleteTemplate(id);
        renderList();
      }
    } else if (act === "export-json") {
      const slug = slugify(tpl.nombre);
      const date = localStamp();
      downloadJSON(tpl, `plantilla-${slug}-${date}.json`);
    } else if (act === "export-pdf") {
      routeToEditor(id);
      setTimeout(() => {
        const container = document.getElementById("view-editor");
        exportEditorPDF(container, `plantilla-${slugify(tpl.nombre)}.pdf`);
      }, 350);
    }
  });

  importInput.addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await importFromJSONFile(file);
      alert(`Importación: ${res.action}.`);
      renderList();
    } catch (err) {
      alert("Error al importar: " + (err.message || String(err)));
    } finally {
      importInput.value = "";
    }
  });

  ["dragenter", "dragover"].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", async e => {
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      const res = await importFromJSONFile(file);
      alert(`Importación: ${res.action}.`);
      renderList();
    } catch (err) {
      alert("Error al importar: " + (err.message || String(err)));
    }
  });

  function applyRoute() {
    const hash = location.hash || "#home";
    const [route, id] = hash.replace("#", "").split("/");

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));

    if (route === "home") {
      document.getElementById("view-home").classList.add("active");
      renderList();
    } else if (route === "editor") {
      document.getElementById("view-editor").classList.add("active");
      if (id) {
        document.dispatchEvent(new CustomEvent("route-editor", { detail: { id } }));
      } else {
        location.hash = "#home";
      }
    } else {
      location.hash = "#home";
    }
  }

  window.addEventListener("hashchange", applyRoute);
  applyRoute();
})();
