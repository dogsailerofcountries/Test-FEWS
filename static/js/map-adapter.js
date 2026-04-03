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
    if (alert.centroid) updateBounds(bounds, alert.centroid.x, alert.centroid.y);
  }
  const dx = (bounds.maxX ?? 0) - (bounds.minX ?? 0) || 1;
  const dy = (bounds.maxY ?? 0) - (bounds.minY ?? 0) || 1;
  return ([x, y]) => {
    const px = pad + ((x - (bounds.minX ?? 0)) / dx) * (width - pad * 2);
    const py = height - pad - ((y - (bounds.minY ?? 0)) / dy) * (height - pad * 2);
    return [px, py];
  };
}

export function renderLightMap({ mapSummary, target, t }) {
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

  target.innerHTML = `<svg class="map-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><rect x="0" y="0" width="${width}" height="${height}" fill="rgba(31,84,98,0.04)"></rect><g class="map-alerts">${alertShapes}</g><g class="map-stations">${stationPoints}</g></svg>`;
}
