const arcgisState = {
  modulesPromise: null,
  view: null,
  map: null,
  alertsLayer: null,
  stationsLayer: null,
  target: null
};

function colorForStatus(status) {
  switch (status) {
    case "red":
      return [171, 44, 61, 0.78];
    case "orange":
      return [211, 109, 47, 0.72];
    case "yellow":
      return [230, 179, 37, 0.66];
    case "normal":
      return [45, 123, 95, 0.72];
    default:
      return [122, 132, 142, 0.2];
  }
}

function outlineForStatus(status) {
  switch (status) {
    case "red":
      return [128, 28, 43, 0.95];
    case "orange":
      return [163, 75, 24, 0.95];
    case "yellow":
      return [145, 110, 12, 0.95];
    case "normal":
      return [27, 92, 69, 0.95];
    default:
      return [98, 108, 116, 0.55];
  }
}

function updateBounds(bounds, x, y) {
  if (x == null || y == null) return;
  if (bounds.minX == null || x < bounds.minX) bounds.minX = x;
  if (bounds.maxX == null || x > bounds.maxX) bounds.maxX = x;
  if (bounds.minY == null || y < bounds.minY) bounds.minY = y;
  if (bounds.maxY == null || y > bounds.maxY) bounds.maxY = y;
}

function buildProjector(mapSummary, width, height, pad) {
  const bounds = { minX: null, maxX: null, minY: null, maxY: null };
  for (const station of mapSummary.stations || []) updateBounds(bounds, station.longitude, station.latitude);
  for (const alert of mapSummary.alerts || []) {
    for (const ring of alert.rings || []) {
      for (const point of ring) updateBounds(bounds, point[0], point[1]);
    }
  }
  const dx = (bounds.maxX ?? 0) - (bounds.minX ?? 0) || 1;
  const dy = (bounds.maxY ?? 0) - (bounds.minY ?? 0) || 1;
  return ([x, y]) => {
    const px = pad + ((x - (bounds.minX ?? 0)) / dx) * (width - pad * 2);
    const py = height - pad - ((y - (bounds.minY ?? 0)) / dy) * (height - pad * 2);
    return [px, py];
  };
}

function renderFallbackMap({ mapSummary, target, t }) {
  const stations = mapSummary?.stations || [];
  const alerts = mapSummary?.alerts || [];
  if (!stations.length && !alerts.length) {
    target.innerHTML = `<div class="empty-state">${t("labels.noMapData")}</div>`;
    return;
  }

  const width = 1000;
  const height = 640;
  const pad = 28;
  const project = buildProjector(mapSummary, width, height, pad);

  const alertShapes = alerts.map((alert) => {
    const severity = alert.severity || "no_data";
    const ringPaths = (alert.rings || []).map((ring) => {
      const path = ring.map((point, index) => {
        const [x, y] = project(point);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(" ");
      return path ? `${path} Z` : "";
    }).filter(Boolean);
    if (!ringPaths.length) return "";
    return `<path d="${ringPaths.join(" ")}" class="map-alert status-${severity}" fill="currentColor"></path>`;
  }).join("");

  const stationPoints = stations.slice(0, 1200).map((station) => {
    const [x, y] = project([station.longitude, station.latitude]);
    return `<circle class="map-point status-${station.status}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4.4"><title>${station.stationName || ""}</title></circle>`;
  }).join("");

  target.innerHTML = `<svg class="map-svg" viewBox="0 0 1000 640" preserveAspectRatio="none"><rect x="0" y="0" width="1000" height="640" fill="rgba(31,84,98,0.04)"></rect><g class="map-alerts">${alertShapes}</g><g class="map-stations">${stationPoints}</g></svg>`;
}

function loadArcGISModules() {
  if (arcgisState.modulesPromise) return arcgisState.modulesPromise;
  arcgisState.modulesPromise = new Promise((resolve, reject) => {
    if (!window.require) {
      reject(new Error("ArcGIS loader unavailable"));
      return;
    }
    window.require([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",
      "esri/geometry/Polygon",
      "esri/geometry/Point",
      "esri/geometry/Extent"
    ], (Map, MapView, GraphicsLayer, Graphic, Polygon, Point, Extent) => {
      resolve({ Map, MapView, GraphicsLayer, Graphic, Polygon, Point, Extent });
    }, reject);
  });
  return arcgisState.modulesPromise;
}

async function ensureArcGISMap(target) {
  const modules = await loadArcGISModules();
  if (arcgisState.view) {
    if (arcgisState.target !== target) {
      arcgisState.view.container = target;
      arcgisState.target = target;
    }
    return { ...modules, ...arcgisState };
  }

  const map = new modules.Map({
    basemap: "topo-vector"
  });
  const alertsLayer = new modules.GraphicsLayer({ title: "Alertas FEWS" });
  const stationsLayer = new modules.GraphicsLayer({ title: "Estaciones FEWS" });
  map.addMany([alertsLayer, stationsLayer]);

  const view = new modules.MapView({
    container: target,
    map,
    center: [-73.5, 4.5],
    zoom: 5,
    constraints: {
      minZoom: 4,
      maxZoom: 12
    },
    ui: {
      components: ["zoom", "attribution"]
    }
  });

  view.ui.move("zoom", "bottom-right");

  arcgisState.map = map;
  arcgisState.view = view;
  arcgisState.alertsLayer = alertsLayer;
  arcgisState.stationsLayer = stationsLayer;
  arcgisState.target = target;

  return { ...modules, ...arcgisState };
}

function buildAlertGraphic(alert, modules) {
  const severity = alert.severity || "no_data";
  return new modules.Graphic({
    geometry: new modules.Polygon({
      rings: alert.rings || [],
      spatialReference: { wkid: 4326 }
    }),
    symbol: {
      type: "simple-fill",
      color: colorForStatus(severity),
      outline: {
        color: outlineForStatus(severity),
        width: 1.4
      }
    },
    attributes: {
      name: alert.subzoneName || "--",
      zone: alert.zoneName || "--",
      severity
    },
    popupTemplate: {
      title: "{name}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "severity", label: "Severity" },
            { fieldName: "zone", label: "Zone" }
          ]
        }
      ]
    }
  });
}

function buildStationGraphic(station, modules) {
  const status = station.status || "no_data";
  return new modules.Graphic({
    geometry: new modules.Point({
      longitude: station.longitude,
      latitude: station.latitude,
      spatialReference: { wkid: 4326 }
    }),
    symbol: {
      type: "simple-marker",
      style: "triangle",
      color: colorForStatus(status),
      size: 8,
      outline: {
        color: [255, 255, 255, 0.95],
        width: 1.1
      }
    },
    attributes: {
      name: station.stationName || "--",
      river: station.riverName || "--",
      status
    },
    popupTemplate: {
      title: "{name}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "river", label: "River" },
            { fieldName: "status", label: "Status" }
          ]
        }
      ]
    }
  });
}

function buildExtent(mapSummary, modules) {
  const bounds = { minX: null, maxX: null, minY: null, maxY: null };
  for (const station of mapSummary.stations || []) updateBounds(bounds, station.longitude, station.latitude);
  for (const alert of mapSummary.alerts || []) {
    for (const ring of alert.rings || []) {
      for (const point of ring) updateBounds(bounds, point[0], point[1]);
    }
  }
  if (bounds.minX == null) return null;
  return new modules.Extent({
    xmin: bounds.minX,
    ymin: bounds.minY,
    xmax: bounds.maxX,
    ymax: bounds.maxY,
    spatialReference: { wkid: 4326 }
  }).expand(1.08);
}

async function renderArcGISMap({ mapSummary, target, t }) {
  const stations = mapSummary?.stations || [];
  const alerts = mapSummary?.alerts || [];
  if (!stations.length && !alerts.length) {
    target.innerHTML = `<div class="empty-state">${t("labels.noMapData")}</div>`;
    return;
  }

  const modules = await ensureArcGISMap(target);
  const alertGraphics = alerts
    .filter((alert) => (alert.rings || []).length)
    .map((alert) => buildAlertGraphic(alert, modules));
  const stationGraphics = stations
    .filter((station) => station.longitude != null && station.latitude != null)
    .map((station) => buildStationGraphic(station, modules));

  modules.alertsLayer.removeAll();
  modules.stationsLayer.removeAll();
  modules.alertsLayer.addMany(alertGraphics);
  modules.stationsLayer.addMany(stationGraphics);

  const extent = buildExtent(mapSummary, modules);
  if (extent) {
    modules.view.goTo(extent, {
      duration: 800
    }).catch(() => {});
  }
}

export function renderLightMap({ mapSummary, target, t }) {
  renderArcGISMap({ mapSummary, target, t }).catch((error) => {
    console.warn("Falling back to lightweight SVG map.", error);
    renderFallbackMap({ mapSummary, target, t });
  });
}
