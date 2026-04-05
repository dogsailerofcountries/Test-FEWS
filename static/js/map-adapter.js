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
    case "yellow": return "#eab308";
    case "normal": return "#ffffff";
    default: return "#94a3b8";
  }
}

function stationFillColor(status) {
  switch (status) {
    case "red": return "#ef4444";
    case "orange": return "#f97316";
    case "yellow": return "#eab308";
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
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  mapState.alertsLayer = L.layerGroup().addTo(map);
  
  // Initialize MarkerCluster
  mapState.stationsLayer = L.markerClusterGroup({
    disableClusteringAtZoom: 10,
    maxClusterRadius: 40,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false
  }).addTo(map);
  
  mapState.mapInstance = map;
  mapState.target = target;
  mapState.extraLayerMap = new Map();
  
  // Set up filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget;
      const color = el.getAttribute('data-color');
      if (el.classList.contains('active')) {
        el.classList.remove('active');
        mapState.activeFilters.delete(color);
      } else {
        el.classList.add('active');
        mapState.activeFilters.add(color);
      }
      // Re-trigger render logic via custom event or just recall drawStations if we stored stations
      window.dispatchEvent(new CustomEvent('mapFiltersChanged'));
    });
  });

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
      weight: 1.5,
      opacity: 0.8,
      fillColor: color,
      fillOpacity: 0.35,
      className: 'map-alert'
    });

    const tooltipContent = `
      <div style="font-family: 'Inter', sans-serif;">
        <strong>${alert.subzoneName || '--'}</strong><br/>
        <span style="color:#64748b; font-size:0.85em;">Zone: ${alert.zoneName || '--'}</span><br/>
        <span style="font-weight:600; text-transform:uppercase; font-size:0.8em; color:${color}">${alert.severity || 'No Data'}</span>
      </div>
    `;
    
    poly.bindTooltip(tooltipContent);
    poly.addTo(layerGroup);
  });
}

function generateSparklineHTML(forecasts) {
  if (!forecasts || forecasts.length === 0) return '';
  // simple absolute heights based on array values relative to max
  const levels = forecasts.map(f => f.forecastLevel || 0);
  const max = Math.max(...levels) || 1;
  const bars = levels.map(val => {
    const heightPct = Math.max(10, (val / max) * 100);
    return `<div class="sparkline-bar" style="height: ${heightPct}%"></div>`;
  }).join('');
  
  return `<div style="font-size: 0.75rem; font-weight: 600; margin-top: 6px; color: #475569;">Nivel (Pronóstico)</div>
          <div class="sparkline-container">${bars}</div>`;
}

function drawStations(stations, layerGroup) {
  layerGroup.clearLayers();
  
  // Filter stations client-side
  const filtered = stations.filter(s => mapState.activeFilters.has(s.status || 'no_data'));

  filtered.forEach(station => {
    if (station.longitude == null || station.latitude == null) return;
    
    const color = stationFillColor(station.status || "no_data");
    
    const circle = L.circleMarker([station.latitude, station.longitude], {
      radius: station.status === "normal" ? 5 : 7,
      fillColor: color,
      color: '#ffffff',
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.9,
      className: 'map-point'
    });

    const sparklineHtml = generateSparklineHTML(station.forecastSummary);

    const tooltipContent = `
      <div style="font-family: 'Inter', sans-serif; min-width: 120px;">
        <strong>${station.stationName || '--'}</strong><br/>
        <span style="color:#64748b; font-size:0.85em;">River: ${station.riverName || '--'}</span><br/>
        <span style="font-weight:600; text-transform:uppercase; font-size:0.8em; color:${color}">${station.status || 'No Data'}</span>
        ${sparklineHtml}
      </div>
    `;
    
    circle.bindTooltip(tooltipContent, { className: 'custom-tooltip' });
    circle.on('click', () => {
      window.dispatchEvent(new CustomEvent('stationSelect', { detail: station.stationId }));
    });
    circle.addTo(layerGroup);
  });
}

// Keep a local ref to latest stations for filtering
let currentStations = [];

export async function renderLightMap({ mapSummary, target, t, layerVisibility = { alerts: true, stations: true } }) {
  const stations = mapSummary?.stations || [];
  const alerts = mapSummary?.alerts || [];
  
  currentStations = stations; // stash it

  if (!stations.length && !alerts.length) {
    target.innerHTML = `<div class="empty-state">${t("labels.noMapData")}</div>`;
    return;
  }

  if (target.innerHTML.includes('empty-state')) {
    target.innerHTML = '';
  }

  try {
    const map = await ensureMap(target);
    const dataSignature = computeDataSignature(mapSummary);

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);
    
    // We bind a one-time global listener for the filter change to redraw immediately if map is active
    if (!window._fewsFiltersBound) {
      window.addEventListener('mapFiltersChanged', () => {
        if (mapState.stationsLayer) {
           drawStations(currentStations, mapState.stationsLayer);
        }
      });
      window._fewsFiltersBound = true;
    }

    if (arcgisState?.dataSignature !== dataSignature) {
      if (typeof window.arcgisState !== 'undefined') window.arcgisState.dataSignature = dataSignature;
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
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
      }
    }

    // Toggle visibility based on layerVisibility proxy state
    if (layerVisibility.alerts === false) {
      map.removeLayer(mapState.alertsLayer);
    } else if (!map.hasLayer(mapState.alertsLayer)) {
      map.addLayer(mapState.alertsLayer);
    }

    if (layerVisibility.stations === false) {
      map.removeLayer(mapState.stationsLayer);
      document.querySelector('.map-controls').style.display = 'none';
    } else {
      if (!map.hasLayer(mapState.stationsLayer)) map.addLayer(mapState.stationsLayer);
      document.querySelector('.map-controls').style.display = 'block';
    }
  } catch (error) {
    console.warn("Leaflet error:", error);
    target.innerHTML = `<div class="empty-state">Map Error: ${error.message}</div>`;
  }
}

const arcgisState = { dataSignature: null };
