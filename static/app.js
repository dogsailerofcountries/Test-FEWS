const translations = {
  es: {
    brandDescription: "Monitoreo hidrológico con datos reales de FEWS, diseñado para lectura operativa y decisión rápida.",
    nav: { overview: "Resumen", stations: "Estaciones", alerts: "Alertas", map: "Mapa", reservoirs: "Embalses", sources: "Fuentes" },
    langLabel: "Idioma",
    topbarEyebrow: "FEWS Colombia / Demo técnica",
    sourceHealthLabel: "Estado de fuentes",
    lastUpdateLabel: "Última actualización",
    overviewTitle: "Resumen operativo",
    stationsTitle: "Estaciones hidrológicas",
    alertsTitle: "Alertas por subzona",
    mapTitle: "Mapa operativo",
    reservoirsTitle: "Embalses",
    sourcesTitle: "Estado de fuentes",
    overviewHeroEyebrow: "Monitoreo en tiempo real publicado por FEWS",
    overviewHeroTitle: "Un FEWS más claro, más rápido y listo para web bilingüe.",
    overviewHeroBody: "La aplicación integra estaciones, alertas subzonales, pronósticos HQ y embalses desde las descargas públicas de FEWS. El backend propio normaliza los datos y la interfaz prioriza severidad, lectura rápida y contexto por estación.",
    overviewHighlightedTitle: "Estaciones destacadas",
    overviewAlertsTitle: "Alertas activas",
    statLabels: { red: "Roja", orange: "Naranja", yellow: "Amarilla", normal: "Normal", no_data: "Sin dato", total: "Total estaciones", reservoirs: "Embalses" },
    stationFiltersTitle: "Filtros",
    searchPlaceholder: "Buscar por estación, río, municipio o código",
    filterAllStatuses: "Todos los estados",
    filterAllDepartments: "Todos los departamentos",
    stationsTableTitle: "Listado de estaciones",
    stationDetailTitle: "Detalle de estación",
    stationDetailEmpty: "Selecciona una estación para ver nivel, umbrales y pronóstico.",
    alertsTitlePanel: "Alertas publicadas por subzona hidrográfica",
    reservoirsTitlePanel: "Embalses con volumen útil y precipitación",
    sourcesTitlePanel: "Diagnóstico del adaptador FEWS",
    columns: { station: "Estación", river: "Corriente", location: "Ubicación", status: "Estado", reservoir: "Embalse", usefulVolume: "Vol. útil", usefulPct: "% útil", rainObs: "P. observada", rainForecast: "P. pronosticada" },
    labels: {
      river: "Corriente", subzone: "Subzona", zone: "Zona", municipality: "Municipio", department: "Departamento", altitude: "Altitud", category: "Categoría",
      currentObserved: "Nivel observado", currentSensor: "Nivel sensor", thresholds: "Umbrales", forecast: "Pronóstico HQ", noForecast: "Sin pronóstico disponible",
      source: "Fuente", issuedAt: "Fecha", metric: "Pobs SZH", sourceLastSuccess: "Último éxito", sourceLatency: "Latencia", sourceError: "Error", totalStations: "estaciones"
    },
    sourceHealth: { ok: "Operativo", degraded: "Degradado", down: "Caído" }
  },
  en: {
    brandDescription: "Hydrological monitoring with real FEWS data, designed for operational reading and rapid decisions.",
    nav: { overview: "Overview", stations: "Stations", alerts: "Alerts", map: "Map", reservoirs: "Reservoirs", sources: "Sources" },
    langLabel: "Language",
    topbarEyebrow: "FEWS Colombia / Technical demo",
    sourceHealthLabel: "Source health",
    lastUpdateLabel: "Last update",
    overviewTitle: "Operational overview",
    stationsTitle: "Hydrological stations",
    alertsTitle: "Subzone alerts",
    mapTitle: "Operational map",
    reservoirsTitle: "Reservoirs",
    sourcesTitle: "Source health",
    overviewHeroEyebrow: "Real-time monitoring published by FEWS",
    overviewHeroTitle: "A clearer, faster FEWS built for a bilingual web experience.",
    overviewHeroBody: "The app integrates stations, subzone alerts, HQ forecasts, and reservoirs from FEWS public downloads. A dedicated backend normalizes the data while the interface prioritizes severity, scanning speed, and station context.",
    overviewHighlightedTitle: "Highlighted stations",
    overviewAlertsTitle: "Active alerts",
    statLabels: { red: "Red", orange: "Orange", yellow: "Yellow", normal: "Normal", no_data: "No data", total: "Total stations", reservoirs: "Reservoirs" },
    stationFiltersTitle: "Filters",
    searchPlaceholder: "Search by station, river, municipality, or code",
    filterAllStatuses: "All statuses",
    filterAllDepartments: "All departments",
    stationsTableTitle: "Station list",
    stationDetailTitle: "Station detail",
    stationDetailEmpty: "Select a station to inspect level, thresholds, and forecast.",
    alertsTitlePanel: "Published alerts by hydrological subzone",
    reservoirsTitlePanel: "Reservoirs with useful volume and rainfall",
    sourcesTitlePanel: "FEWS adapter diagnostics",
    columns: { station: "Station", river: "River", location: "Location", status: "Status", reservoir: "Reservoir", usefulVolume: "Useful vol.", usefulPct: "Useful %", rainObs: "Obs. rain", rainForecast: "Fcst. rain" },
    labels: {
      river: "River", subzone: "Subzone", zone: "Zone", municipality: "Municipality", department: "Department", altitude: "Altitude", category: "Category",
      currentObserved: "Observed level", currentSensor: "Sensor level", thresholds: "Thresholds", forecast: "HQ forecast", noForecast: "No forecast available",
      source: "Source", issuedAt: "Issued at", metric: "Subzone metric", sourceLastSuccess: "Last success", sourceLatency: "Latency", sourceError: "Error", totalStations: "stations"
    },
    sourceHealth: { ok: "Healthy", degraded: "Degraded", down: "Down" }
  }
};

const state = { language: "es", view: "overview", overview: null, stations: [], selectedStationId: null, alerts: [], reservoirs: [], sources: [] };

function t(path) {
  return path.split(".").reduce((value, key) => value?.[key], translations[state.language]) ?? path;
}

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(state.language === "es" ? "es-CO" : "en-US", { maximumFractionDigits: decimals }).format(value);
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(state.language === "es" ? "es-CO" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

async function fetchJson(path) {
  const response = await fetch(`${path}${path.includes("?") ? "&" : "?"}lang=${state.language}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadData() {
  const [overview, stations, alerts, reservoirs, sources] = await Promise.all([
    fetchJson("/api/overview"),
    fetchJson("/api/estaciones"),
    fetchJson("/api/alertas/subzonas"),
    fetchJson("/api/embalses"),
    fetchJson("/api/fuentes"),
  ]);
  state.overview = overview;
  state.stations = stations.items;
  state.alerts = alerts.items;
  state.reservoirs = reservoirs.items;
  state.sources = sources.items;
  if (!state.selectedStationId && state.stations.length) state.selectedStationId = state.stations[0].stationId;
}

function severityClass(status) { return `status-${status}`; }

function applyTranslations() {
  document.documentElement.lang = state.language;
  const ids = {
    brandDescription: t("brandDescription"),
    navOverview: t("nav.overview"),
    navStations: t("nav.stations"),
    navAlerts: t("nav.alerts"),
    navMap: t("nav.map"),
    navReservoirs: t("nav.reservoirs"),
    navSources: t("nav.sources"),
    langLabel: t("langLabel"),
    topbarEyebrow: t("topbarEyebrow"),
    sourceHealthLabel: t("sourceHealthLabel"),
    lastUpdateLabel: t("lastUpdateLabel"),
    overviewHeroEyebrow: t("overviewHeroEyebrow"),
    overviewHeroTitle: t("overviewHeroTitle"),
    overviewHeroBody: t("overviewHeroBody"),
    overviewHighlightedTitle: t("overviewHighlightedTitle"),
    overviewAlertsTitle: t("overviewAlertsTitle"),
    stationFiltersTitle: t("stationFiltersTitle"),
    stationsTableTitle: t("stationsTableTitle"),
    stationDetailTitle: t("stationDetailTitle"),
    stationDetailEmpty: t("stationDetailEmpty"),
    alertsTitle: t("alertsTitlePanel"),
    mapTitle: t("mapTitle"),
    reservoirsTitle: t("reservoirsTitlePanel"),
    sourcesTitle: t("sourcesTitlePanel"),
    colStation: t("columns.station"),
    colRiver: t("columns.river"),
    colLocation: t("columns.location"),
    colStatus: t("columns.status"),
    colReservoir: t("columns.reservoir"),
    colUsefulVolume: t("columns.usefulVolume"),
    colUsefulPct: t("columns.usefulPct"),
    colRainObs: t("columns.rainObs"),
    colRainForecast: t("columns.rainForecast"),
  };
  Object.entries(ids).forEach(([id, text]) => { document.getElementById(id).textContent = text; });
  document.getElementById("searchInput").placeholder = t("searchPlaceholder");
  document.getElementById("viewTitle").textContent = t(`${state.view}Title`);
}

function renderTopbar() {
  document.getElementById("lastUpdateValue").textContent = formatDate(state.overview?.generatedAt);
  const statuses = state.sources.map((source) => source.status);
  let health = "down";
  if (statuses.includes("degraded")) health = "degraded";
  else if (statuses.includes("ok")) health = "ok";
  document.getElementById("sourceHealthValue").textContent = t(`sourceHealth.${health}`);
}

function renderOverview() {
  document.getElementById("severityLegend").innerHTML = ["red", "orange", "yellow", "normal", "no_data"]
    .map((status) => `<span class="pill ${severityClass(status)}">${t(`statLabels.${status}`)}</span>`).join("");

  const stats = state.overview?.stationCounts ?? {};
  const cards = [
    ["red", stats.red ?? 0], ["orange", stats.orange ?? 0], ["yellow", stats.yellow ?? 0],
    ["normal", stats.normal ?? 0], ["total", state.overview?.stationTotal ?? 0], ["reservoirs", state.overview?.reservoirTotal ?? 0],
  ];
  document.getElementById("overviewStats").innerHTML = cards.map(([key, value]) => `
    <article class="stat-card"><div class="small-note">${t(`statLabels.${key}`)}</div><div class="value">${formatNumber(value, 0)}</div></article>
  `).join("");

  document.getElementById("highlightedStations").innerHTML = (state.overview?.highlightedStations || []).map((station) => `
    <article class="list-item">
      <div class="panel-head"><h4>${station.stationName || "—"}</h4><span class="pill ${severityClass(station.status)}">${station.statusLabel || t(`statLabels.${station.status}`)}</span></div>
      <div class="list-meta">${station.riverName || "—"} · ${station.municipality || "—"}, ${station.department || "—"}</div>
    </article>
  `).join("");

  document.getElementById("overviewAlerts").innerHTML = (state.overview?.activeAlerts || []).map((alert) => `
    <article class="list-item">
      <div class="panel-head"><h4>${alert.subzoneName || "—"}</h4><span class="pill ${severityClass(alert.severity)}">${t(`statLabels.${alert.severity}`)}</span></div>
      <div class="list-meta">${alert.zoneName || "—"} · ${formatDate(alert.issuedAt)}</div>
    </article>
  `).join("");
}

function buildSelect(id, options, selected) {
  const select = document.getElementById(id);
  select.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  select.value = selected;
}

function filteredStations() {
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const department = document.getElementById("departmentFilter").value;
  return state.stations.filter((station) => {
    const matchesSearch = !search || [station.stationName, station.stationId, station.riverName, station.municipality, station.department].filter(Boolean).some((value) => value.toLowerCase().includes(search));
    const matchesStatus = !status || station.status === status;
    const matchesDepartment = !department || station.department === department;
    return matchesSearch && matchesStatus && matchesDepartment;
  });
}

function renderStations() {
  buildSelect("statusFilter", [["", t("filterAllStatuses")], ["red", t("statLabels.red")], ["orange", t("statLabels.orange")], ["yellow", t("statLabels.yellow")], ["normal", t("statLabels.normal")], ["no_data", t("statLabels.no_data")]], document.getElementById("statusFilter").value);
  const departments = Array.from(new Set(state.stations.map((station) => station.department).filter(Boolean))).sort();
  buildSelect("departmentFilter", [["", t("filterAllDepartments")], ...departments.map((department) => [department, department])], document.getElementById("departmentFilter").value);
  const stations = filteredStations();
  document.getElementById("stationsCount").textContent = `${stations.length} ${t("labels.totalStations")}`;
  const body = document.getElementById("stationsTableBody");
  body.innerHTML = stations.map((station) => `
    <tr data-station-id="${station.stationId}" class="${state.selectedStationId === station.stationId ? "selected" : ""}">
      <td><strong>${station.stationName || "—"}</strong><br /><span class="small-note">${station.stationId || "—"}</span></td>
      <td>${station.riverName || "—"}</td>
      <td>${station.municipality || "—"}, ${station.department || "—"}</td>
      <td><span class="pill ${severityClass(station.status)}">${station.statusLabel || t(`statLabels.${station.status}`)}</span></td>
    </tr>
  `).join("");
  body.querySelectorAll("tr").forEach((row) => row.addEventListener("click", () => { state.selectedStationId = row.dataset.stationId; renderStations(); }));
  renderStationDetail();
}

function renderStationDetail() {
  const station = state.stations.find((item) => item.stationId === state.selectedStationId);
  const empty = document.getElementById("stationDetailEmpty");
  const detail = document.getElementById("stationDetail");
  if (!station) {
    empty.classList.remove("hidden");
    detail.classList.add("hidden");
    return;
  }
  empty.classList.add("hidden");
  detail.classList.remove("hidden");
  const forecast = station.forecastSummary?.length ? `
    <table><thead><tr><th>${t("labels.forecast")}</th><th>Nivel</th><th>Caudal</th></tr></thead><tbody>
      ${station.forecastSummary.slice(0, 6).map((item) => `<tr><td>${formatDate(item.forecastAt)}</td><td>${formatNumber(item.forecastLevel)}</td><td>${formatNumber(item.forecastFlow)}</td></tr>`).join("")}
    </tbody></table>
  ` : `<div class="small-note">${t("labels.noForecast")}</div>`;
  detail.innerHTML = `
    <section class="detail-section">
      <div class="panel-head"><h4>${station.stationName || "—"}</h4><span class="pill ${severityClass(station.status)}">${station.statusLabel || t(`statLabels.${station.status}`)}</span></div>
      <div class="detail-grid">
        <div><div class="detail-key">${t("labels.river")}</div><div class="detail-value">${station.riverName || "—"}</div></div>
        <div><div class="detail-key">${t("labels.subzone")}</div><div class="detail-value">${station.subzoneName || "—"}</div></div>
        <div><div class="detail-key">${t("labels.zone")}</div><div class="detail-value">${station.zoneName || "—"}</div></div>
        <div><div class="detail-key">${t("labels.municipality")}</div><div class="detail-value">${station.municipality || "—"}</div></div>
        <div><div class="detail-key">${t("labels.department")}</div><div class="detail-value">${station.department || "—"}</div></div>
        <div><div class="detail-key">${t("labels.altitude")}</div><div class="detail-value">${formatNumber(station.altitude, 0)}</div></div>
        <div><div class="detail-key">${t("labels.category")}</div><div class="detail-value">${station.category || "—"}</div></div>
        <div><div class="detail-key">ID</div><div class="detail-value">${station.stationId || "—"}</div></div>
      </div>
    </section>
    <section class="detail-section">
      <h4>${t("labels.source")}</h4>
      <div class="detail-grid">
        <div><div class="detail-key">${t("labels.currentObserved")}</div><div class="detail-value">${formatNumber(station.currentLevelObserved)}</div></div>
        <div><div class="detail-key">${t("labels.currentSensor")}</div><div class="detail-value">${formatNumber(station.currentLevelSensor)}</div></div>
      </div>
    </section>
    <section class="detail-section">
      <h4>${t("labels.thresholds")}</h4>
      <div class="detail-grid">
        <div><div class="detail-key">${t("statLabels.yellow")}</div><div class="detail-value">${formatNumber(station.thresholds?.yellow)}</div></div>
        <div><div class="detail-key">${t("statLabels.orange")}</div><div class="detail-value">${formatNumber(station.thresholds?.orange)}</div></div>
        <div><div class="detail-key">${t("statLabels.red")}</div><div class="detail-value">${formatNumber(station.thresholds?.red)}</div></div>
        <div><div class="detail-key">Bajos</div><div class="detail-value">${formatNumber(station.thresholds?.low)}</div></div>
      </div>
    </section>
    <section class="detail-section"><h4>${t("labels.forecast")}</h4>${forecast}</section>
  `;
}

function renderAlerts() {
  document.getElementById("alertsList").innerHTML = state.alerts.map((alert) => `
    <article class="list-item">
      <div class="panel-head"><h4>${alert.subzoneName || "—"}</h4><span class="pill ${severityClass(alert.severity)}">${alert.severityLabel || t(`statLabels.${alert.severity}`)}</span></div>
      <div class="list-meta">${alert.zoneName || "—"} · ${alert.macroAreaName || "—"}</div>
      <div class="small-note">${t("labels.issuedAt")}: ${formatDate(alert.issuedAt)} · ${t("labels.metric")}: ${formatNumber(alert.observedMetric, 0)}</div>
    </article>
  `).join("");
}

function renderMap() {
  const container = document.getElementById("mapCanvas");
  const stations = state.stations.filter((station) => station.longitude && station.latitude);
  const alerts = state.alerts.map((alert) => alert.feature).filter(Boolean).filter((feature) => feature.geometry?.type === "Polygon");
  if (!stations.length) {
    container.innerHTML = `<div class="empty-state">No map data</div>`;
    return;
  }
  const points = stations.map((station) => [station.longitude, station.latitude]);
  alerts.forEach((feature) => (feature.geometry.coordinates?.[0] || []).forEach((coordinate) => points.push(coordinate)));
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const width = 1000, height = 640, pad = 28;
  const project = ([x, y]) => [pad + ((x - minX) / (maxX - minX || 1)) * (width - pad * 2), height - pad - ((y - minY) / (maxY - minY || 1)) * (height - pad * 2)];
  const polygons = alerts.slice(0, 50).map((feature) => {
    const severity = (feature.properties?.severityNormalized || "no_data").toLowerCase();
    const coords = (feature.geometry.coordinates?.[0] || []).map((point) => project(point).join(",")).join(" ");
    return `<polygon points="${coords}" fill="currentColor" class="${severityClass(severity)}" opacity="0.14"></polygon>`;
  }).join("");
  const stationPoints = stations.slice(0, 400).map((station) => {
    const [x, y] = project([station.longitude, station.latitude]);
    return `<circle class="map-point ${severityClass(station.status)}" cx="${x}" cy="${y}" r="5"></circle>`;
  }).join("");
  container.innerHTML = `<svg class="map-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><rect x="0" y="0" width="${width}" height="${height}" fill="rgba(31,84,98,0.04)"></rect>${polygons}${stationPoints}</svg>`;
}

function renderReservoirs() {
  document.getElementById("reservoirsTableBody").innerHTML = state.reservoirs.slice(0, 50).map((item) => `
    <tr>
      <td><strong>${item.reservoirId || "—"}</strong><br /><span class="small-note">${formatDate(item.timestamp)}</span></td>
      <td>${formatNumber(item.usefulVolumeMass)}</td>
      <td>${formatNumber(item.usefulVolumePct)}</td>
      <td>${formatNumber(item.observedPrecipitation)}</td>
      <td>${formatNumber(item.forecastPrecipitation)}</td>
    </tr>
  `).join("");
}

function renderSources() {
  document.getElementById("sourcesList").innerHTML = state.sources.map((source) => `
    <article class="source-item">
      <div class="panel-head"><h4>${source.id}</h4><span class="pill ${severityClass(source.status === "ok" ? "normal" : source.status === "degraded" ? "orange" : "red")}">${t(`sourceHealth.${source.status}`) || source.status}</span></div>
      <div class="source-url">${source.name}</div>
      <div class="small-note">${t("labels.sourceLastSuccess")}: ${formatDate(source.lastSuccessAt)}</div>
      <div class="small-note">${t("labels.sourceLatency")}: ${formatNumber(source.latencyMs, 0)} ms</div>
      ${source.error ? `<div class="small-note">${t("labels.sourceError")}: ${source.error}</div>` : ""}
    </article>
  `).join("");
}

function renderView() {
  applyTranslations();
  renderTopbar();
  renderOverview();
  renderStations();
  renderAlerts();
  renderMap();
  renderReservoirs();
  renderSources();
  document.querySelectorAll(".view").forEach((element) => {
    const active = element.id === `view-${state.view}`;
    element.classList.toggle("active", active);
    element.style.display = active ? "block" : "none";
  });
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
}

function bindEvents() {
  document.getElementById("languageSelect").addEventListener("change", async (event) => {
    state.language = event.target.value;
    await loadData();
    renderView();
  });
  document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => {
    state.view = button.dataset.view;
    renderView();
  }));
  document.getElementById("searchInput").addEventListener("input", renderStations);
  document.getElementById("statusFilter").addEventListener("change", renderStations);
  document.getElementById("departmentFilter").addEventListener("change", renderStations);
}

async function bootstrap() {
  bindEvents();
  await loadData();
  renderView();
}

bootstrap().catch((error) => {
  document.body.innerHTML = `<main class="empty-state"><div><h1>FEWS Web Nuevo</h1><p>${error.message}</p></div></main>`;
});
