export const translations = {
  es: {
    brandDescription: "Monitoreo FEWS con lectura operativa bilingue y foco en decisiones rapidas.",
    nav: {
      overview: "Resumen",
      purpose: "Proposito",
      stations: "Estaciones",
      alerts: "Alertas",
      map: "Mapa",
      reservoirs: "Embalses",
      sources: "Fuentes"
    },
    langLabel: "Idioma",
    topbarEyebrow: "FEWS Colombia / Demo tecnica",
    sourceHealthLabel: "Estado de fuentes",
    lastUpdateLabel: "Ultima actualizacion",
    overviewTitle: "Resumen operativo",
    purposeTitle: "Proposito de FEWS",
    stationsTitle: "Estaciones hidrologicas",
    alertsTitle: "Alertas por subzona",
    mapTitle: "Mapa operativo",
    mapLayersTitle: "Capas del mapa",
    mapLayersOpen: "Mostrar capas",
    mapLayersClose: "Ocultar capas",
    reservoirsTitle: "Embalses",
    sourcesTitle: "Estado de fuentes",
    overviewHeroEyebrow: "Monitoreo operativo publicado por FEWS",
    overviewHeroTitle: "Un FEWS mas claro, mas rapido y listo para web bilingue.",
    overviewHighlightedTitle: "Estaciones destacadas",
    overviewAlertsTitle: "Alertas activas",
    purposeIntroTitle: "Que es FEWS en esta demo",
    purposeIntroBody: "Esta version presenta FEWS como una plataforma de lectura operativa para hidrologia, alertas, pronosticos y embalses. La meta no es replicar cada detalle tecnico del visor actual, sino volver la informacion mas clara para seguimiento, comunicacion y toma de decisiones.",
    purposeGoalsTitle: "Objetivos de la nueva version",
    purposeGoalsItems: [
      "Priorizar severidad, contexto y lectura rapida antes que menus complejos.",
      "Mostrar estaciones, alertas, pronosticos y embalses dentro de una experiencia coherente.",
      "Mantener una interfaz bilingue en espanol e ingles sin duplicar la logica de datos.",
      "Preparar la app para una API propia que replique y publique snapshots recientes de FEWS."
    ],
    purposeHowTitle: "Como funciona hoy",
    purposeHowItems: [
      "La interfaz consume una API demo en Python que normaliza datos publicados por FEWS.",
      "Esa API actua como backend y como fuente viva hipotetica para la demostracion.",
      "Las vistas principales separan resumen, operacion, mapa, alertas y salud de fuentes.",
      "El mapa se mantiene como apoyo visual, mientras el resto de la app facilita lectura y filtro."
    ],
    statLabels: {
      red: "Roja",
      orange: "Naranja",
      yellow: "Amarilla",
      normal: "Normal",
      no_data: "Sin dato",
      total: "Total estaciones",
      reservoirs: "Embalses"
    },
    stationFiltersTitle: "Filtros",
    searchPlaceholder: "Buscar por estacion, rio, municipio o codigo",
    filterAllStatuses: "Todos los estados",
    filterAllDepartments: "Todos los departamentos",
    stationsTableTitle: "Listado de estaciones",
    stationDetailTitle: "Detalle de estacion",
    stationDetailEmpty: "Selecciona una estacion para ver nivel, umbrales y pronostico.",
    alertsTitlePanel: "Alertas publicadas por subzona hidrografica",
    reservoirsTitlePanel: "Embalses con volumen util y precipitacion",
    sourcesTitlePanel: "Diagnostico del adaptador FEWS",
    columns: {
      station: "Estacion",
      river: "Corriente",
      location: "Ubicacion",
      status: "Estado",
      reservoir: "Embalse",
      usefulVolume: "Vol. util",
      usefulPct: "% util",
      rainObs: "P. observada",
      rainForecast: "P. pronosticada"
    },
    labels: {
      river: "Corriente",
      subzone: "Subzona",
      zone: "Zona",
      municipality: "Municipio",
      department: "Departamento",
      altitude: "Altitud",
      category: "Categoria",
      currentObserved: "Nivel observado",
      currentSensor: "Nivel sensor",
      thresholds: "Umbrales",
      forecast: "Pronostico HQ",
      noForecast: "Sin pronostico disponible",
      source: "Fuente",
      issuedAt: "Fecha",
      metric: "Pobs SZH",
      sourceLastSuccess: "Ultimo exito",
      sourceLatency: "Latencia",
      sourceError: "Error",
      totalStations: "estaciones",
      noMapData: "Sin datos de mapa"
    },
    mapLayers: {
      stations: "Estaciones",
      alerts: "Alertas por subzona",
      subzone_pobs: "Pobs por subzona",
      water_shortage: "Desabastecimiento",
      runap: "RUNAP"
    },
    sourceHealth: {
      ok: "Operativo",
      degraded: "Degradado",
      down: "Caido"
    }
  },
  en: {
    brandDescription: "FEWS monitoring with bilingual operational reading and fast decision support.",
    nav: {
      overview: "Overview",
      purpose: "Purpose",
      stations: "Stations",
      alerts: "Alerts",
      map: "Map",
      reservoirs: "Reservoirs",
      sources: "Sources"
    },
    langLabel: "Language",
    topbarEyebrow: "FEWS Colombia / Technical demo",
    sourceHealthLabel: "Source health",
    lastUpdateLabel: "Last update",
    overviewTitle: "Operational overview",
    purposeTitle: "FEWS purpose",
    stationsTitle: "Hydrological stations",
    alertsTitle: "Subzone alerts",
    mapTitle: "Operational map",
    mapLayersTitle: "Map layers",
    mapLayersOpen: "Show layers",
    mapLayersClose: "Hide layers",
    reservoirsTitle: "Reservoirs",
    sourcesTitle: "Source health",
    overviewHeroEyebrow: "Operational monitoring published by FEWS",
    overviewHeroTitle: "A clearer, faster FEWS built for a bilingual web experience.",
    overviewHighlightedTitle: "Highlighted stations",
    overviewAlertsTitle: "Active alerts",
    purposeIntroTitle: "What FEWS is in this demo",
    purposeIntroBody: "This version presents FEWS as an operational reading platform for hydrology, alerts, forecasts, and reservoirs. The goal is not to copy every technical detail from the current viewer, but to make the information easier to scan, communicate, and act on.",
    purposeGoalsTitle: "Goals of the new version",
    purposeGoalsItems: [
      "Prioritize severity, context, and quick scanning before complex menus.",
      "Show stations, alerts, forecasts, and reservoirs inside one coherent experience.",
      "Keep the interface bilingual in Spanish and English without duplicating data logic.",
      "Prepare the app for a dedicated API that republishes recent FEWS snapshots."
    ],
    purposeHowTitle: "How it works today",
    purposeHowItems: [
      "The interface consumes a Python demo API that normalizes FEWS published data.",
      "That API acts both as backend and as the hypothetical live source for the demo.",
      "The main views separate overview, operations, map, alerts, and source health.",
      "The map remains a visual aid while the rest of the app makes reading and filtering easier."
    ],
    statLabels: {
      red: "Red",
      orange: "Orange",
      yellow: "Yellow",
      normal: "Normal",
      no_data: "No data",
      total: "Total stations",
      reservoirs: "Reservoirs"
    },
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
    columns: {
      station: "Station",
      river: "River",
      location: "Location",
      status: "Status",
      reservoir: "Reservoir",
      usefulVolume: "Useful vol.",
      usefulPct: "Useful %",
      rainObs: "Obs. rain",
      rainForecast: "Fcst. rain"
    },
    labels: {
      river: "River",
      subzone: "Subzone",
      zone: "Zone",
      municipality: "Municipality",
      department: "Department",
      altitude: "Altitude",
      category: "Category",
      currentObserved: "Observed level",
      currentSensor: "Sensor level",
      thresholds: "Thresholds",
      forecast: "HQ forecast",
      noForecast: "No forecast available",
      source: "Source",
      issuedAt: "Issued at",
      metric: "Subzone metric",
      sourceLastSuccess: "Last success",
      sourceLatency: "Latency",
      sourceError: "Error",
      totalStations: "stations",
      noMapData: "No map data"
    },
    mapLayers: {
      stations: "Stations",
      alerts: "Subzone alerts",
      subzone_pobs: "Observed rain by subzone",
      water_shortage: "Water shortage",
      runap: "RUNAP"
    },
    sourceHealth: {
      ok: "Healthy",
      degraded: "Degraded",
      down: "Down"
    }
  }
};

export function createI18n(initialLanguage = "es") {
  let language = initialLanguage;

  return {
    get language() {
      return language;
    },
    setLanguage(nextLanguage) {
      language = nextLanguage;
    },
    t(path) {
      return path.split(".").reduce((value, key) => value?.[key], translations[language]) ?? path;
    },
    formatNumber(value, decimals = 2) {
      if (value === null || value === undefined || Number.isNaN(value)) return "--";
      return new Intl.NumberFormat(language === "es" ? "es-CO" : "en-US", {
        maximumFractionDigits: decimals
      }).format(value);
    },
    formatDate(value) {
      if (!value) return "--";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return new Intl.DateTimeFormat(language === "es" ? "es-CO" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(parsed);
    }
  };
}
