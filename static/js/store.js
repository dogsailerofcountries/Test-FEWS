export function createStore(provider) {
  let activeProvider = provider;
  const state = {
    view: "overview",
    language: "es",
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
    selectedStationId: null,
    search: "",
    filters: {
      status: "",
      department: "",
    },
  };

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
      state.selectedStationId = null;
    },
    setLanguage(language) {
      state.language = language;
      activeProvider.setLanguage(language);
    },
    setView(view) { state.view = view; },
    setSearch(search) { state.search = search; },
    setFilter(key, value) { state.filters[key] = value; },
    setSelectedStation(stationId) { state.selectedStationId = stationId; },
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
      state.loaded.map = true;
      return state.mapSummary;
    },
  };
}
