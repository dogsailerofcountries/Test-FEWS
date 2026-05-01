import { createI18n } from "./i18n.js";
import { BackendProvider, DirectSourceProvider } from "./providers.js";
import { createStore } from "./store.js";
import { applyStaticTranslations, renderAlerts, renderMap, renderOverview, renderPurpose, renderReservoirs, renderSources, renderStations, renderStationDetail, renderTopbar, updateVisibleView } from "./renderers.js";

const i18n = createI18n("es");
const backendProvider = new BackendProvider("es");
const directProvider = new DirectSourceProvider("es");
const store = createStore(backendProvider);

async function ensureDataForView(view) {
  if (view === "overview") return Promise.all([store.ensureOverview(), store.ensureSources()]);
  if (view === "purpose") return Promise.resolve();
  if (view === "stations" || view === "stationDetail") return store.ensureStations();
  if (view === "alerts") return store.ensureAlerts();
  if (view === "reservoirs") return store.ensureReservoirs();
  if (view === "sources") return store.ensureSources();
  if (view === "map") return store.ensureMapSummary();
  return Promise.resolve();
}

function renderActiveView() {
  const { state } = store;
  applyStaticTranslations({ state, i18n });
  renderTopbar({ state, i18n });
  updateVisibleView(state);
  
  const onPinToggle = (stationId) => {
    store.toggleFavorite(stationId);
    renderActiveView();
  };

  if (state.view === "overview") renderOverview({ state, i18n, onPinToggle });
  if (state.view === "purpose") renderPurpose({ i18n });
  if (state.view === "stations") renderStations({ 
    state, 
    i18n, 
    onStationSelect(stationId) { 
      store.setSelectedStation(stationId); 
      renderActiveView(); 
    },
    onPinToggle
  });
  if (state.view === "stationDetail") renderStationDetail({ state, i18n, onPinToggle });
  if (state.view === "alerts") renderAlerts({ state, i18n });
  if (state.view === "reservoirs") renderReservoirs({ state, i18n });
  if (state.view === "sources") renderSources({ state, i18n });
  if (state.view === "map") {
    renderMap({
      state,
      i18n,
      onTogglePanel() {
        store.toggleMapPanel();
        renderActiveView();
      },
      onLayerVisibilityChange(layerId, isVisible) {
        store.setMapLayerVisibility(layerId, isVisible);
        renderActiveView();
      }
    });
  }
}

async function renderView(view) {
  const loadingBar = document.getElementById("loadingBar");
  if (loadingBar) loadingBar.classList.add("active");
  
  store.setView(view);
  await ensureDataForView(view);
  
  if (loadingBar) {
    loadingBar.classList.remove("active");
    loadingBar.classList.add("done");
    setTimeout(() => {
        loadingBar.classList.remove("done");
    }, 400);
  }
  renderActiveView();
}

function bindEvents() {
  // Sync the theme buttons on load
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.themeId === store.state.theme);
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const language = btn.dataset.lang;
      store.setLanguage(language);
      i18n.setLanguage(language);
      backendProvider.setLanguage(language);
      directProvider.setLanguage(language);
      
      document.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("active", b.dataset.lang === language));
      renderActiveView();
    });
  });

  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.themeId;
      store.setTheme(theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.themeId === theme));
      renderActiveView();
    });
  });
  window.addEventListener('stationSelect', (event) => {
    store.setSelectedStation(event.detail);
    renderView("stationDetail");
  });
  document.getElementById("btnBackToStations").addEventListener("click", () => renderView("stations"));
  document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", async () => { await renderView(button.dataset.view); }));
  document.getElementById("searchInput").addEventListener("input", (event) => {
    store.setSearch(event.target.value);
    if (store.state.view === "stations") renderActiveView();
  });
  document.getElementById("statusFilter").addEventListener("change", (event) => {
    store.setFilter("status", event.target.value);
    if (store.state.view === "stations") renderActiveView();
  });
  document.getElementById("departmentFilter").addEventListener("change", (event) => {
    store.setFilter("department", event.target.value);
    if (store.state.view === "stations") renderActiveView();
  });
}

async function bootstrap() {
  bindEvents();
  try {
    await Promise.all([store.ensureOverview(), store.ensureSources(), store.ensureStations()]);
  } catch (error) {
    console.warn("Backend provider failed, switching to direct source provider.", error);
    store.setProvider(directProvider, "direct");
    await Promise.all([store.ensureOverview(), store.ensureSources(), store.ensureStations()]);
  }
  renderActiveView();
}

bootstrap().catch((error) => {
  document.body.innerHTML = `<main class="empty-state"><div><h1>FEWS Web Nuevo</h1><p>${error.message}</p></div></main>`;
});
