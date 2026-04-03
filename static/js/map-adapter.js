const mapState = {
  mapInstance: null,
  alertsLayer: null,
  stationsLayer: null,
  extraLayerMap: new Map(),
  target: null,
  dataSignature: null,
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

  // Uses Leaflet from global window.L
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
  mapState.stationsLayer = L.layerGroup().addTo(map);
  mapState.mapInstance = map;
  mapState.target = target;
  mapState.extraLayerMap = new Map();

  return Promise.resolve(map);
}

function drawAlerts(alerts, layerGroup) {
  layerGroup.clearLayers();
  
  alerts.forEach(alert => {
    if (!alert.rings || !alert.rings.length) return;
    
    // Leaflet uses [lat, lng]. Rings are usually [lng, lat] from GeoJSON
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

function drawStations(stations, layerGroup) {
  layerGroup.clearLayers();
  
  stations.forEach(station => {
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

    const tooltipContent = `
      <div style="font-family: 'Inter', sans-serif;">
        <strong>${station.stationName || '--'}</strong><br/>
        <span style="color:#64748b; font-size:0.85em;">River: ${station.riverName || '--'}</span><br/>
        <span style="font-weight:600; text-transform:uppercase; font-size:0.8em; color:${color}">${station.status || 'No Data'}</span>
      </div>
    `;
    
    circle.bindTooltip(tooltipContent);
    circle.on('click', () => {
      window.dispatchEvent(new CustomEvent('stationSelect', { detail: station.stationId }));
    });
    circle.addTo(layerGroup);
  });
}

export async function renderLightMap({ mapSummary, target, t, layerVisibility = { alerts: true, stations: true } }) {
  const stations = mapSummary?.stations || [];
  const alerts = mapSummary?.alerts || [];
  
  if (!stations.length && !alerts.length) {
    target.innerHTML = `<div class="empty-state">${t("labels.noMapData")}</div>`;
    return;
  }

  // Ensure DOM is ready for Leaflet if it wasn't
  if (target.innerHTML.includes('empty-state')) {
    target.innerHTML = '';
  }

  try {
    const map = await ensureMap(target);
    const dataSignature = computeDataSignature(mapSummary);

    if (arcgisState?.dataSignature !== dataSignature) {
      if (typeof window.arcgisState !== 'undefined') window.arcgisState.dataSignature = dataSignature;
      drawAlerts(alerts, mapState.alertsLayer);
      drawStations(stations, mapState.stationsLayer);

      // Fit bounds
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
    } else {
      map.addLayer(mapState.alertsLayer);
    }

    if (layerVisibility.stations === false) {
      map.removeLayer(mapState.stationsLayer);
    } else {
      map.addLayer(mapState.stationsLayer);
    }
  } catch (error) {
    console.warn("Leaflet error:", error);
    target.innerHTML = `<div class="empty-state">Map Error: ${error.message}</div>`;
  }
}

// Dummy for arcgisState reference backwards compatibility in local scope
const arcgisState = { dataSignature: null };
