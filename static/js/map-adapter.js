const mapState = {
  mapInstance: null,
  alertsLayer: null,
  stationsLayer: null,
  extraLayerMap: new Map(),
  target: null,
  dataSignature: null,
  activeFilters: new Set(['red', 'orange', 'yellow', 'normal', 'no_data'])
};

function alertFillColor(status) {
  switch (status) {
    case "red": return "#ef4444";
    case "orange": return "#f97316";
    case "yellow": return "#f59e0b";
    case "normal": return "#ffffff";
    default: return "#94a3b8";
  }
}

function stationFillColor(status) {
  switch (status) {
    case "red": return "#ef4444";
    case "orange": return "#f97316";
    case "yellow": return "#f59e0b";
    case "normal": return "#10b981";
    default: return "#94a3b8";
  }
}

function computeDataSignature(mapSummary) {
  const stations = mapSummary?.stations || [];
  const alerts = mapSummary?.alerts || [];
  return `${stations.length}:${alerts.length}`;
}

function ensureMap(target) {
  if (mapState.mapInstance && mapState.target === target) {
    return Promise.resolve(mapState.mapInstance);
  }

  if (mapState.mapInstance) {
    mapState.mapInstance.remove();
  }

  const map = L.map(target, {
    center: [4.5, -73.5],
    zoom: 5,
    minZoom: 4,
    maxZoom: 12,
    zoomControl: false // Custom position later or just leave out for cleaner look
  });

  // Natural "Real World" Theme (Esri World Topo)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxZoom: 18
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  mapState.alertsLayer = L.layerGroup().addTo(map);
  
  // Initialize MarkerCluster with custom styling
  mapState.stationsLayer = L.markerClusterGroup({
    disableClusteringAtZoom: 10,
    maxClusterRadius: 40,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="bg-primary/20 backdrop-blur-md border border-primary/40 text-primary rounded-full w-10 h-10 flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">${count}</div>`,
        className: 'cluster-icon',
        iconSize: [40, 40]
      });
    }
  }).addTo(map);
  
  mapState.mapInstance = map;
  mapState.target = target;
  mapState.extraLayerMap = new Map();
  
  return Promise.resolve(map);
}

function drawAlerts(alerts, layerGroup) {
  layerGroup.clearLayers();
  
  alerts.forEach(alert => {
    if (!alert.rings || !alert.rings.length) return;
    
    const latLngs = alert.rings.map(ring => 
      ring.map(coord => [coord[1], coord[0]])
    );

    const color = alertFillColor(alert.severity || "no_data");
    
    const poly = L.polygon(latLngs, {
      color: color,
      weight: 2,
      opacity: 0.6,
      fillColor: color,
      fillOpacity: 0.15,
      className: 'map-alert'
    });

    const tooltipContent = `
      <div class="glass-card p-3 rounded-xl border border-white/20 text-slate-900 dark:text-white min-w-[150px]">
        <div class="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/50 mb-1">Alerta Subzona</div>
        <strong class="font-outfit block mb-1">${alert.subzoneName || '--'}</strong>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
          <span class="text-[10px] font-bold uppercase tracking-tighter" style="color: ${color}">${alert.severity || 'No Data'}</span>
        </div>
      </div>
    `;
    
    poly.bindTooltip(tooltipContent, { sticky: true, className: 'map-glass-tooltip', direction: 'top', offset: [0, -10] });
    poly.addTo(layerGroup);
  });
}

function generateSparklineHTML(forecasts) {
  if (!forecasts || forecasts.length === 0) return '';
  const levels = forecasts.map(f => f.forecastLevel || 0);
  const max = Math.max(...levels) || 1;
  const bars = levels.map(val => {
    const heightPct = Math.max(10, (val / max) * 100);
    return `<div class="w-1 bg-primary/40 rounded-full" style="height: ${heightPct}%"></div>`;
  }).join('');
  
  return `
    <div class="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
      <div class="text-[8px] font-black uppercase text-slate-400 dark:text-white/40 mb-2">Pronóstico 72h</div>
      <div class="flex items-end gap-0.5 h-8">${bars}</div>
    </div>
  `;
}

function drawStations(stations, layerGroup) {
  layerGroup.clearLayers();
  
  const filtered = stations.filter(s => mapState.activeFilters.has(s.status || 'no_data'));

  filtered.forEach(station => {
    if (station.longitude == null || station.latitude == null) return;
    
    const color = stationFillColor(station.status || "no_data");
    const isNormal = station.status === "normal";
    
    const circle = L.circleMarker([station.latitude, station.longitude], {
      radius: isNormal ? 5 : 7,
      fillColor: color,
      color: isNormal ? 'transparent' : '#ffffff',
      weight: 1.5,
      opacity: 1,
      fillOpacity: 1,
      className: `map-point status-${station.status}`
    });

    const sparklineHtml = generateSparklineHTML(station.forecastSummary);

    const tooltipContent = `
      <div class="glass-card p-4 rounded-2xl border border-white/20 text-slate-900 dark:text-white min-w-[180px]">
        <div class="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/50 mb-1">${station.stationId}</div>
        <strong class="font-outfit text-base block mb-1">${station.stationName || '--'}</strong>
        <div class="flex items-center justify-between">
           <span class="text-[10px] font-medium text-slate-500 dark:text-white/70">${station.riverName || '--'}</span>
           <span class="pill status-${station.status} text-[8px] py-0.5 px-2">${station.status}</span>
        </div>
        ${sparklineHtml}
        <div class="mt-3 text-[9px] text-primary font-bold">Clic para más detalles →</div>
      </div>
    `;
    
    circle.bindTooltip(tooltipContent, { className: 'map-glass-tooltip', direction: 'top', offset: [0, -5] });
    circle.on('click', () => {
      window.dispatchEvent(new CustomEvent('stationSelect', { detail: station.stationId }));
    });
    circle.addTo(layerGroup);
  });
}

let currentStations = [];

export async function renderLightMap({ mapSummary, target, t, layerVisibility = { alerts: true, stations: true } }) {
  const stations = mapSummary?.stations || [];
  const alerts = mapSummary?.alerts || [];
  
  currentStations = stations;

  if (!stations.length && !alerts.length) {
    target.innerHTML = `<div class="h-full flex items-center justify-center text-slate-400 font-medium">${t("labels.noMapData")}</div>`;
    return;
  }

  try {
    const map = await ensureMap(target);
    const dataSignature = computeDataSignature(mapSummary);

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 500);
    
    if (!window._fewsFiltersBound) {
      window.addEventListener('mapFiltersChanged', () => {
        if (mapState.stationsLayer) {
           drawStations(currentStations, mapState.stationsLayer);
        }
      });
      window._fewsFiltersBound = true;
    }

    if (mapState.dataSignature !== dataSignature) {
      mapState.dataSignature = dataSignature;
      drawAlerts(alerts, mapState.alertsLayer);
      drawStations(stations, mapState.stationsLayer);

      const bounds = L.latLngBounds();
      stations.forEach(s => {
        if (s.latitude && s.longitude) bounds.extend([s.latitude, s.longitude]);
      });
      alerts.forEach(a => {
        if (a.rings) {
          a.rings.forEach(ring => {
            ring.forEach(coord => bounds.extend([coord[1], coord[0]]));
          });
        }
      });
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      }
    }

    if (layerVisibility.alerts === false) {
      map.removeLayer(mapState.alertsLayer);
    } else if (!map.hasLayer(mapState.alertsLayer)) {
      map.addLayer(mapState.alertsLayer);
    }

    if (layerVisibility.stations === false) {
      map.removeLayer(mapState.stationsLayer);
    } else if (!map.hasLayer(mapState.stationsLayer)) {
      map.addLayer(mapState.stationsLayer);
    }
  } catch (error) {
    console.warn("Leaflet error:", error);
    target.innerHTML = `<div class="h-full flex items-center justify-center text-red-400">Map Error: ${error.message}</div>`;
  }
}
