export function createStore(provider) {
  let activeProvider = provider;
  const initialTheme = localStorage.getItem("fews-theme") || "light";
  const initialFavorites = JSON.parse(localStorage.getItem("fews-favorites") || "[]");

  const state = {
    view: "overview",
    language: "es",
    theme: initialTheme,
    favorites: initialFavorites,
    loaded: {
      overview: false,
      stations: false,
      alerts: false,
      reservoirs: false,
      sources: false,
      map: false,
    },
    overview: null,
    stations: [],
    alerts: [],
    reservoirs: [],
    sources: [],
    mapSummary: null,
    mapPanelOpen: false,
    mapLayerVisibility: {
      alerts: true,
      stations: true,
    },
    selectedStationId: null,
    search: "",
    filters: {
      status: "",
      department: "",
    },
  };

  // Set initial theme on the document
  document.documentElement.setAttribute("data-theme", state.theme);

  return {
    state,
    setProvider(providerInstance, mode = "backend") {
      activeProvider = providerInstance;
      state.providerMode = mode;
      state.loaded = {
        overview: false,
        stations: false,
        alerts: false,
        reservoirs: false,
        sources: false,
        map: false,
      };
      state.overview = null;
      state.stations = [];
      state.alerts = [];
      state.reservoirs = [];
      state.sources = [];
      state.mapSummary = null;
      state.mapPanelOpen = false;
      state.mapLayerVisibility = {
        alerts: true,
        stations: true,
      };
      state.selectedStationId = null;
    },
    setLanguage(language) {
      state.language = language;
      activeProvider.setLanguage(language);
    },
    setTheme(theme) {
      state.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("fews-theme", theme);
    },
    toggleFavorite(stationId) {
      const index = state.favorites.indexOf(stationId);
      if (index === -1) {
        state.favorites.push(stationId);
      } else {
        state.favorites.splice(index, 1);
      }
      localStorage.setItem("fews-favorites", JSON.stringify(state.favorites));
    },
    setView(view) { 
      state.view = view; 
    },
    setSearch(search) { state.search = search; },
    setFilter(key, value) { state.filters[key] = value; },
    setSelectedStation(stationId) { state.selectedStationId = stationId; },
    setMapPanelOpen(isOpen) { state.mapPanelOpen = isOpen; },
    toggleMapPanel() { state.mapPanelOpen = !state.mapPanelOpen; },
    setMapLayerVisibility(layerId, isVisible) { state.mapLayerVisibility[layerId] = isVisible; },
    async ensureOverview() {
      if (state.loaded.overview) return state.overview;
      state.overview = await activeProvider.getOverview();
      state.loaded.overview = true;
      return state.overview;
    },
    async ensureStations() {
      if (state.loaded.stations) return state.stations;
      state.stations = await activeProvider.getStations();
      if (!state.selectedStationId && state.stations.length) state.selectedStationId = state.stations[0].stationId;
      state.loaded.stations = true;
      return state.stations;
    },
    async ensureAlerts() {
      if (state.loaded.alerts) return state.alerts;
      state.alerts = await activeProvider.getAlerts();
      state.loaded.alerts = true;
      return state.alerts;
    },
    async ensureReservoirs() {
      if (state.loaded.reservoirs) return state.reservoirs;
      state.reservoirs = await activeProvider.getReservoirs();
      state.loaded.reservoirs = true;
      return state.reservoirs;
    },
    async ensureSources() {
      if (state.loaded.sources) return state.sources;
      state.sources = await activeProvider.getSourceHealth();
      state.loaded.sources = true;
      return state.sources;
    },
    async ensureMapSummary() {
      if (state.loaded.map) return state.mapSummary;
      state.mapSummary = await activeProvider.getMapSummary();
      for (const layer of state.mapSummary?.extraLayers || []) {
        if (!(layer.id in state.mapLayerVisibility)) {
          state.mapLayerVisibility[layer.id] = Boolean(layer.visibleByDefault);
        }
      }
      state.loaded.map = true;
      return state.mapSummary;
    },
  };
}
