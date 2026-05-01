import { renderLightMap } from "./map-adapter.js";

function severityClass(status) {
  return `status-${status}`;
}

function getAlertIcon(status) {
  const icons = {
    red: 'report',
    orange: 'warning',
    yellow: 'error',
    normal: 'check_circle',
    no_data: 'help'
  };
  return `<span class="material-symbols-outlined text-[14px]" data-icon="${icons[status] || 'info'}">${icons[status] || 'info'}</span>`;
}

function getFavoriteIcon(isFavorite) {
  return `<span class="material-symbols-outlined ${isFavorite ? 'text-caution' : 'text-slate-300'}" style="font-variation-settings: 'FILL' ${isFavorite ? 1 : 0};">${isFavorite ? 'star' : 'star_outline'}</span>`;
}

function getPinButton(stationId, isFavorite) {
  return `<button class="p-2 rounded-full hover:bg-slate-100 transition-all btn-pin" data-station-id="${stationId}" title="Pin station">
    ${getFavoriteIcon(isFavorite)}
  </button>`;
}

function safeText(value) {
  return value || "--";
}

export function applyStaticTranslations({ state, i18n }) {
  const t = i18n.t.bind(i18n);
  document.documentElement.lang = state.language;

  const ids = {
    brandDescription: t("brandDescription"),
    navOverview: t("nav.overview"),
    navPurpose: t("nav.purpose"),
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
    colRainForecast: t("columns.rainForecast")
  };

  Object.entries(ids).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  });

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.placeholder = t("searchPlaceholder");

  const viewTitle = document.getElementById("viewTitle");
  if (viewTitle) viewTitle.textContent = t(`${state.view}Title`);
}

export function updateVisibleView(state) {
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.classList.toggle("is-map-view", state.view === "map");
  }

  document.querySelectorAll(".view").forEach((element) => {
    const active = element.id === `view-${state.view}`;
    element.classList.toggle("active", active);
    element.style.display = active ? "block" : "none";
  });

  document.querySelectorAll(".nav-link").forEach((button) => {
    if (button.id !== "btnBackToStations") {
      button.classList.toggle("active", button.dataset.view === state.view);
    }
  });
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

export function renderOverview({ state, i18n, onPinToggle }) {
  const t = i18n.t.bind(i18n);

  if (!state.loaded.overview) {
    document.getElementById("overviewStats").innerHTML = '<article class="glass-card rounded-2xl p-6 h-24 animate-pulse"></article>'.repeat(6);
    document.getElementById("highlightedStations").innerHTML = '<div class="h-20 bg-slate-50 rounded-xl animate-pulse"></div>'.repeat(3);
    document.getElementById("overviewAlerts").innerHTML = '<div class="h-20 bg-slate-50 rounded-xl animate-pulse"></div>'.repeat(3);
    return;
  }

  document.getElementById("severityLegend").innerHTML = ["red", "orange", "yellow", "normal", "no_data"]
    .map((status) => `<span class="pill ${severityClass(status)} bg-white/20 backdrop-blur-md border-white/30 text-white">${getAlertIcon(status)} ${t(`statLabels.${status}`)}</span>`)
    .join("");

  const stats = state.overview?.stationCounts ?? {};
  const cards = [
    { key: "red", value: stats.red ?? 0, icon: "warning", color: "text-error" },
    { key: "orange", value: stats.orange ?? 0, icon: "error", color: "text-warning" },
    { key: "yellow", value: stats.yellow ?? 0, icon: "report", color: "text-caution" },
    { key: "normal", value: stats.normal ?? 0, icon: "check_circle", color: "text-success" },
    { key: "total", value: state.overview?.stationTotal ?? 0, icon: "lan", color: "text-primary" },
    { key: "reservoirs", value: state.overview?.reservoirTotal ?? 0, icon: "water_full", color: "text-sky-400" }
  ];

  document.getElementById("overviewStats").innerHTML = cards
    .map((card) => `
      <article class="glass-card rounded-2xl p-6 flex flex-col items-center text-center group hover:scale-105 transition-all">
        <span class="material-symbols-outlined ${card.color} text-2xl mb-2" data-icon="${card.icon}">${card.icon}</span>
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">${t(`statLabels.${card.key}`)}</div>
        <div class="text-2xl font-black font-outfit text-slate-900">${i18n.formatNumber(card.value, 0)}</div>
      </article>
    `)
    .join("");

  const pins = state.favorites || [];
  const stations = state.overview?.highlightedStations || [];
  const sortedHighlighted = [...stations].sort((a, b) => (pins.includes(b.stationId) ? 1 : 0) - (pins.includes(a.stationId) ? 1 : 0));

  const highlightedEl = document.getElementById("highlightedStations");
  highlightedEl.innerHTML = sortedHighlighted
    .map((station) => {
      const isFav = pins.includes(station.stationId);
      return `
        <article class="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all group">
          <div class="flex-1">
            <div class="flex justify-between items-start mb-1">
              <h4 class="font-outfit font-bold text-slate-900">${safeText(station.stationName)}</h4>
              <span class="pill ${severityClass(station.status)}">${getAlertIcon(station.status)} ${station.statusLabel || t(`statLabels.${station.status}`)}</span>
            </div>
            <p class="text-xs text-slate-400">${safeText(station.riverName)} · ${safeText(station.municipality)}, ${safeText(station.department)}</p>
          </div>
          <div class="flex flex-col gap-2">
            ${getPinButton(station.stationId, isFav)}
          </div>
        </article>
      `;
    })
    .join("");

  highlightedEl.querySelectorAll(".btn-pin").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onPinToggle(btn.dataset.stationId);
    });
  });

  document.getElementById("overviewAlerts").innerHTML = (state.overview?.activeAlerts || [])
    .map((alert) => `
      <article class="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
          <span class="material-symbols-outlined ${severityClass(alert.severity).replace('status-', 'text-')}" data-icon="report">${severityClass(alert.severity) === 'status-normal' ? 'check_circle' : 'report'}</span>
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-sm text-slate-900">${safeText(alert.subzoneName)}</h4>
            <span class="text-[9px] font-black text-slate-400 uppercase">${i18n.formatDate(alert.issuedAt)}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">${safeText(alert.zoneName)}</p>
          <div class="mt-2">
            <span class="pill ${severityClass(alert.severity)}">${alert.severityLabel || t(`statLabels.${alert.severity}`)}</span>
          </div>
        </div>
      </article>
    `)
    .join("");
}

export function renderPurpose({ i18n }) {
  const t = i18n.t.bind(i18n);
  document.getElementById("purposeIntroTitle").textContent = t("purposeIntroTitle");
  document.getElementById("purposeIntroBody").textContent = t("purposeIntroBody");
  document.getElementById("purposeGoalsTitle").textContent = t("purposeGoalsTitle");
  document.getElementById("purposeHowTitle").textContent = t("purposeHowTitle");
  document.getElementById("purposeGoalsList").innerHTML = t("purposeGoalsItems").map((item) => `<li>${item}</li>`).join("");
  document.getElementById("purposeHowList").innerHTML = t("purposeHowItems").map((item) => `<li>${item}</li>`).join("");
}

export function renderStations({ state, i18n, onStationSelect, onPinToggle }) {
  const t = i18n.t.bind(i18n);

  if (!state.loaded.stations) {
    document.getElementById("stationsCount").textContent = "...";
    document.getElementById("stationsTableBody").innerHTML = '<tr><td colspan="5" class="p-8"><div class="h-12 bg-slate-50 animate-pulse rounded-xl"></div></td></tr>'.repeat(5);
    return;
  }

  const statusSelect = document.getElementById("statusFilter");
  const departmentSelect = document.getElementById("departmentFilter");

  statusSelect.innerHTML = [
    ["", t("filterAllStatuses")],
    ["red", t("statLabels.red")],
    ["orange", t("statLabels.orange")],
    ["yellow", t("statLabels.yellow")],
    ["normal", t("statLabels.normal")],
    ["no_data", t("statLabels.no_data")]
  ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  statusSelect.value = state.filters.status;

  const departments = Array.from(new Set(state.stations.map((station) => station.department).filter(Boolean))).sort();
  departmentSelect.innerHTML = [["", t("filterAllDepartments")], ...departments.map((department) => [department, department])]
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
  departmentSelect.value = state.filters.department;

  const search = state.search.trim().toLowerCase();
  const pins = state.favorites || [];
  
  const stations = state.stations.filter((station) => {
    const haystack = [station.stationName, station.stationId, station.riverName, station.municipality, station.department]
      .filter(Boolean)
      .map((value) => value.toLowerCase());
    const matchesSearch = !search || haystack.some((value) => value.includes(search));
    return matchesSearch && (!state.filters.status || station.status === state.filters.status) && (!state.filters.department || station.department === state.filters.department);
  });

  document.getElementById("stationsCount").textContent = `${stations.length} ${t("labels.totalStations")}`;

  const body = document.getElementById("stationsTableBody");
  body.innerHTML = stations
    .map((station) => {
       const isFav = pins.includes(station.stationId);
       return `<tr data-station-id="${station.stationId}" class="group cursor-pointer hover:bg-slate-50 transition-all ${state.selectedStationId === station.stationId ? "selected bg-primary/5" : ""}">
         <td class="p-6">${getPinButton(station.stationId, isFav)}</td>
         <td class="p-6"><strong class="text-slate-900 font-bold block mb-1">${safeText(station.stationName)}</strong><span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${safeText(station.stationId)}</span></td>
         <td class="p-6 text-sm text-slate-500">${safeText(station.riverName)}</td>
         <td class="p-6 text-sm text-slate-500">${safeText(station.municipality)}, ${safeText(station.department)}</td>
         <td class="p-6"><span class="pill ${severityClass(station.status)}">${getAlertIcon(station.status)} ${station.statusLabel || t(`statLabels.${station.status}`)}</span></td>
       </tr>`;
    })
    .join("");

  body.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => onStationSelect(row.dataset.stationId));
    row.querySelector(".btn-pin").addEventListener("click", (e) => {
      e.stopPropagation();
      onPinToggle(row.dataset.stationId);
    });
  });

  const station = state.stations.find((item) => item.stationId === state.selectedStationId);
  const empty = document.getElementById("stationDetailEmpty");
  const detail = document.getElementById("stationDetail");

  if (!station) {
    empty.classList.remove("hidden");
    empty.querySelector("p").textContent = t("stationDetailEmpty");
    detail.classList.add("hidden");
    return;
  }

  empty.classList.add("hidden");
  detail.classList.remove("hidden");

  const isFav = (state.favorites || []).includes(station.stationId);

  detail.innerHTML = `
    <section class="glass-card rounded-3xl p-8 space-y-6">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-outfit text-2xl font-black text-slate-900">${safeText(station.stationName)}</h4>
          <p class="text-xs text-slate-500 font-medium">${safeText(station.riverName)}</p>
        </div>
        ${getPinButton(station.stationId, isFav)}
      </div>
      
      <div class="flex gap-2">
        <span class="pill ${severityClass(station.status)}">${getAlertIcon(station.status)} ${station.statusLabel || t(`statLabels.${station.status}`)}</span>
        <span class="pill bg-slate-100 text-slate-500">${safeText(station.category)}</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div class="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">${t("labels.currentObserved")}</div>
          <div class="text-lg font-black text-slate-900 font-outfit">${i18n.formatNumber(station.currentLevelObserved)} <small class="text-[10px] font-bold text-slate-400 uppercase">m</small></div>
        </div>
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div class="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">${t("labels.currentSensor")}</div>
          <div class="text-lg font-black text-slate-900 font-outfit">${i18n.formatNumber(station.currentLevelSensor)} <small class="text-[10px] font-bold text-slate-400 uppercase">m</small></div>
        </div>
      </div>

      <div class="space-y-3">
        <h5 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${t("labels.thresholds")}</h5>
        <div class="grid grid-cols-3 gap-2">
          <div class="p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-center">
            <div class="text-[8px] font-black text-red-500/60 uppercase mb-1">Rojo</div>
            <div class="text-xs font-bold text-red-600">${i18n.formatNumber(station.thresholds?.red)}</div>
          </div>
          <div class="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 text-center">
            <div class="text-[8px] font-black text-orange-500/60 uppercase mb-1">Naranja</div>
            <div class="text-xs font-bold text-orange-600">${i18n.formatNumber(station.thresholds?.orange)}</div>
          </div>
          <div class="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-center">
            <div class="text-[8px] font-black text-amber-500/60 uppercase mb-1">Amarillo</div>
            <div class="text-xs font-bold text-amber-600">${i18n.formatNumber(station.thresholds?.yellow)}</div>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><div class="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">${t("labels.municipality")}</div><div class="text-xs font-bold text-slate-700">${safeText(station.municipality)}</div></div>
          <div><div class="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">${t("labels.department")}</div><div class="text-xs font-bold text-slate-700">${safeText(station.department)}</div></div>
        </div>
        <button class="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2" onclick="window.dispatchEvent(new CustomEvent('stationSelect', { detail: '${station.stationId}' }))">
          <span class="material-symbols-outlined text-sm" data-icon="analytics">analytics</span>
          Ver análisis detallado
        </button>
      </div>
    </section>
  `;

  detail.querySelector(".btn-pin").addEventListener("click", (e) => {
    e.stopPropagation();
    onPinToggle(station.stationId);
  });
}

let activeChart = null;

export function renderStationDetail({ state, i18n }) {
  const t = i18n.t.bind(i18n);
  const station = state.stations.find((item) => item.stationId === state.selectedStationId);
  const detail = document.getElementById("stationDetailPageInfo");
  const chartCanvas = document.getElementById("stationChart");

  if (!station) {
    detail.innerHTML = `<div class="glass-card rounded-3xl p-12 text-center text-slate-400 font-medium">${t("stationDetailEmpty")}</div>`;
    if (activeChart) {
      activeChart.destroy();
      activeChart = null;
    }
    return;
  }

  detail.innerHTML = `
    <section class="glass-card rounded-3xl p-8 space-y-8">
      <div class="flex justify-between items-start">
        <div>
          <div class="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full inline-block mb-3 border border-primary/20 tracking-widest uppercase">Análisis detallado</div>
          <h2 class="font-outfit text-4xl font-black text-slate-900">${safeText(station.stationName)}</h2>
          <p class="text-sm text-slate-500 font-medium">${safeText(station.riverName)} · ${safeText(station.municipality)}, ${safeText(station.department)}</p>
        </div>
        <span class="pill ${severityClass(station.status)} text-sm px-4 py-2">${getAlertIcon(station.status)} ${station.statusLabel || t(`statLabels.${station.status}`)}</span>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
          <div class="relative z-10">
            <div class="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">${t("labels.currentObserved")}</div>
            <div class="text-3xl font-black font-outfit">${i18n.formatNumber(station.currentLevelObserved)} <small class="text-xs text-sky-400 font-bold uppercase">m</small></div>
          </div>
          <span class="material-symbols-outlined absolute -bottom-4 -right-4 text-[100px] text-white/5" data-icon="waves">waves</span>
        </div>
        <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
          <div class="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">${t("labels.currentSensor")}</div>
          <div class="text-xl font-black font-outfit text-slate-900">${i18n.formatNumber(station.currentLevelSensor)} <small class="text-[10px] text-slate-400 font-bold uppercase">m</small></div>
        </div>
        <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
          <div class="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Altitud</div>
          <div class="text-xl font-black font-outfit text-slate-900">${i18n.formatNumber(station.altitude, 0)} <small class="text-[10px] text-slate-400 font-bold uppercase">msnm</small></div>
        </div>
        <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
          <div class="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">ID</div>
          <div class="text-xl font-black font-outfit text-slate-900 truncate">${safeText(station.stationId)}</div>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="font-outfit text-lg font-bold text-slate-900">${t("labels.thresholds")}</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
            <div class="text-[9px] font-black text-red-500/60 uppercase mb-1">Rojo (Crítico)</div>
            <div class="text-lg font-black text-red-600 font-outfit">${i18n.formatNumber(station.thresholds?.red)}</div>
          </div>
          <div class="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
            <div class="text-[9px] font-black text-orange-500/60 uppercase mb-1">Naranja</div>
            <div class="text-lg font-black text-orange-600 font-outfit">${i18n.formatNumber(station.thresholds?.orange)}</div>
          </div>
          <div class="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <div class="text-[9px] font-black text-amber-500/60 uppercase mb-1">Amarillo</div>
            <div class="text-lg font-black text-amber-600 font-outfit">${i18n.formatNumber(station.thresholds?.yellow)}</div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div class="text-[9px] font-black text-slate-400 uppercase mb-1">Bajos</div>
            <div class="text-lg font-black text-slate-900 font-outfit">${i18n.formatNumber(station.thresholds?.low)}</div>
          </div>
        </div>
      </div>

      <div class="pt-8 border-t border-slate-100 grid md:grid-cols-3 gap-6">
        <div>
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Corriente</div>
          <div class="text-sm font-bold text-slate-700">${safeText(station.riverName)}</div>
        </div>
        <div>
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subzona</div>
          <div class="text-sm font-bold text-slate-700">${safeText(station.subzoneName)}</div>
        </div>
        <div>
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zona</div>
          <div class="text-sm font-bold text-slate-700">${safeText(station.zoneName)}</div>
        </div>
      </div>
    </section>
  `;

  // Build Graphic (Chart)
  if (activeChart) {
    activeChart.destroy();
  }

  const forecasts = station.forecastSummary || [];
  if (forecasts.length === 0) {
    const ctx = chartCanvas.getContext('2d');
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    return;
  }

  const labels = forecasts.map(f => i18n.formatDate(f.forecastAt));
  const levels = forecasts.map(f => f.forecastLevel);

  activeChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: t('labels.forecast') + ' (Nivel)',
        data: levels,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#0ea5e9',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { 
          beginAtZero: false,
          grid: { color: 'rgba(226, 232, 240, 0.8)' }
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, minRotation: 45 }
        }
      }
    }
  });
}

export function renderAlerts({ state, i18n }) {
  const t = i18n.t.bind(i18n);
  document.getElementById("alertsList").innerHTML = state.alerts
    .map((alert) => `
      <article class="glass-card rounded-2xl p-6 space-y-4 hover:translate-y-[-4px] transition-all group">
        <div class="flex justify-between items-start">
          <div class="w-12 h-12 rounded-2xl ${severityClass(alert.severity).replace('status-', 'bg-')}/10 flex items-center justify-center">
            <span class="material-symbols-outlined ${severityClass(alert.severity).replace('status-', 'text-')} text-2xl" data-icon="notification_important">notification_important</span>
          </div>
          <span class="pill ${severityClass(alert.severity)}">${getAlertIcon(alert.severity)} ${alert.severityLabel || t(`statLabels.${alert.severity}`)}</span>
        </div>
        <div>
          <h4 class="font-outfit text-lg font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">${safeText(alert.subzoneName)}</h4>
          <p class="text-xs text-slate-500 font-medium">${safeText(alert.zoneName)} · ${safeText(alert.macroAreaName)}</p>
        </div>
        <div class="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>${t("labels.issuedAt")}: ${i18n.formatDate(alert.issuedAt)}</span>
          <span>SZH: ${i18n.formatNumber(alert.observedMetric, 0)}</span>
        </div>
      </article>
    `)
    .join("");
}

export function renderReservoirs({ state, i18n }) {
  document.getElementById("reservoirsTableBody").innerHTML = state.reservoirs
    .slice(0, 50)
    .map((item) => `
      <tr class="hover:bg-slate-50 transition-all">
        <td class="p-6">
          <strong class="text-slate-900 font-bold block mb-1 font-outfit">${safeText(item.reservoirId)}</strong>
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${i18n.formatDate(item.timestamp)}</span>
        </td>
        <td class="p-6 font-outfit font-bold text-slate-700">${i18n.formatNumber(item.usefulVolumeMass)}</td>
        <td class="p-6">
          <div class="flex items-center gap-2">
            <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
               <div class="h-full bg-primary" style="width: ${item.usefulVolumePct}%"></div>
            </div>
            <span class="text-xs font-bold text-primary">${i18n.formatNumber(item.usefulVolumePct)}%</span>
          </div>
        </td>
        <td class="p-6 text-sm text-slate-500">${i18n.formatNumber(item.observedPrecipitation)}</td>
        <td class="p-6 text-sm text-slate-500">${i18n.formatNumber(item.forecastPrecipitation)}</td>
      </tr>
    `)
    .join("");
}

export function renderSources({ state, i18n }) {
  const t = i18n.t.bind(i18n);
  document.getElementById("sourcesList").innerHTML = state.sources
    .map((source) => {
      const health = source.status === "ok" ? "normal" : source.status === "degraded" ? "orange" : "red";
      return `
        <article class="glass-card rounded-2xl p-6 space-y-4">
          <div class="flex justify-between items-center">
            <div class="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <span class="material-symbols-outlined text-slate-400" data-icon="database">database</span>
            </div>
            <span class="pill ${severityClass(health)}">${t(`sourceHealth.${source.status}`) || source.status}</span>
          </div>
          <div>
            <h4 class="font-outfit text-lg font-bold text-slate-900 mb-1">${source.id}</h4>
            <p class="text-[10px] text-slate-400 font-bold uppercase truncate">${safeText(source.name)}</p>
          </div>
          <div class="space-y-2 pt-4 border-t border-slate-100">
            <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>${t("labels.sourceLastSuccess")}</span>
              <span class="text-slate-900">${i18n.formatDate(source.lastSuccessAt)}</span>
            </div>
            <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>${t("labels.sourceLatency")}</span>
              <span class="text-primary">${i18n.formatNumber(source.latencyMs, 0)} ms</span>
            </div>
            ${source.error ? `<div class="p-2 bg-red-50 text-[10px] text-red-600 rounded-lg mt-2">${source.error}</div>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

export function renderMap({ state, i18n, onTogglePanel, onLayerVisibilityChange }) {
  const t = i18n.t.bind(i18n);
  const panel = document.getElementById("mapLayersPanel");
  const extraLayers = state.mapSummary?.extraLayers || [];
  const layerRows = [
    { id: "stations", label: t("mapLayers.stations") },
    { id: "alerts", label: t("mapLayers.alerts") },
    ...extraLayers.map((layer) => ({
      id: layer.id,
      label: t(`mapLayers.${layer.id}`) === `mapLayers.${layer.id}` ? layer.title : t(`mapLayers.${layer.id}`),
      count: layer.featureCount,
    })),
  ];

  panel.classList.toggle("open", state.mapPanelOpen);
  panel.innerHTML = `
    <button type="button" class="map-layers-toggle" id="mapLayersToggle">
      <span>${state.mapPanelOpen ? t("mapLayersClose") : t("mapLayersOpen")}</span>
    </button>
    <div class="map-layers-drawer ${state.mapPanelOpen ? "open" : ""}">
      <div class="panel-head map-layers-head">
        <h4>${t("mapLayersTitle")}</h4>
      </div>
      <div class="map-layers-list">
        ${layerRows.map((layer) => `
          <label class="layer-toggle-row">
            <span class="layer-toggle-copy">
              <strong>${layer.label}</strong>
              ${layer.count != null ? `<small>${i18n.formatNumber(layer.count, 0)}</small>` : ""}
            </span>
            <input type="checkbox" data-layer-id="${layer.id}" ${state.mapLayerVisibility[layer.id] ? "checked" : ""} />
          </label>
        `).join("")}
      </div>
    </div>
  `;

  panel.querySelector("#mapLayersToggle")?.addEventListener("click", onTogglePanel);
  panel.querySelectorAll("input[data-layer-id]").forEach((input) => {
    input.addEventListener("change", (event) => {
      onLayerVisibilityChange(event.target.dataset.layerId, event.target.checked);
    });
  });

  renderLightMap({
    mapSummary: state.mapSummary,
    target: document.getElementById("mapCanvas"),
    t,
    layerVisibility: state.mapLayerVisibility,
  });
}
