"""
Telemetry Ingestion & Spatial Evaluation Service for EduTransit.
Executes:
1. Ingestion of live 3-second smartphone GPS coordinates.
2. Route corridor compliance auditing (+/- 75m buffer).
3. Monotonic Kalman ETA prediction with dynamic dwell adjustment.
4. Stop demand evaluation (Zero-demand bypass vs K-12 Visual Sweep interlock).
5. Downstream passenger impact targeting.
6. WebSocket fan-out to waiting mobile/web dashboards.
"""
import time
from typing import Dict, List, Any, Optional
from app.models.schemas import (
    BusTelemetry, VehicleStatus, StopDemandState, InstitutionType, IncidentEvent
)
from app.core.spatial import haversine_distance, calculate_bearing, cross_track_distance_to_polyline
from app.core.kalman import eta_smoother
from app.services.data_store import store

class TelemetryService:
    def __init__(self):
        self.active_connections: List[Any] = []

    async def register_ws(self, websocket: Any):
        self.active_connections.append(websocket)

    def unregister_ws(self, websocket: Any):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_fleet_update(self, payload: Dict[str, Any]):
        """
        Broadcasts telemetry packet to all connected WebSockets.
        Disconnected clients are safely purged.
        """
        stale = []
        for ws in self.active_connections:
            try:
                await ws.send_json(payload)
            except Exception:
                stale.append(ws)
        for dead in stale:
            self.unregister_ws(dead)

    def process_telemetry(self,
                          bus_id: str,
                          lat: float,
                          lon: float,
                          speed_kmh: float,
                          bearing: Optional[float] = None) -> BusTelemetry:
        """
        Ingests a live GPS ping, runs spatial checks, and returns updated telemetry.
        """
        now = time.time()
        bus = store.buses.get(bus_id)
        if not bus:
            raise ValueError(f"Vehicle '{bus_id}' not found in registry.")

        old_coord = (bus.lat, bus.lon)
        new_coord = (lat, lon)

        # 1. Compute dynamic heading bearing if not provided by device
        if bearing is None or bearing == 0.0:
            if haversine_distance(old_coord, new_coord) > 2.0:
                bearing = calculate_bearing(old_coord, new_coord)
            else:
                bearing = bus.bearing

        bus.lat = lat
        bus.lon = lon
        bus.speed_kmh = speed_kmh
        bus.bearing = bearing
        bus.last_updated = now

        # 2. Corridor Deviation Check (+/- 75m buffer)
        route = store.routes.get(bus.route_id)
        if route and len(route.waypoints) >= 2:
            dev_distance = cross_track_distance_to_polyline(new_coord, [(p[0], p[1]) for p in route.waypoints])
            if dev_distance > 75.0:
                bus.status = VehicleStatus.OFF_ROUTE
                # Trigger incident event if not already flagged
                if not any(inc.bus_id == bus_id and not inc.resolved for inc in store.incidents):
                    inc = IncidentEvent(
                        id=f"inc_{int(now)}",
                        bus_id=bus_id,
                        route_id=bus.route_id,
                        severity="MODERATE",
                        event_type="ROUTE_DEVIATION",
                        description=f"Bus {bus.vehicle_number} deviated by {int(dev_distance)}m from approved corridor.",
                        timestamp=now
                    )
                    store.incidents.append(inc)
            else:
                if bus.delay_minutes > 5:
                    bus.status = VehicleStatus.DELAYED
                else:
                    bus.status = VehicleStatus.ON_TIME

        # 3. Dynamic Stop Intelligence & ETA Calculation
        if route and route.stops:
            self._update_stop_progression_and_eta(bus, route)

        return bus

    def _update_stop_progression_and_eta(self, bus: BusTelemetry, route: Any):
        """
        Computes distance to upcoming stops, updates dwell times, and applies Kalman filter.
        """
        bus_coord = (bus.lat, bus.lon)
        closest_stop = None
        min_dist = float("inf")

        for stop in route.stops:
            if stop.demand_state == StopDemandState.COMPLETED:
                continue
                
            dist = haversine_distance(bus_coord, (stop.lat, stop.lon))
            
            # Arrival Polygon check: within 50m and stopped
            if dist < 50.0 and bus.speed_kmh < 10.0:
                stop.demand_state = StopDemandState.COMPLETED
                continue
                
            if dist < min_dist:
                min_dist = dist
                closest_stop = stop

        if closest_stop:
            bus.next_stop_id = closest_stop.id
            bus.next_stop_name = closest_stop.name
            
            # Dynamic Stop Demand Check
            effective_passengers = max(0, closest_stop.expected_passengers - closest_stop.declared_absent)
            if effective_passengers == 0:
                if route.institution_type == InstitutionType.K12_SCHOOL:
                    # Invariant 1: School stops cannot be skipped at speed.
                    closest_stop.demand_state = StopDemandState.ZERO_DEMAND_VISUAL_SWEEP
                    closest_stop.dwell_time_seconds = 5.0
                else:
                    # Invariant 1 (University): Bypass permitted.
                    closest_stop.demand_state = StopDemandState.ZERO_DEMAND_BYPASS
                    closest_stop.dwell_time_seconds = 0.0
            else:
                closest_stop.demand_state = StopDemandState.NORMAL
                closest_stop.dwell_time_seconds = 15.0 + (effective_passengers * 3.2)

            # Compute raw travel time
            avg_speed_mps = max(5.0, bus.speed_kmh * (1000.0 / 3600.0))
            raw_travel_sec = min_dist / avg_speed_mps
            total_predicted_sec = raw_travel_sec + closest_stop.dwell_time_seconds

            # Smooth via Asymmetric Kalman Filter
            key = f"{bus.bus_id}_{closest_stop.id}"
            smoothed_sec, min_sec, max_sec = eta_smoother.smooth_eta(key, total_predicted_sec, bus.speed_kmh)

            eta_min = int(smoothed_sec // 60)
            eta_sec = int(smoothed_sec % 60)
            bus.eta_next_stop = f"In {eta_min}m {eta_sec}s"
            
            min_m = int(min_sec // 60)
            max_m = int(max_sec // 60)
            bus.confidence_window = f"{min_m} - {max_m} mins"
            bus.eta_next_stop_seconds = round(smoothed_sec, 1)
            bus.distance_to_next_stop_m = round(min_dist, 1)

    def declare_absence(self, student_id: str, date: str, reason: str = "Absent") -> Dict[str, Any]:
        """
        Handles 'Not Travelling Today' ripple:
        1. Marks student absent.
        2. Recalculates expected stop counts.
        3. Updates stop demand state (Visual Sweep for K-12 vs Bypass for University).
        4. Re-evaluates bus passenger occupancy.
        """
        student = store.passengers.get(student_id)
        if not student:
            raise ValueError(f"Student '{student_id}' not found.")

        student.is_absent_today = True
        bus_id = student.assigned_bus_id
        route_id = student.assigned_route_id
        stop_id = student.assigned_stop_id

        route = store.routes.get(route_id)
        affected_stop = None
        if route:
            for s in route.stops:
                if s.id == stop_id:
                    s.declared_absent += 1
                    affected_stop = s
                    break

        bus = store.buses.get(bus_id)
        if bus:
            bus.occupancy = max(0, bus.occupancy - 1)

        net_expected = 0
        visual_sweep = False
        if affected_stop:
            net_expected = max(0, affected_stop.expected_passengers - affected_stop.declared_absent)
            if net_expected == 0:
                route_type = route.institution_type if route else None
                if route_type == InstitutionType.K12_SCHOOL:
                    affected_stop.demand_state = StopDemandState.ZERO_DEMAND_VISUAL_SWEEP
                    affected_stop.dwell_time_seconds = 5.0
                else:
                    affected_stop.demand_state = StopDemandState.ZERO_DEMAND_BYPASS
                    affected_stop.dwell_time_seconds = 0.0
            visual_sweep = affected_stop.demand_state == StopDemandState.ZERO_DEMAND_VISUAL_SWEEP

        return {
            "success": True,
            "student_id": student_id,
            "student_name": student.name,
            "assigned_bus_id": bus_id,
            "assigned_route_id": route_id,
            "assigned_stop_id": stop_id,
            "stop_name": affected_stop.name if affected_stop else "Unknown",
            "net_expected_boarding": net_expected,
            "updated_stop_demand": net_expected,
            "visual_sweep_required": visual_sweep,
            "demand_state": affected_stop.demand_state.value if affected_stop else "NORMAL"
        }

    def replace_vehicle(self, broken_bus_id: str, standby_bus_id: str, reason: str) -> Dict[str, Any]:
        """
        Executes 60-Second Replacement Bus Protocol:
        1. Validates broken vehicle and standby vehicle.
        2. Transfers route assignment, passengers, and manifest to standby vehicle.
        3. Marks original bus as REPLACED and activates standby vehicle.
        4. Emits incident log and returns migration payload.
        """
        now = time.time()
        broken = store.buses.get(broken_bus_id)
        standby = store.buses.get(standby_bus_id)

        if not broken or not standby:
            raise ValueError("Invalid broken or standby bus ID provided.")

        route_id = broken.route_id
        route_name = broken.route_name

        # Migrate manifest
        standby.route_id = route_id
        standby.route_name = route_name
        standby.status = VehicleStatus.ON_TIME
        standby.occupancy = broken.occupancy
        standby.capacity = broken.capacity
        standby.next_stop_id = broken.next_stop_id
        standby.next_stop_name = broken.next_stop_name
        standby.is_standby = False
        standby.trip_state = "IN_TRANSIT"  # Reserve pilot taps Start Trip on boarding the corridor

        # Mark broken bus as replaced and retire its active trip
        broken.status = VehicleStatus.REPLACED
        broken.speed_kmh = 0.0
        broken.trip_state = "COMPLETED"

        # Update passenger bindings
        for p in store.passengers.values():
            if p.assigned_bus_id == broken_bus_id:
                p.assigned_bus_id = standby_bus_id

        # Record Incident
        inc = IncidentEvent(
            id=f"inc_{int(now)}",
            bus_id=broken_bus_id,
            route_id=route_id,
            severity="CRITICAL",
            event_type="BREAKDOWN",
            description=f"Bus {broken.vehicle_number} replaced by Standby {standby.vehicle_number}. Reason: {reason}.",
            timestamp=now,
            resolved=True
        )
        store.incidents.append(inc)

        return {
            "success": True,
            "migrated_route": route_name,
            "migrated_passenger_count": broken.occupancy,
            "old_bus_number": broken.vehicle_number,
            "replacement_bus_number": standby.vehicle_number,
            "replacement_driver": standby.driver_name,
            "broadcast_message": f"⚠️ Bus {broken.vehicle_number} has been substituted with Bus {standby.vehicle_number}. Stops & schedule remain identical."
        }

    def trigger_sos(self, bus_id: str, reason: str = "Driver SOS Panic Trigger", driver_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Zero-Hardware SOS Protocol (In-App Red Button / Volume Rocker Double-Press).
        Halts the vehicle state, flags CRITICAL incident, and alerts every connected
        Supervisor / Institution radar over WebSocket.
        """
        now = time.time()
        bus = store.buses.get(bus_id)
        if not bus:
            raise ValueError(f"Vehicle '{bus_id}' not found in registry.")

        bus.status = VehicleStatus.SOS
        bus.speed_kmh = 0.0

        inc = IncidentEvent(
            id=f"inc_sos_{int(now)}",
            bus_id=bus_id,
            route_id=bus.route_id,
            severity="CRITICAL",
            event_type="SOS",
            description=f"🚨 EMERGENCY: Bus {bus.vehicle_number} triggered SOS. Reason: {reason}.",
            timestamp=now,
            resolved=False
        )
        store.incidents.append(inc)

        return {
            "success": True,
            "bus_id": bus_id,
            "vehicle_number": bus.vehicle_number,
            "driver_id": driver_id or bus.driver_name,
            "incident_id": inc.id,
            "message": "SOS beacon ACTIVE. Dispatch radar alerted with live position."
        }

    def resolve_sos(self, bus_id: str) -> Dict[str, Any]:
        """
        Clears the SOS halt after supervisor/driver confirmation and restores
        corridor-compliant ON_TIME / DELAYED status.
        """
        bus = store.buses.get(bus_id)
        if not bus:
            raise ValueError(f"Vehicle '{bus_id}' not found in registry.")

        was_sos = bus.status == VehicleStatus.SOS
        bus.status = VehicleStatus.DELAYED if bus.delay_minutes > 5 else VehicleStatus.ON_TIME

        for inc in store.incidents:
            if inc.bus_id == bus_id and inc.event_type == "SOS" and not inc.resolved:
                inc.resolved = True

        return {
            "success": True,
            "bus_id": bus_id,
            "was_active": was_sos,
            "restored_status": bus.status.value,
            "message": "SOS cleared. Vehicle resumed corridor operations."
        }

    def start_trip(self, bus_id: str, driver_id: Optional[str] = None) -> Dict[str, Any]:
        """
        PURE-SOFTWARE TRIP IGNITION (Zero Hardware):
        The driver explicitly taps "Start Trip" in the app. Only then does the
        smartphone foreground service begin emitting 3-second GPS breadcrumbs —
        replacing an ignition/box sensor entirely.
        """
        bus = store.buses.get(bus_id)
        if not bus:
            raise ValueError(f"Vehicle '{bus_id}' not found in registry.")
        if bus.trip_state == "IN_TRANSIT":
            raise ValueError(f"Trip already active on {bus.vehicle_number}. End the current trip first.")
        if bus.is_standby:
            raise ValueError("Standby reserve units cannot start trips until dispatched to a corridor.")

        bus.trip_state = "IN_TRANSIT"
        bus.rear_sweep_verified = False
        if bus.status == VehicleStatus.STANDBY:
            bus.status = VehicleStatus.ON_TIME

        return {
            "success": True,
            "bus_id": bus_id,
            "vehicle_number": bus.vehicle_number,
            "driver_id": driver_id or bus.driver_name,
            "trip_state": bus.trip_state,
            "foreground_service": "GPS_BEACON_ACTIVE_3S",
            "message": "Foreground GPS beacon engaged. Live telemetry streaming to corridor radar."
        }

    def end_trip(self, bus_id: str, driver_id: Optional[str] = None) -> Dict[str, Any]:
        """
        PURE-SOFTWARE TRIP TERMINATION INTERLOCK (Zero Hardware):
        The driver taps "End Trip" — but the trip can only terminate AFTER the
        conductor physically scans the rear-window paper QR (software-enforced
        child-sleep-sensor replacement). No scan, no termination.
        """
        bus = store.buses.get(bus_id)
        if not bus:
            raise ValueError(f"Vehicle '{bus_id}' not found in registry.")
        if bus.trip_state != "IN_TRANSIT":
            raise ValueError(f"No active trip on {bus.vehicle_number} to terminate.")

        if not bus.rear_sweep_verified:
            raise PermissionError(
                f"REAR SAFETY SWEEP PENDING: Conductor must physically scan the rear-window QR "
                f"on {bus.vehicle_number} before the trip can be closed. Anti-abandonment interlock engaged."
            )

        bus.trip_state = "COMPLETED"
        bus.speed_kmh = 0.0

        return {
            "success": True,
            "bus_id": bus_id,
            "vehicle_number": bus.vehicle_number,
            "driver_id": driver_id or bus.driver_name,
            "trip_state": bus.trip_state,
            "sweep_audit": "VERIFIED_SAFE",
            "message": "Trip terminated. Zero children remaining on board. Foreground GPS beacon disengaged."
        }

# Global singleton service
telemetry_service = TelemetryService()
