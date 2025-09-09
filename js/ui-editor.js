(function () {
  const viewEditor = document.getElementById("view-editor");
  const elNombre = document.getElementById("edNombre");
  const elFechas = document.getElementById("edFechas");
  const elMeta = document.getElementById("edMeta");
  const elDiasObj = document.getElementById("edDiasObjetivo");
  const elDenoms = document.getElementById("edDenominaciones");
  const elPreferMenos = document.getElementById("edPreferirMenosDias");
  const elDiasRes = document.getElementById("edDiasResultantes");
  const elDenMin = document.getElementById("edDenMin");
  const elConteos = document.getElementById("edConteos");

  const board = document.getElementById("board");
  const counter = document.getElementById("contadorDias");
  const btnRecalc = document.getElementById("btnRecalcular");
  const btnGuardar = document.getElementById("btnEdGuardar");
  const btnExportJSON = document.getElementById("btnEdExportJSON");
  const btnExportPDF = document.getElementById("btnEdExportPDF");

  let currentId = null;
  let tpl = null;

  function parseDenoms(str) {
    return str
      .split(",")
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isFinite(n) && n > 0)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);
  }

  function updateCounter() {
    const total = tpl.diasResultantes;
    const done = (tpl.marcados || []).filter(Boolean).length;
    counter.textContent = `Días ahorrados: ${done} / ${total}`;
  }

  function computeCounts(aportes, denoms) {
    const counts = new Map(denoms.map(d => [d, 0]));
    for (const a of aportes) {
      counts.set(a, (counts.get(a) || 0) + 1);
    }
    return counts;
  }

  function renderCounts() {
    if (!elConteos) return;
    elConteos.innerHTML = "";

    const denoms = tpl.denominaciones.slice().sort((a, b) => a - b);
    const counts = computeCounts(tpl.aportes, denoms);

    let totalBills = 0;

    for (const d of denoms) {
      const c = counts.get(d) || 0;
      totalBills += c;

      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = `${new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
      }).format(d)} × ${c}`;

      elConteos.appendChild(chip);
    }

    const totalChip = document.createElement("span");
    totalChip.className = "chip";
    totalChip.textContent = `Total billetes: ${totalBills}`;
    elConteos.appendChild(totalChip);
  }

  function renderBoard() {
    board.innerHTML = "";
    board.style.setProperty("--cols", 7);

    const nf = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    });

    tpl.aportes.forEach((amount, idx) => {
      const cell = document.createElement("div");
      cell.className = "cell" + (tpl.marcados[idx] ? " marked" : "");
      cell.setAttribute("role", "button");
      cell.setAttribute("aria-pressed", String(!!tpl.marcados[idx]));
      cell.dataset.idx = String(idx);

      const day = document.createElement("div");
      day.className = "day";
      day.textContent = `Día ${idx + 1}`;

      const amt = document.createElement("div");
      amt.className = "amount";
      amt.textContent = nf.format(amount);

      cell.appendChild(day);
      cell.appendChild(amt);
      board.appendChild(cell);
    });

    updateCounter();
    renderCounts();
  }

  function loadTemplate(id) {
    tpl = getTemplate(id);
    if (!tpl) {
      alert("No se encontró la plantilla.");
      location.hash = "#home";
      return;
    }

    currentId = id;
    const fechaMetaISO = computeFechaMeta(tpl.creadoEnISO, tpl.diasResultantes);

    elNombre.textContent = tpl.nombre;
    elFechas.textContent = `Creada: ${formatDateLong(
      tpl.creadoEnISO
    )} • Fecha meta: ${formatDateLong(fechaMetaISO)}`;

    elMeta.value = tpl.metaCOP;
    elDiasObj.value = tpl.diasObjetivo;
    elDenoms.value = tpl.denominaciones.join(", ");
    elPreferMenos.checked = !!tpl.preferirMenosDias;

    elDiasRes.textContent = String(tpl.diasResultantes);
    elDenMin.textContent = formatCOP(
      tpl.denominaciones.slice().sort((a, b) => a - b)[0]
    );

    renderBoard();
  }

  function resizeMarks(newLen) {
    const marks = tpl.marcados || [];
    if (newLen === marks.length) return marks;
    if (newLen < marks.length) return marks.slice(0, newLen);
    return marks.concat(Array(newLen - marks.length).fill(false));
  }

  board.addEventListener("click", e => {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const idx = parseInt(cell.dataset.idx, 10);
    tpl.marcados[idx] = !tpl.marcados[idx];
    cell.classList.toggle("marked");
    cell.setAttribute("aria-pressed", String(tpl.marcados[idx]));
    updateCounter();
  });

  btnRecalc.addEventListener("click", () => {
    try {
      const metaCOP = parseInt(elMeta.value, 10);
      const diasObjetivo = parseInt(elDiasObj.value, 10);
      const denoms = parseDenoms(elDenoms.value);
      const prefer = !!elPreferMenos.checked;

      const dist = distribute(metaCOP, diasObjetivo, denoms, prefer);

      tpl.metaCOP = metaCOP;
      tpl.diasObjetivo = diasObjetivo;
      tpl.denominaciones = denoms;
      tpl.preferirMenosDias = prefer;
      tpl.diasResultantes = dist.diasResultantes;
      tpl.aportes = dist.aportes;
      tpl.marcados = resizeMarks(dist.diasResultantes);

      elDiasRes.textContent = String(tpl.diasResultantes);
      elDenMin.textContent = formatCOP(dist.denomMin);

      const fechaMetaISO = computeFechaMeta(tpl.creadoEnISO, tpl.diasResultantes);
      elFechas.textContent = `Creada: ${formatDateLong(
        tpl.creadoEnISO
      )} • Fecha meta: ${formatDateLong(fechaMetaISO)}`;

      renderBoard();
      alert("Distribución recalculada.");
    } catch (err) {
      alert(err.message || String(err));
    }
  });

  btnGuardar.addEventListener("click", () => {
    tpl.ultimoGuardadoISO = nowISOWithOffset();
    upsertTemplate(tpl);
    alert("Cambios guardados.");
  });

  btnExportJSON.addEventListener("click", () => {
    const slug = slugify(tpl.nombre);
    const date = localStamp();
    downloadJSON(tpl, `plantilla-${slug}-${date}.json`);
  });

  btnExportPDF.addEventListener("click", () => {
    exportEditorPDF(viewEditor, `plantilla-${slugify(tpl.nombre)}.pdf`);
  });

  document.addEventListener("route-editor", ev => {
    const id = ev.detail?.id;
    if (id) loadTemplate(id);
  });

  (function initByHash() {
    const [route, id] = (location.hash || "#home").replace("#", "").split("/");
    if (route === "editor" && id) {
      loadTemplate(id);
    }
  })();
})();
