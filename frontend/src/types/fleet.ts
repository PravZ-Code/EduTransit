export interface Stop {
  stop_id: string;
  name: string;
  lat: number;
  lng: number;
  scheduled_time: string;
  board_count: number;
  status: "PENDING" | "APPROACHING" | "ARRIVED" | "DEPARTED" | "DRIVE_BY_VISUAL_SWEEP" | "BYPASSED";
  requires_visual_sweep: boolean;
}

export interface RouteData {
  route_id: string;
  route_name: string;
  campus_id: string;
  category: "SCHOOL_K12" | "COLLEGE_HIGHER_ED";
  polyline: [number, number][]; // [lat, lng]
  corridor_buffer_meters: number;
  stops: Stop[];
}

export interface BusTelemetry {
  bus_id: string;
  registration_number: string;
  route_id: string;
  route_name?: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  heading_deg: number;
  status: "ON_TIME" | "DELAYED" | "CORRIDOR_DEVIATION" | "SOS_HALT" | "STANDBY_DEPLOYED";
  current_occupancy: number;
  capacity: number;
  next_stop_id: string;
  next_stop_name?: string;
  kalman_smoothed_eta_seconds: number;
  confidence_window?: string | null;
  distance_to_next_stop_m?: number | null;
  timestamp: string;
  driver_name: string;
  driver_phone: string;
  is_standby: boolean;
  compliance_rating: number;
}

export interface StudentPassenger {
  student_id: string;
  name: string;
  grade_or_dept: string;
  stop_id: string;
  bus_id: string;
  status: "WAITING" | "BOARDED" | "ABSENT" | "HANDED_OVER";
  emergency_contact: string;
}

export interface IncidentAlert {
  incident_id: string;
  bus_id: string;
  type: "LATERAL_DEVIATION" | "UNSCHEDULED_HALT" | "EARLY_DEPARTURE_PREVENTED" | "SOS_TRIGGERED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  timestamp: string;
}

export interface FleetState {
  buses: BusTelemetry[];
  routes: RouteData[];
  alerts: IncidentAlert[];
  passengers: StudentPassenger[];
}

export interface FleetStats {
  active_fleet: number;
  standby_fleet: number;
  on_time_pct: number;
  delayed_count: number;
  deviation_alerts: number;
  open_incidents: number;
  students_boarded: number;
  students_absent: number;
  fleet_load_pct: number;
  custody_chain_intact: boolean;
}

type BusStatus = BusTelemetry["status"];

/** Maps backend VehicleStatus enums + legacy client values into the radar status set. */
function mapBusStatus(raw: unknown): BusStatus {
  const s = String(raw || "").toUpperCase();
  switch (s) {
    case "CORRIDOR_DEVIATION":
    case "OFF_ROUTE":
      return "CORRIDOR_DEVIATION";
    case "SOS":
    case "SOS_HALT":
      return "SOS_HALT";
    case "DELAYED":
      return "DELAYED";
    case "STANDBY":
    case "STANDBY_DEPLOYED":
      return "STANDBY_DEPLOYED";
    default:
      return "ON_TIME";
  }
}

/** Backend demand_state -> radar stop status. */
function mapStopStatus(s: any): Stop["status"] {
  if (s.status) return s.status;
  switch (s.demand_state) {
    case "ZERO_DEMAND_VISUAL_SWEEP":
      return "DRIVE_BY_VISUAL_SWEEP";
    case "ZERO_DEMAND_BYPASS":
      return "BYPASSED";
    case "COMPLETED":
      return "DEPARTED";
    case "NORMAL":
      return "PENDING";
    default:
      return "PENDING";
  }
}

export function normalizeBusTelemetry(raw: any): BusTelemetry {
  const rawStatus = String(raw.status || "").toUpperCase();
  // A decommissioned (REPLACED) unit is retired to the reserve pool — never rendered in-transit.
  const isReplaced = rawStatus === "REPLACED";
  return {
    bus_id: String(raw.bus_id || ""),
    registration_number: String(raw.registration_number || raw.vehicle_number || "KA-01-BUS"),
    route_id: String(raw.route_id || ""),
    route_name: raw.route_name ? String(raw.route_name) : undefined,
    lat: Number(raw.lat) || 13.1186,
    lng: Number(raw.lng ?? raw.lon) || 80.0754,
    speed_kmh: Number(raw.speed_kmh) || 0,
    heading_deg: Number(raw.heading_deg ?? raw.bearing) || 0,
    status: mapBusStatus(raw.status),
    current_occupancy: Number(raw.current_occupancy ?? raw.occupancy) || 0,
    capacity: Number(raw.capacity) || 45,
    next_stop_id: String(raw.next_stop_id || ""),
    next_stop_name: raw.next_stop_name ? String(raw.next_stop_name) : undefined,
    kalman_smoothed_eta_seconds:
      Number(raw.kalman_smoothed_eta_seconds ?? raw.eta_next_stop_seconds) || 180,
    confidence_window: raw.confidence_window ? String(raw.confidence_window) : null,
    distance_to_next_stop_m:
      raw.distance_to_next_stop_m != null ? Number(raw.distance_to_next_stop_m) : null,
    timestamp: typeof raw.timestamp === "string" ? raw.timestamp : (raw.last_updated ? new Date(raw.last_updated * 1000).toISOString() : "2026-10-03T07:30:00.000Z"),
    driver_name: String(raw.driver_name || "Assigned Driver"),
    driver_phone: String(raw.driver_phone || "+91-98765-43210"),
    is_standby: Boolean(raw.is_standby) || isReplaced,
    compliance_rating: Number(raw.compliance_rating ?? raw.driver_rating) || 4.9,
  };
}

export function normalizeRouteData(raw: any): RouteData {
  return {
    route_id: String(raw.route_id || raw.id || ""),
    route_name: String(raw.route_name || raw.name || ""),
    campus_id: String(raw.campus_id || "campus-vidhana"),
    category: raw.category || (raw.institution_type === "SCHOOL_K12" ? "SCHOOL_K12" : "COLLEGE_HIGHER_ED"),
    corridor_buffer_meters: Number(raw.corridor_buffer_meters) || 75.0,
    polyline: (raw.polyline || raw.waypoints || []).map((pt: any) => [Number(pt[0]), Number(pt[1])]),
    stops: (raw.stops || []).map((s: any) => ({
      stop_id: String(s.stop_id || s.id || ""),
      name: String(s.name || ""),
      lat: Number(s.lat) || 0,
      lng: Number(s.lng ?? s.lon) || 0,
      scheduled_time: String(s.scheduled_time || "07:30 AM"),
      board_count: Number(s.board_count ?? s.expected_passengers) || 0,
      status: mapStopStatus(s),
      requires_visual_sweep: Boolean(s.requires_visual_sweep || s.demand_state === "ZERO_DEMAND_VISUAL_SWEEP"),
    })),
  };
}

