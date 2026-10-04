"""
Spatial & Geodetic Engine for EduTransit.
Provides mathematical operations for:
- Haversine and Geodesic distance calculation
- Initial compass bearing (0-360 degrees) for true-heading 3D vehicle orientation
- Cross-track distance to polyline corridor for +/-75m lateral route deviation auditing
- Point-in-polygon ray-casting for campus gate and dual-layer geofencing
"""
import math
from typing import List, Tuple, Dict, Any, Optional

def haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate the great circle distance between two points on Earth in meters.
    coord: (lat, lon) in decimal degrees.
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return R * c

def calculate_bearing(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate the initial compass bearing from coord1 to coord2 in degrees (0 - 360).
    """
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    
    d_lon = lon2 - lon1
    y = math.sin(d_lon) * math.cos(lat2)
    x = (math.cos(lat1) * math.sin(lat2) -
         math.sin(lat1) * math.cos(lat2) * math.cos(d_lon))
    
    initial_bearing = math.atan2(y, x)
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360.0) % 360.0
    
    return round(compass_bearing, 1)

def point_to_segment_distance(point: Tuple[float, float],
                              seg_start: Tuple[float, float],
                              seg_end: Tuple[float, float]) -> float:
    """
    Calculate perpendicular distance in meters from a point to a line segment.
    Uses equirectangular planar projection approximation valid for local city coordinates.
    """
    lat, lon = point
    lat1, lon1 = seg_start
    lat2, lon2 = seg_end
    
    # Convert lat/lon degrees to meters relative to seg_start
    m_per_deg_lat = 111139.0
    m_per_deg_lon = 111139.0 * math.cos(math.radians((lat1 + lat2) / 2.0))
    
    px = (lon - lon1) * m_per_deg_lon
    py = (lat - lat1) * m_per_deg_lat
    
    dx = (lon2 - lon1) * m_per_deg_lon
    dy = (lat2 - lat1) * m_per_deg_lat
    
    seg_length_sq = dx * dx + dy * dy
    if seg_length_sq == 0:
        return math.sqrt(px * px + py * py)
    
    # Project point onto segment vector, clamp t to [0, 1]
    t = max(0.0, min(1.0, (px * dx + py * dy) / seg_length_sq))
    
    proj_x = t * dx
    proj_y = t * dy
    
    dist_x = px - proj_x
    dist_y = py - proj_y
    
    return math.sqrt(dist_x * dist_x + dist_y * dist_y)

def cross_track_distance_to_polyline(point: Tuple[float, float],
                                     polyline: List[Tuple[float, float]]) -> float:
    """
    Find minimum perpendicular distance from a point to any segment in a polyline.
    Returns distance in meters.
    """
    if len(polyline) == 0:
        return 0.0
    if len(polyline) == 1:
        return haversine_distance(point, polyline[0])
    
    min_dist = float("inf")
    for i in range(len(polyline) - 1):
        dist = point_to_segment_distance(point, polyline[i], polyline[i + 1])
        if dist < min_dist:
            min_dist = dist
            
    return round(min_dist, 2)

def is_point_in_polygon(point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
    """
    Ray-casting algorithm to determine if a (lat, lon) point lies within a polygon.
    """
    if len(polygon) < 3:
        return False
        
    x, y = point[1], point[0]  # lon, lat
    n = len(polygon)
    inside = False
    
    p1x, p1y = polygon[0][1], polygon[0][0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n][1], polygon[i % n][0]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
        
    return inside
