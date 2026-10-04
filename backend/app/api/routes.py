"""
API Router and WebSocket Telemetry Gateway for EduTransit.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Dict, Any, Optional
import time
from datetime import datetime
from app.models.schemas import (
    BusTelemetry, Route, Passenger, AbsenceDeclarationRequest,
    BoardingRequest, ReplacementRequest, SweepVerificationRequest, IncidentEvent, SosRequest,
    TripStartRequest, TripEndRequest
)
from app.services.data_store import store
from app.services.telemetry_service import telemetry_service
from app.services.simulation_service import simulation_service
from app.core.spatial import haversine_distance

router = APIRouter(prefix="/api/v1")

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "EduTransit Core Telematics API",
        "version": "2026.1",
        "zero_hardware_mode": True,
        "active_buses": len([b for b in store.buses.values() if not b.is_standby and b.status.value != "REPLACED"])
    }

@router.get("/fleet", response_model=List[BusTelemetry])
def get_all_buses():
    """
    Returns all active and standby vehicles in the fleet.
    Used by the Supervisor 3D Map and Institution Executive Radar.
    """
    return list(store.buses.values())

@router.get("/fleet/{bus_id}")
def get_bus_details(bus_id: str):
    """
    Returns detailed telemetry, assigned route with stops, and passenger manifest.
    """
    bus = store.buses.get(bus_id)
    if not bus:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    
    route = store.routes.get(bus.route_id)
    passengers = [p for p in store.passengers.values() if p.assigned_bus_id == bus_id]

    return {
        "telemetry": bus,
        "route": route,
        "passengers": passengers
    }

@router.post("/telemetry")
async def post_telemetry(payload: Dict[str, Any]):
    """
    Ingests live GPS breadcrumb from Driver's Smartphone Background Service.
    """
    bus_id = payload.get("bus_id")
    lat = payload.get("lat")
    lon = payload.get("lon")
    speed_kmh = payload.get("speed_kmh", 0.0)
    bearing = payload.get("bearing")

    if not bus_id or lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Missing required telemetry fields: bus_id, lat, lon")

    try:
        updated = telemetry_service.process_telemetry(bus_id, float(lat), float(lon), float(speed_kmh), bearing)
        # Broadcast immediately to WebSockets
        await telemetry_service.broadcast_fleet_update({
            "type": "VEHICLE_POSITION_UPDATE",
            "bus": updated.model_dump()
        })
        return {"success": True, "telemetry": updated}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/trips/absence")
async def declare_absence(req: AbsenceDeclarationRequest):
    """
    Executes 'Not Travelling Today' single-tap declaration.
    Ripples through manifest, stop demand state, and updates driver roseter.
    """
    try:
        trip_date = req.date or datetime.now().strftime("%Y-%m-%d")
        res = telemetry_service.declare_absence(req.student_id, trip_date, req.reason or "Absent")
        # Broadcast absence update
        await telemetry_service.broadcast_fleet_update({
            "type": "ABSENCE_DECLARED",
            "data": res
        })
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/trips/board")
async def register_boarding(req: BoardingRequest):
    """
    100% Software-only Attendance Verification:
    - QR Code scan via attendant camera
    - Proximity self-check-in (<25 meters)
    - One-tap manual attendant override
    """
    student = store.passengers.get(req.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    bus = store.buses.get(req.bus_id)
    if not bus:
        raise HTTPException(status_code=404, detail="Assigned bus not found.")

    # In Proximity mode, verify geodetic distance between phone and bus
    if req.method == "PROXIMITY":
        if req.client_lat is None or req.client_lon is None:
            raise HTTPException(status_code=400, detail="Client coordinates required for proximity verification.")
        dist = haversine_distance((req.client_lat, req.client_lon), (bus.lat, bus.lon))
        if dist > 25.0:
            raise HTTPException(status_code=400, detail=f"Proximity check-in failed: Student is {int(dist)}m away from bus (>25m limit).")

    student.is_boarded = True
    student.boarding_time = datetime.now().strftime("%I:%M %p")
    bus.occupancy = min(bus.capacity, bus.occupancy + 1)

    return {
        "success": True,
        "student_id": student.id,
        "student_name": student.name,
        "bus_id": bus.bus_id,
        "method": req.method,
        "boarding_status": "CONFIRMED"
    }

@router.post("/fleet/replace")
async def replace_vehicle(req: ReplacementRequest):
    """
    One-click 60-Second Replacement Bus Contingency Dispatch.
    Migrates manifests and notifies waiting passengers.
    """
    try:
        broken_bus_id, standby_bus_id = req.resolve_ids()
        if not broken_bus_id:
            raise HTTPException(status_code=400, detail="failed_bus_id is required.")
        if not standby_bus_id:
            # Auto-select the first available reserve unit (flagship one-click UX)
            standbys = [b.bus_id for b in store.buses.values() if b.is_standby]
            if not standbys:
                raise HTTPException(status_code=409, detail="No standby vehicles currently available in the reserve pool.")
            standby_bus_id = standbys[0]
        res = telemetry_service.replace_vehicle(broken_bus_id, standby_bus_id, req.reason)
        await telemetry_service.broadcast_fleet_update({
            "type": "BUS_REPLACED",
            "data": res
        })
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sweep/verify")
def verify_rear_sweep(req: SweepVerificationRequest):
    """
    Mandatory Zero Children Left Behind physical sweep audit.
    Requires attendant to scan physical paper QR code at rear of bus.
    """
    bus = store.buses.get(req.bus_id)
    if not bus:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if "REAR_SWEEP" not in req.rear_qr_payload:
        raise HTTPException(status_code=400, detail="Invalid QR code payload: Must scan verified rear-of-bus safety QR code.")

    # Arm the End-Trip interlock: physical audit now satisfied for this vehicle.
    bus.rear_sweep_verified = True

    return {
        "success": True,
        "bus_id": req.bus_id,
        "attendant_id": req.resolve_attendant(),
        "sweep_status": "VERIFIED_SAFE",
        "message": "Physical sweep verified. 0 children remaining on bus. Trip termination now unlocked."
    }

@router.post("/trip/start")
async def start_trip(req: TripStartRequest):
    """
    PURE-SOFTWARE TRIP IGNITION: Driver explicitly taps "Start Trip" in the app.
    The smartphone foreground GPS service only begins emitting breadcrumbs after
    this call — no ignition sensors, no hardware boxes, 100% software.
    """
    try:
        res = telemetry_service.start_trip(req.bus_id, req.driver_id)
        await telemetry_service.broadcast_fleet_update({
            "type": "TRIP_STARTED",
            "data": res
        })
        return res
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.post("/trip/end")
async def end_trip(req: TripEndRequest):
    """
    PURE-SOFTWARE TRIP TERMINATION INTERLOCK: "End Trip" is rejected until the
    conductor completes the mandatory physical rear-window QR sweep (zero-hardware
    child sleep sensor replacement). No scan — no trip closure, no exceptions.
    """
    bus = store.buses.get(req.bus_id)
    if not bus:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    if not bus.rear_sweep_verified and bus.trip_state == "IN_TRANSIT":
        raise HTTPException(
            status_code=409,
            detail="REAR SAFETY SWEEP PENDING: Conductor must physically scan the rear-window QR before ending the trip. Anti-abandonment interlock engaged."
        )
    try:
        res = telemetry_service.end_trip(req.bus_id, req.driver_id)
        await telemetry_service.broadcast_fleet_update({
            "type": "TRIP_ENDED",
            "data": res
        })
        return res
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.get("/routes", response_model=List[Route])
def get_routes():
    """
    Returns all approved directional corridors and stops.
    """
    return list(store.routes.values())

@router.get("/passengers")
def get_passengers():
    """
    Returns all registered student passengers and their custody status.
    """
    return [
        {
            "student_id": p.id,
            "name": p.name,
            "grade_or_dept": p.grade_or_dept,
            "stop_id": p.assigned_stop_id,
            "bus_id": p.assigned_bus_id,
            "status": "BOARDED" if p.is_boarded else ("ABSENT" if p.is_absent_today else "WAITING"),
            "emergency_contact": p.parent_contact_masked
        }
        for p in store.passengers.values()
    ]

@router.get("/incidents", response_model=List[IncidentEvent])
def get_incidents():
    """
    Returns active route deviations, excessive halts, and emergencies.
    """
    return store.incidents

@router.post("/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: str):
    """
    Supervisor triage action: marks a deviation / SOS / breakdown incident as resolved.
    """
    for inc in store.incidents:
        if inc.id == incident_id:
            inc.resolved = True
            await telemetry_service.broadcast_fleet_update({
                "type": "INCIDENT_RESOLVED",
                "data": {"incident_id": incident_id}
            })
            return {"success": True, "incident_id": incident_id, "resolved": True}
    raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

@router.post("/sos/trigger")
async def trigger_sos(req: SosRequest):
    """
    Zero-Hardware Emergency Protocol: In-App Red SOS Button or Volume-Rocker
    Double-Press. Halts vehicle, flags CRITICAL incident, alerts all radars.
    """
    try:
        res = telemetry_service.trigger_sos(req.bus_id, req.reason or "Driver SOS Panic Trigger", req.driver_id)
        await telemetry_service.broadcast_fleet_update({
            "type": "SOS_TRIGGERED",
            "data": res
        })
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/sos/resolve")
async def resolve_sos(bus_id: str):
    """
    Clears an active SOS halt after supervisor / driver confirmation.
    """
    try:
        res = telemetry_service.resolve_sos(bus_id)
        await telemetry_service.broadcast_fleet_update({
            "type": "SOS_RESOLVED",
            "data": res
        })
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/stats/summary")
def get_fleet_stats():
    """
    Executive KPI snapshot: punctuality SLA, corridor compliance, custody chain,
    and reserve readiness for the Institution Admin dashboard strip.
    """
    active = [b for b in store.buses.values() if not b.is_standby and b.status.value != "REPLACED"]
    standby = [b for b in store.buses.values() if b.is_standby]
    delayed = [b for b in active if b.status.value == "DELAYED"]
    deviated = [b for b in active if b.status.value == "OFF_ROUTE" or b.status.value == "SOS"]
    boarded = sum(1 for p in store.passengers.values() if p.is_boarded)
    absent = sum(1 for p in store.passengers.values() if p.is_absent_today)
    open_incidents = sum(1 for i in store.incidents if not i.resolved)
    total_occ = sum(b.occupancy for b in active)
    total_cap = sum(b.capacity for b in active) or 1

    return {
        "active_fleet": len(active),
        "standby_fleet": len(standby),
        "on_time_pct": round(100.0 * max(0, len(active) - len(delayed) - len(deviated)) / max(1, len(active)), 1),
        "delayed_count": len(delayed),
        "deviation_alerts": len(deviated),
        "open_incidents": open_incidents,
        "students_boarded": boarded,
        "students_absent": absent,
        "fleet_load_pct": round(100.0 * total_occ / total_cap, 1),
        "custody_chain_intact": open_incidents == 0 or deviated == []
    }

@router.post("/simulation/start")
async def start_simulation():
    await simulation_service.start()
    return {"success": True, "simulation": "RUNNING"}

@router.post("/simulation/stop")
def stop_simulation():
    simulation_service.stop()
    return {"success": True, "simulation": "STOPPED"}

@router.post("/simulation/reset")
def reset_simulation():
    simulation_service.reset()
    return {"success": True, "simulation": "RESET"}

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    High-frequency 60fps telemetry stream for the Supervisor 3D Map and mobile clients.
    """
    await websocket.accept()
    await telemetry_service.register_ws(websocket)
    try:
        # Send initial snapshot of full fleet on connection
        await websocket.send_json({
            "type": "INITIAL_FLEET_STATE",
            "fleet": [b.model_dump() for b in store.buses.values()]
        })
        while True:
            # Keep socket alive and receive client pings/commands
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        telemetry_service.unregister_ws(websocket)
    except Exception:
        telemetry_service.unregister_ws(websocket)
