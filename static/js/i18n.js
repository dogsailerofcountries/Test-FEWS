export const translations = {
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
      source: "Fuente", issuedAt: "Fecha", metric: "Pobs SZH", sourceLastSuccess: "Último éxito", sourceLatency: "Latencia", sourceError: "Error", totalStations: "estaciones", noMapData: "Sin datos de mapa"
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
      source: "Source", issuedAt: "Issued at", metric: "Subzone metric", sourceLastSuccess: "Last success", sourceLatency: "Latency", sourceError: "Error", totalStations: "stations", noMapData: "No map data"
    },
    sourceHealth: { ok: "Healthy", degraded: "Degraded", down: "Down" }
  }
};

export function createI18n(initialLanguage = "es") {
  let language = initialLanguage;
  return {
    get language() { return language; },
    setLanguage(nextLanguage) { language = nextLanguage; },
    t(path) { return path.split(".").reduce((value, key) => value?.[key], translations[language]) ?? path; },
    formatNumber(value, decimals = 2) {
      if (value === null || value === undefined || Number.isNaN(value)) return "—";
      return new Intl.NumberFormat(language === "es" ? "es-CO" : "en-US", { maximumFractionDigits: decimals }).format(value);
    },
    formatDate(value) {
      if (!value) return "—";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return new Intl.DateTimeFormat(language === "es" ? "es-CO" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
    },
  };
}
