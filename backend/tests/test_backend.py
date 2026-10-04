"""
System Integrity & Automated Verification Suite for EduTransit Backend.
Benchmark: SIH Passing Rigor covering spatial algorithms, invariants, and APIs.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.spatial import (
    haversine_distance, calculate_bearing, cross_track_distance_to_polyline, is_point_in_polygon
)
from app.core.kalman import AsymmetricKalmanFilter
from app.services.data_store import store
from app.services.telemetry_service import telemetry_service
from app.models.schemas import VehicleStatus, StopDemandState, InstitutionType

client = TestClient(app)

def test_haversine_distance():
    # Distance between Vidhana Soudha and Cubbon Park (approx. 430 meters)
    p1 = (12.9796, 77.5907)
    p2 = (12.9763, 77.5929)
    dist = haversine_distance(p1, p2)
    assert 400.0 < dist < 480.0

def test_calculate_bearing():
    # Moving due North
    p1 = (12.0, 77.0)
    p2 = (13.0, 77.0)
    bearing = calculate_bearing(p1, p2)
    assert bearing == 0.0 or bearing == 360.0

    # Moving due East
    p3 = (12.0, 78.0)
    bearing_east = calculate_bearing(p1, p3)
    assert 89.0 <= bearing_east <= 91.0

def test_cross_track_deviation_detection():
    # Straight horizontal polyline along lat=12.9800
    polyline = [(12.9800, 77.5800), (12.9800, 77.6000)]
    
    # Point exactly on corridor
    on_route_point = (12.9800, 77.5900)
    dist_on = cross_track_distance_to_polyline(on_route_point, polyline)
    assert dist_on < 1.0

    # Point 100 meters North of corridor (exceeds +/-75m threshold)
    off_route_point = (12.9810, 77.5900)
    dist_off = cross_track_distance_to_polyline(off_route_point, polyline)
    assert dist_off > 75.0

def test_point_in_polygon():
    # Simple rectangular campus gate geofence
    campus_poly = [
        (12.9700, 77.5800),
        (12.9800, 77.5800),
        (12.9800, 77.5900),
        (12.9700, 77.5900)
    ]
    inside_point = (12.9750, 77.5850)
    outside_point = (12.9850, 77.5850)
    
    assert is_point_in_polygon(inside_point, campus_poly) is True
    assert is_point_in_polygon(outside_point, campus_poly) is False

def test_asymmetric_kalman_filter_smoothing():
    kf = AsymmetricKalmanFilter()
    # Initial estimate: 300 seconds
    smoothed, min_sec, max_sec = kf.smooth_eta("bus_test", 300.0, 35.0)
    assert smoothed == 300.0
    assert min_sec < 300.0 < max_sec

    # Sudden red light spike: raw estimate jumps to 500 seconds
    # Asymmetric filter should dampen the spike, NOT jump to 500
    smoothed_spike, _, _ = kf.smooth_eta("bus_test", 500.0, 0.0)
    assert smoothed_spike < 450.0  # Monotonically dampened

def test_dynamic_stop_demand_and_visual_sweep_invariant():
    # Reset seed data
    store._init_seed_data()
    route = store.routes["route_04n"]
    
    # Invariant: K-12 route with 0 passengers must require VISUAL SWEEP, never skip at speed
    route.institution_type = InstitutionType.K12_SCHOOL
    stop = route.stops[0]
    stop.expected_passengers = 2
    stop.declared_absent = 2  # 0 net passengers

    # Stage the bus immediately beside the stop under evaluation (nearest-stop picker)
    bus = store.buses["bus_04"]
    bus.lat = stop.lat + 0.0003
    bus.lon = stop.lon + 0.0005
    telemetry_service._update_stop_progression_and_eta(bus, route)
    
    assert stop.demand_state == StopDemandState.ZERO_DEMAND_VISUAL_SWEEP
    assert stop.dwell_time_seconds == 5.0

def test_absence_ripple_workflow():
    store._init_seed_data()
    # Student p_101 is on bus_04, route_04n, stop s04_2
    res = telemetry_service.declare_absence("p_101", "2026-10-03", "Fever")
    assert res["success"] is True
    assert res["student_name"] == "Aarav Sharma"
    
    # Verify student is flagged absent and stop counter updated
    student = store.passengers["p_101"]
    assert student.is_absent_today is True

def test_replacement_bus_contingency_protocol():
    store._init_seed_data()
    # Replace broken bus_12 with standby bus_standby_99
    res = telemetry_service.replace_vehicle("bus_12", "bus_standby_99", "Transmission Failure")
    assert res["success"] is True
    
    broken = store.buses["bus_12"]
    standby = store.buses["bus_standby_99"]
    
    assert broken.status == VehicleStatus.REPLACED
    assert standby.status == VehicleStatus.ON_TIME
    assert standby.route_id == "route_12c"
    assert standby.is_standby is False

# --- REST API Integration Tests ---

def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["zero_hardware_mode"] is True

def test_api_get_fleet():
    response = client.get("/api/v1/fleet")
    assert response.status_code == 200
    buses = response.json()
    assert len(buses) >= 3

def test_api_boarding_verification():
    # Valid QR boarding check-in
    payload = {
        "student_id": "p_101",
        "bus_id": "bus_04",
        "stop_id": "s04_2",
        "method": "QR_SCAN"
    }
    response = client.post("/api/v1/trips/board", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["boarding_status"] == "CONFIRMED"

def test_api_rear_sweep_audit():
    payload = {
        "bus_id": "bus_04",
        "attendant_id": "att_01",
        "rear_qr_payload": "EDUTRANSIT_REAR_SWEEP_VERIFIED_2026"
    }
    response = client.post("/api/v1/sweep/verify", json=payload)
    assert response.status_code == 200
    assert response.json()["sweep_status"] == "VERIFIED_SAFE"

def test_api_absence_minimal_payload_defaults():
    # Legacy mobile/parent clients omit 'date' — server must default to today.
    store._init_seed_data()
    response = client.post("/api/v1/trips/absence", json={"student_id": "p_102"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "updated_stop_demand" in data
    assert "visual_sweep_required" in data

def test_api_sos_trigger_and_resolve_lifecycle():
    store._init_seed_data()
    trigger = client.post("/api/v1/sos/trigger", json={"bus_id": "bus_04", "reason": "Medical Emergency"})
    assert trigger.status_code == 200
    assert trigger.json()["success"] is True

    bus = store.buses["bus_04"]
    assert bus.status == VehicleStatus.SOS

    open_incidents = [i for i in store.incidents if not i.resolved and i.event_type == "SOS"]
    assert len(open_incidents) == 1

    resolve = client.post("/api/v1/sos/resolve", params={"bus_id": "bus_04"})
    assert resolve.status_code == 200
    assert resolve.json()["restored_status"] in ("ON_TIME", "DELAYED")
    assert all(i.resolved for i in store.incidents if i.event_type == "SOS")

def test_api_replacement_legacy_aliases_and_auto_standby():
    store._init_seed_data()
    payload = {
        "failed_bus_id": "bus_12",  # legacy alias used by older web clients
        "reason": "Punctured Tire"
        # standby omitted -> server auto-selects reserve unit
    }
    response = client.post("/api/v1/fleet/replace", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "migrated_passenger_count" in data
    assert store.buses["bus_12"].status == VehicleStatus.REPLACED

def test_api_fleet_stats_summary():
    store._init_seed_data()
    response = client.get("/api/v1/stats/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["active_fleet"] >= 3
    assert 0.0 <= data["on_time_pct"] <= 100.0
    assert data["students_absent"] >= 0
    assert "custody_chain_intact" in data

def test_api_boarding_without_optional_stop_id():
    store._init_seed_data()
    payload = {"student_id": "p_101", "bus_id": "bus_04", "method": "QR_CAMERA_SCAN"}
    response = client.post("/api/v1/trips/board", json=payload)
    assert response.status_code == 200
    assert response.json()["boarding_status"] == "CONFIRMED"

def test_api_incident_resolve_endpoint():
    store._init_seed_data()
    trigger = client.post("/api/v1/sos/trigger", json={"bus_id": "bus_18"})
    assert trigger.status_code == 200
    incident_id = trigger.json()["incident_id"]

    resolved = client.post(f"/api/v1/incidents/{incident_id}/resolve")
    assert resolved.status_code == 200
    assert resolved.json()["resolved"] is True

    missing = client.post("/api/v1/incidents/inc_nonexistent/resolve")
    assert missing.status_code == 404

def test_api_pure_software_trip_lifecycle():
    """
    Zero-Hardware Invariant: No GPS beacon, no trip state change, without the
    driver explicitly tapping Start Trip / End Trip in the app. End Trip is
    cryptographically gated by the physical rear-window sweep audit.
    """
    store._init_seed_data()

    # End Trip WITHOUT rear sweep -> interlocked (409)
    end_blocked = client.post("/api/v1/trip/end", json={"bus_id": "bus_04"})
    assert end_blocked.status_code == 409
    assert "REAR SAFETY SWEEP" in end_blocked.json()["detail"]

    # Double-start of an already active trip -> rejected (409)
    start_rejected = client.post("/api/v1/trip/start", json={"bus_id": "bus_04"})
    assert start_rejected.status_code == 409

    # Standby reserve cannot spontaneously start a trip
    standby_start = client.post("/api/v1/trip/start", json={"bus_id": "bus_standby_99"})
    assert standby_start.status_code == 409

    # Conductor physically scans the rear-window paper QR (legacy client key)...
    sweep = client.post("/api/v1/sweep/verify", json={"bus_id": "bus_04", "conductor_id": "cond-001"})
    assert sweep.status_code == 200
    assert store.buses["bus_04"].rear_sweep_verified is True

    # ...End Trip now succeeds and halts the vehicle
    end_ok = client.post("/api/v1/trip/end", json={"bus_id": "bus_04"})
    assert end_ok.status_code == 200
    assert end_ok.json()["trip_state"] == "COMPLETED"
    assert store.buses["bus_04"].speed_kmh == 0.0

    # Ending a non-active trip again -> rejected
    end_again = client.post("/api/v1/trip/end", json={"bus_id": "bus_04"})
    assert end_again.status_code == 409

    # Fresh Start Trip re-arms the sweep interlock for the next cycle
    restart = client.post("/api/v1/trip/start", json={"bus_id": "bus_04"})
    assert restart.status_code == 200
    assert store.buses["bus_04"].trip_state == "IN_TRANSIT"
    assert store.buses["bus_04"].rear_sweep_verified is False
