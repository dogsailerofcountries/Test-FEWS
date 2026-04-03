import { createI18n } from "./i18n-next.js";
import { BackendProvider, DirectSourceProvider } from "./providers.js";
import { createStore } from "./store.js";
import { applyStaticTranslations, renderAlerts, renderMap, renderOverview, renderPurpose, renderReservoirs, renderSources, renderStations, renderTopbar, updateVisibleView } from "./renderers-next.js";

const i18n = createI18n("es");
const backendProvider = new BackendProvider("es");
const directProvider = new DirectSourceProvider("es");
const store = createStore(backendProvider);

async function ensureDataForView(view) {
  if (view === "overview") return Promise.all([store.ensureOverview(), store.ensureSources()]);
  if (view === "purpose") return Promise.resolve();
  if (view === "stations") return store.ensureStations();
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
  if (state.view === "overview") renderOverview({ state, i18n });
  if (state.view === "purpose") renderPurpose({ i18n });
  if (state.view === "stations") renderStations({ state, i18n, onStationSelect(stationId) { store.setSelectedStation(stationId); renderActiveView(); } });
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
  store.setView(view);
  await ensureDataForView(view);
  renderActiveView();
}

function bindEvents() {
  document.getElementById("languageSelect").addEventListener("change", (event) => {
    const language = event.target.value;
    store.setLanguage(language);
    i18n.setLanguage(language);
    backendProvider.setLanguage(language);
    directProvider.setLanguage(language);
    renderActiveView();
  });
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
