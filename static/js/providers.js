function parseFloatOrNull(value) {
  if (value === null || value === undefined || value === "" || value === "null") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStatus(rawValue) {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value === "normal") return "normal";
  if (value === "amarilla" || value === "yellow") return "yellow";
  if (value === "naranja" || value === "orange") return "orange";
  if (value === "roja" || value === "red") return "red";
  return "no_data";
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(";");
  return lines.slice(1).map((line) => {
    const values = line.split(";");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function segmentSqDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  const dx = end[0] - x;
  const dy = end[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  const diffX = point[0] - x;
  const diffY = point[1] - y;
  return diffX * diffX + diffY * diffY;
}

function douglasPeucker(points, toleranceSq) {
  if (points.length <= 2) return points.slice();
  let maxDistance = toleranceSq;
  let splitIndex = -1;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = segmentSqDistance(points[index], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      splitIndex = index;
      maxDistance = distance;
    }
  }
  if (splitIndex === -1) return [points[0], points[points.length - 1]];
  const left = douglasPeucker(points.slice(0, splitIndex + 1), toleranceSq);
  const right = douglasPeucker(points.slice(splitIndex), toleranceSq);
  return left.slice(0, -1).concat(right);
}

function simplifyRing(points, maxVertices = 320) {
  const cleanPoints = points
    .map((point) => [parseFloatOrNull(point?.[0]), parseFloatOrNull(point?.[1])])
    .filter((point) => point[0] != null && point[1] != null);
  if (cleanPoints.length < 4) return cleanPoints;
  const isClosed = cleanPoints[0][0] === cleanPoints[cleanPoints.length - 1][0]
    && cleanPoints[0][1] === cleanPoints[cleanPoints.length - 1][1];
  const openPoints = isClosed ? cleanPoints.slice(0, -1) : cleanPoints.slice();
  let simplified = openPoints;
  if (openPoints.length > maxVertices) {
    let toleranceSq = 0;
    for (let step = 1; step <= 12; step += 1) {
      simplified = douglasPeucker(openPoints, toleranceSq);
      if (simplified.length <= maxVertices) break;
      toleranceSq = 10 ** (step - 6);
    }
  }
  if (simplified.length && (simplified[0][0] !== simplified[simplified.length - 1][0] || simplified[0][1] !== simplified[simplified.length - 1][1])) {
    simplified = simplified.concat([simplified[0]]);
  }
  if (simplified.length < 4) {
    const fallback = openPoints.slice(0, Math.min(3, openPoints.length));
    return fallback.length ? fallback.concat([fallback[0]]) : [];
  }
  return simplified;
}

function extractSimplifiedRings(feature) {
  const geometry = feature?.geometry || {};
  const coordinates = geometry.coordinates || [];
  if (geometry.type === "Polygon") {
    return coordinates.map((ring) => simplifyRing(ring)).filter((ring) => ring.length >= 4);
  }
  if (geometry.type === "MultiPolygon") {
    return coordinates
      .flatMap((polygon) => polygon.map((ring) => simplifyRing(ring)))
      .filter((ring) => ring.length >= 4);
  }
  return [];
}

function normalizeLayerFeature(feature, fallbackLabel) {
  const geometry = feature?.geometry || {};
  const properties = feature?.properties || {};
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    const rings = extractSimplifiedRings(feature);
    if (!rings.length) return null;
    return {
      id: String(properties.id || properties.ID || properties.OBJECTID || properties.CODIGO || properties.NOM_MPIO || fallbackLabel),
      label: properties.NOMSZH || properties.NOM_MPIO || properties.municipio || properties.nombre || fallbackLabel,
      geometryType: "polygon",
      geometry: { rings },
      properties,
    };
  }
  if (geometry.type === "Point") {
    const coords = geometry.coordinates || [null, null];
    const x = parseFloatOrNull(coords[0]);
    const y = parseFloatOrNull(coords[1]);
    if (x == null || y == null) return null;
    return {
      id: String(properties.id || properties.ID || properties.OBJECTID || properties.CODIGO || fallbackLabel),
      label: properties.NOMSZH || properties.NOM_MPIO || properties.municipio || properties.nombre || fallbackLabel,
      geometryType: "point",
      geometry: { coordinates: [x, y] },
      properties,
    };
  }
  return null;
}

export class BackendProvider {
  constructor(language) { this.language = language; }
  setLanguage(language) { this.language = language; }
  async fetchJson(path) {
    const response = await fetch(`${path}${path.includes("?") ? "&" : "?"}lang=${this.language}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  getOverview() { return this.fetchJson("/api/overview"); }
  async getStations() { return (await this.fetchJson("/api/estaciones")).items; }
  getStationById(id) { return this.fetchJson(`/api/estaciones/${id}`); }
  async getAlerts() { return (await this.fetchJson("/api/alertas/subzonas")).items; }
  async getReservoirs() { return (await this.fetchJson("/api/embalses")).items; }
  getMapSummary() { return this.fetchJson("/api/map-summary"); }
  async getSourceHealth() { return (await this.fetchJson("/api/fuentes")).items; }
}

export class DirectSourceProvider {
  constructor(language) {
    this.language = language;
    this.manifestPromise = null;
  }
  setLanguage(language) { this.language = language; }
  async getManifest() {
    if (!this.manifestPromise) this.manifestPromise = fetch("/data/sources-manifest.json").then((response) => response.json());
    return this.manifestPromise;
  }
  async fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }
  async getStations() {
    const manifest = await this.getManifest();
    const data = JSON.parse(await this.fetchText(manifest.minimal.stations));
    return (data.features || []).map((feature) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates || [null, null];
      return {
        stationId: props.id,
        stationName: props.nombre,
        stationCode: props.id,
        riverName: props.corriente,
        subzoneName: props.subzona,
        zoneName: props.zona,
        populationCenter: props.cenpoblado,
        municipality: props.municipio,
        department: props.depart,
        category: props.ctg,
        altitude: parseFloatOrNull(props.altitud),
        longitude: parseFloatOrNull(coords[0]),
        latitude: parseFloatOrNull(coords[1]),
        currentLevelSensor: parseFloatOrNull(props.ultimonivelsen),
        currentLevelObserved: parseFloatOrNull(props.ultimonivelobs),
        thresholds: {
          yellow: parseFloatOrNull(props.uamarilla),
          orange: parseFloatOrNull(props.unaranja),
          red: parseFloatOrNull(props.uroja),
          low: parseFloatOrNull(props.ubajos),
          historicalMax: parseFloatOrNull(props.umaxhis),
        },
        status: normalizeStatus(props.Estado),
        forecastSummary: [],
      };
    });
  }
  async getStationById(id) {
    const stations = await this.getStations();
    return stations.find((item) => item.stationId === id) || null;
  }
  async getAlerts() {
    const manifest = await this.getManifest();
    const data = JSON.parse(await this.fetchText(manifest.minimal.alerts));
    return (data.features || []).map((feature) => {
      const props = feature.properties || {};
      return {
        subzoneId: String(props.SZH || props.id),
        subzoneName: props.NOMSZH,
        zoneName: props.NOMZH,
        macroAreaName: props.NOMAH,
        issuedAt: props.Fecha,
        severity: normalizeStatus(props.umbralaler),
        severityCode: props.Alerta,
        observedMetric: parseFloatOrNull(props.pobsszh),
        feature,
      };
    });
  }
  async getReservoirs() {
    const manifest = await this.getManifest();
    const rows = parseCsv(await this.fetchText(manifest.minimal.reservoirs));
    return rows.map((row) => ({
      reservoirId: row.ID_Embalse,
      timestamp: row.FECHA,
      usefulVolumeMass: parseFloatOrNull(row["Vol.util.masa"]),
      usefulVolumePct: parseFloatOrNull(row["Vol.util.porcentaje"]),
      observedPrecipitation: parseFloatOrNull(row["P.observada"]),
      forecastPrecipitation: parseFloatOrNull(row["P.pronosticada"]),
    }));
  }
  async getMapSummary() {
    const manifest = await this.getManifest();
    const [stations, alerts, pobsText, waterShortageText] = await Promise.all([
      this.getStations(),
      this.getAlerts(),
      this.fetchText(manifest.map_layers.subzone_pobs),
      this.fetchText(manifest.map_layers.water_shortage),
    ]);
    const pobsData = JSON.parse(pobsText);
    const waterShortageData = JSON.parse(waterShortageText);
    return {
      generatedAt: new Date().toISOString(),
      stations: stations.filter((station) => station.longitude != null && station.latitude != null).map((station) => ({
        stationId: station.stationId,
        stationName: station.stationName,
        status: station.status,
        longitude: station.longitude,
        latitude: station.latitude,
        riverName: station.riverName,
      })),
      alerts: alerts.map((alert) => {
        const rings = extractSimplifiedRings(alert.feature);
        let minX = null, maxX = null, minY = null, maxY = null, vertexCount = 0, sumX = 0, sumY = 0;
        for (const ring of rings) {
          for (const [x, y] of ring) {
            vertexCount += 1;
            sumX += x;
            sumY += y;
            minX = minX == null ? x : Math.min(minX, x);
            maxX = maxX == null ? x : Math.max(maxX, x);
            minY = minY == null ? y : Math.min(minY, y);
            maxY = maxY == null ? y : Math.max(maxY, y);
          }
        }
        return {
          subzoneId: alert.subzoneId,
          subzoneName: alert.subzoneName,
          zoneName: alert.zoneName,
          severity: alert.severity,
          issuedAt: alert.issuedAt,
          vertexCount,
          rings,
          bbox: { minX, maxX, minY, maxY },
          centroid: vertexCount ? { x: sumX / vertexCount, y: sumY / vertexCount } : null,
        };
      }),
      extraLayers: [
        {
          id: "subzone_pobs",
          title: "Precipitacion observada por subzona",
          visibleByDefault: false,
          styleHint: "pobs",
          featureCount: (pobsData.features || []).length,
          features: (pobsData.features || [])
            .map((feature) => normalizeLayerFeature(feature, "Pobs"))
            .filter(Boolean),
        },
        {
          id: "water_shortage",
          title: "Desabastecimiento por municipio",
          visibleByDefault: false,
          styleHint: "water_shortage",
          featureCount: (waterShortageData.features || []).length,
          features: (waterShortageData.features || [])
            .map((feature) => normalizeLayerFeature(feature, "Desabastecimiento"))
            .filter(Boolean),
        },
        {
          id: "runap",
          title: "RUNAP",
          visibleByDefault: false,
          styleHint: "service",
          featureCount: null,
          serviceUrl: manifest.map_layers.runap_service,
          layerId: 0,
        }
      ],
    };
  }
  async getSourceHealth() {
    const manifest = await this.getManifest();
    return [...Object.entries(manifest.minimal), ...Object.entries(manifest.map_layers || {})].map(([id, url]) => ({
      id,
      name: url,
      status: "ok",
      lastAttemptAt: new Date().toISOString(),
      lastSuccessAt: new Date().toISOString(),
      latencyMs: 0,
      error: null,
    }));
  }
  async getOverview() {
    const [stations, alerts, reservoirs, sourceStatuses] = await Promise.all([this.getStations(), this.getAlerts(), this.getReservoirs(), this.getSourceHealth()]);
    const stationCounts = { red: 0, orange: 0, yellow: 0, normal: 0, no_data: 0 };
    for (const station of stations) stationCounts[station.status] = (stationCounts[station.status] || 0) + 1;
    return {
      generatedAt: new Date().toISOString(),
      stationCounts,
      stationTotal: stations.length,
      highlightedStations: [...stations].sort((a, b) => (a.status < b.status ? 1 : -1)).slice(0, 12),
      activeAlerts: [...alerts].sort((a, b) => (a.severity < b.severity ? 1 : -1)).slice(0, 10),
      reservoirTotal: reservoirs.length,
      sourceStatuses,
    };
  }
}
