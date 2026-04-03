import { renderLightMap } from "./map-adapter.js";

function severityClass(status) { return `status-${status}`; }

export function applyStaticTranslations({ state, i18n }) {
  const t = i18n.t.bind(i18n);
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
  Object.entries(ids).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  });
  document.getElementById("searchInput").placeholder = t("searchPlaceholder");
  document.getElementById("viewTitle").textContent = t(`${state.view}Title`);
}

export function updateVisibleView(state) {
  document.querySelectorAll(".view").forEach((element) => {
    const active = element.id === `view-${state.view}`;
    element.classList.toggle("active", active);
    element.style.display = active ? "block" : "none";
  });
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
}

export function renderTopbar({ state, i18n }) {
  const t = i18n.t.bind(i18n);
  document.getElementById("lastUpdateValue").textContent = i18n.formatDate(state.overview?.generatedAt);
  const statuses = (state.sources || []).map((source) => source.status);
  let health = "down";
  if (statuses.includes("degraded")) health = "degraded";
  else if (statuses.includes("ok")) health = "ok";
  document.getElementById("sourceHealthValue").textContent = t(`sourceHealth.${health}`);
}

export function renderOverview({ state, i18n }) {
  const t = i18n.t.bind(i18n);
  document.getElementById("severityLegend").innerHTML = ["red", "orange", "yellow", "normal", "no_data"].map((status) => `<span class="pill ${severityClass(status)}">${t(`statLabels.${status}`)}</span>`).join("");
  const stats = state.overview?.stationCounts ?? {};
  const cards = [["red", stats.red ?? 0], ["orange", stats.orange ?? 0], ["yellow", stats.yellow ?? 0], ["normal", stats.normal ?? 0], ["total", state.overview?.stationTotal ?? 0], ["reservoirs", state.overview?.reservoirTotal ?? 0]];
  document.getElementById("overviewStats").innerHTML = cards.map(([key, value]) => `<article class="stat-card"><div class="small-note">${t(`statLabels.${key}`)}</div><div class="value">${i18n.formatNumber(value, 0)}</div></article>`).join("");
  document.getElementById("highlightedStations").innerHTML = (state.overview?.highlightedStations || []).map((station) => `<article class="list-item"><div class="panel-head"><h4>${station.stationName || "—"}</h4><span class="pill ${severityClass(station.status)}">${station.statusLabel || t(`statLabels.${station.status}`)}</span></div><div class="list-meta">${station.riverName || "—"} · ${station.municipality || "—"}, ${station.department || "—"}</div></article>`).join("");
  document.getElementById("overviewAlerts").innerHTML = (state.overview?.activeAlerts || []).map((alert) => `<article class="list-item"><div class="panel-head"><h4>${alert.subzoneName || "—"}</h4><span class="pill ${severityClass(alert.severity)}">${alert.severityLabel || t(`statLabels.${alert.severity}`)}</span></div><div class="list-meta">${alert.zoneName || "—"} · ${i18n.formatDate(alert.issuedAt)}</div></article>`).join("");
}

export function renderStations({ state, i18n, onStationSelect }) {
  const t = i18n.t.bind(i18n);
  const statusSelect = document.getElementById("statusFilter");
  const departmentSelect = document.getElementById("departmentFilter");
  statusSelect.innerHTML = [["", t("filterAllStatuses")], ["red", t("statLabels.red")], ["orange", t("statLabels.orange")], ["yellow", t("statLabels.yellow")], ["normal", t("statLabels.normal")], ["no_data", t("statLabels.no_data")]].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  statusSelect.value = state.filters.status;
  const departments = Array.from(new Set(state.stations.map((station) => station.department).filter(Boolean))).sort();
  departmentSelect.innerHTML = [["", t("filterAllDepartments")], ...departments.map((department) => [department, department])].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  departmentSelect.value = state.filters.department;
  const search = state.search.trim().toLowerCase();
  const stations = state.stations.filter((station) => {
    const matchesSearch = !search || [station.stationName, station.stationId, station.riverName, station.municipality, station.department].filter(Boolean).some((value) => value.toLowerCase().includes(search));
    return matchesSearch && (!state.filters.status || station.status === state.filters.status) && (!state.filters.department || station.department === state.filters.department);
  });
  document.getElementById("stationsCount").textContent = `${stations.length} ${t("labels.totalStations")}`;
  const body = document.getElementById("stationsTableBody");
  body.innerHTML = stations.map((station) => `<tr data-station-id="${station.stationId}" class="${state.selectedStationId === station.stationId ? "selected" : ""}"><td><strong>${station.stationName || "—"}</strong><br /><span class="small-note">${station.stationId || "—"}</span></td><td>${station.riverName || "—"}</td><td>${station.municipality || "—"}, ${station.department || "—"}</td><td><span class="pill ${severityClass(station.status)}">${station.statusLabel || t(`statLabels.${station.status}`)}</span></td></tr>`).join("");
  body.querySelectorAll("tr").forEach((row) => row.addEventListener("click", () => onStationSelect(row.dataset.stationId)));
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
  const forecast = station.forecastSummary?.length ? `<table><thead><tr><th>${t("labels.forecast")}</th><th>Nivel</th><th>Caudal</th></tr></thead><tbody>${station.forecastSummary.slice(0, 6).map((item) => `<tr><td>${i18n.formatDate(item.forecastAt)}</td><td>${i18n.formatNumber(item.forecastLevel)}</td><td>${i18n.formatNumber(item.forecastFlow)}</td></tr>`).join("")}</tbody></table>` : `<div class="small-note">${t("labels.noForecast")}</div>`;
  detail.innerHTML = `<section class="detail-section"><div class="panel-head"><h4>${station.stationName || "—"}</h4><span class="pill ${severityClass(station.status)}">${station.statusLabel || t(`statLabels.${station.status}`)}</span></div><div class="detail-grid"><div><div class="detail-key">${t("labels.river")}</div><div class="detail-value">${station.riverName || "—"}</div></div><div><div class="detail-key">${t("labels.subzone")}</div><div class="detail-value">${station.subzoneName || "—"}</div></div><div><div class="detail-key">${t("labels.zone")}</div><div class="detail-value">${station.zoneName || "—"}</div></div><div><div class="detail-key">${t("labels.municipality")}</div><div class="detail-value">${station.municipality || "—"}</div></div><div><div class="detail-key">${t("labels.department")}</div><div class="detail-value">${station.department || "—"}</div></div><div><div class="detail-key">${t("labels.altitude")}</div><div class="detail-value">${i18n.formatNumber(station.altitude, 0)}</div></div><div><div class="detail-key">${t("labels.category")}</div><div class="detail-value">${station.category || "—"}</div></div><div><div class="detail-key">ID</div><div class="detail-value">${station.stationId || "—"}</div></div></div></section><section class="detail-section"><h4>${t("labels.source")}</h4><div class="detail-grid"><div><div class="detail-key">${t("labels.currentObserved")}</div><div class="detail-value">${i18n.formatNumber(station.currentLevelObserved)}</div></div><div><div class="detail-key">${t("labels.currentSensor")}</div><div class="detail-value">${i18n.formatNumber(station.currentLevelSensor)}</div></div></div></section><section class="detail-section"><h4>${t("labels.thresholds")}</h4><div class="detail-grid"><div><div class="detail-key">${t("statLabels.yellow")}</div><div class="detail-value">${i18n.formatNumber(station.thresholds?.yellow)}</div></div><div><div class="detail-key">${t("statLabels.orange")}</div><div class="detail-value">${i18n.formatNumber(station.thresholds?.orange)}</div></div><div><div class="detail-key">${t("statLabels.red")}</div><div class="detail-value">${i18n.formatNumber(station.thresholds?.red)}</div></div><div><div class="detail-key">Bajos</div><div class="detail-value">${i18n.formatNumber(station.thresholds?.low)}</div></div></div></section><section class="detail-section"><h4>${t("labels.forecast")}</h4>${forecast}</section>`;
}

export function renderAlerts({ state, i18n }) {
  const t = i18n.t.bind(i18n);
  document.getElementById("alertsList").innerHTML = state.alerts.map((alert) => `<article class="list-item"><div class="panel-head"><h4>${alert.subzoneName || "—"}</h4><span class="pill ${severityClass(alert.severity)}">${alert.severityLabel || t(`statLabels.${alert.severity}`)}</span></div><div class="list-meta">${alert.zoneName || "—"} · ${alert.macroAreaName || "—"}</div><div class="small-note">${t("labels.issuedAt")}: ${i18n.formatDate(alert.issuedAt)} · ${t("labels.metric")}: ${i18n.formatNumber(alert.observedMetric, 0)}</div></article>`).join("");
}

export function renderReservoirs({ state, i18n }) {
  document.getElementById("reservoirsTableBody").innerHTML = state.reservoirs.slice(0, 50).map((item) => `<tr><td><strong>${item.reservoirId || "—"}</strong><br /><span class="small-note">${i18n.formatDate(item.timestamp)}</span></td><td>${i18n.formatNumber(item.usefulVolumeMass)}</td><td>${i18n.formatNumber(item.usefulVolumePct)}</td><td>${i18n.formatNumber(item.observedPrecipitation)}</td><td>${i18n.formatNumber(item.forecastPrecipitation)}</td></tr>`).join("");
}

export function renderSources({ state, i18n }) {
  const t = i18n.t.bind(i18n);
  document.getElementById("sourcesList").innerHTML = state.sources.map((source) => `<article class="source-item"><div class="panel-head"><h4>${source.id}</h4><span class="pill ${severityClass(source.status === "ok" ? "normal" : source.status === "degraded" ? "orange" : "red")}">${t(`sourceHealth.${source.status}`) || source.status}</span></div><div class="source-url">${source.name}</div><div class="small-note">${t("labels.sourceLastSuccess")}: ${i18n.formatDate(source.lastSuccessAt)}</div><div class="small-note">${t("labels.sourceLatency")}: ${i18n.formatNumber(source.latencyMs, 0)} ms</div>${source.error ? `<div class="small-note">${t("labels.sourceError")}: ${source.error}</div>` : ""}</article>`).join("");
}

export function renderMap({ state, i18n }) {
  renderLightMap({ mapSummary: state.mapSummary, target: document.getElementById("mapCanvas"), t: i18n.t.bind(i18n) });
}
