from .config import MAX_SIMPLIFIED_RING_VERTICES
from .utils import parse_float


def _segment_sq_distance(point, start, end):
    x, y = start[0], start[1]
    dx = end[0] - x
    dy = end[1] - y
    if dx != 0 or dy != 0:
        t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy)
        if t > 1:
            x = end[0]
            y = end[1]
        elif t > 0:
            x += dx * t
            y += dy * t
    dx = point[0] - x
    dy = point[1] - y
    return dx * dx + dy * dy


def _douglas_peucker(points, tolerance_sq):
    if len(points) <= 2:
        return points[:]
    max_distance = tolerance_sq
    index = None
    for point_index in range(1, len(points) - 1):
        distance = _segment_sq_distance(points[point_index], points[0], points[-1])
        if distance > max_distance:
            index = point_index
            max_distance = distance
    if index is None:
        return [points[0], points[-1]]
    left = _douglas_peucker(points[: index + 1], tolerance_sq)
    right = _douglas_peucker(points[index:], tolerance_sq)
    return left[:-1] + right


def simplify_ring(points, max_vertices=MAX_SIMPLIFIED_RING_VERTICES):
    clean_points = []
    for point in points:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            continue
        x = parse_float(point[0])
        y = parse_float(point[1])
        if x is None or y is None:
            continue
        clean_points.append([x, y])

    if len(clean_points) < 4:
        return clean_points

    is_closed = clean_points[0] == clean_points[-1]
    open_points = clean_points[:-1] if is_closed else clean_points[:]
    if len(open_points) <= max_vertices:
        simplified = open_points
    else:
        tolerance_sq = 0.0
        simplified = open_points
        for step in range(1, 13):
            candidate = _douglas_peucker(open_points, tolerance_sq)
            simplified = candidate
            if len(candidate) <= max_vertices:
                break
            tolerance_sq = 10 ** (step - 6)

    if simplified and simplified[0] != simplified[-1]:
        simplified = simplified + [simplified[0]]
    if len(simplified) < 4 and clean_points:
        fallback = open_points[:3] if len(open_points) >= 3 else open_points[:]
        if fallback and fallback[0] != fallback[-1]:
            fallback = fallback + [fallback[0]]
        return fallback
    return simplified


def extract_simplified_rings(geometry):
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    rings = []
    if geometry_type == "Polygon":
        for ring in coordinates if isinstance(coordinates, list) else []:
            simplified = simplify_ring(ring)
            if simplified:
                rings.append(simplified)
    elif geometry_type == "MultiPolygon":
        for polygon in coordinates:
            for ring in polygon or []:
                simplified = simplify_ring(ring)
                if simplified:
                    rings.append(simplified)
    return rings
