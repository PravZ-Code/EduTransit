"""
Pydantic Data Models & Schemas for EduTransit.
"""
from enum import Enum
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field

class InstitutionType(str, Enum):
    K12_SCHOOL = "K12_SCHOOL"
    COLLEGE = "COLLEGE"
    UNIVERSITY = "UNIVERSITY"

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    DRIVER = "DRIVER"
    ATTENDANT = "ATTENDANT"
    STUDENT = "STUDENT"
    PARENT = "PARENT"

class VehicleStatus(str, Enum):
    ON_TIME = "ON_TIME"        # Green glow
    DELAYED = "DELAYED"        # Amber pulse
    OFF_ROUTE = "OFF_ROUTE"    # Red warning
    SOS = "SOS"                # Critical Red
    STANDBY = "STANDBY"
    REPLACED = "REPLACED"

class StopDemandState(str, Enum):
    NORMAL = "NORMAL"
    ZERO_DEMAND_VISUAL_SWEEP = "ZERO_DEMAND_VISUAL_SWEEP"  # K-12 Invariant
    ZERO_DEMAND_BYPASS = "ZERO_DEMAND_BYPASS"              # Higher-Ed permitted
    COMPLETED = "COMPLETED"

class GPSPoint(BaseModel):
    lat: float
    lon: float
    speed_kmh: float = 0.0
    bearing: float = 0.0
    timestamp: float

class Stop(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    sequence: int
    scheduled_time: str
    expected_passengers: int = 0
    declared_absent: int = 0
    demand_state: StopDemandState = StopDemandState.NORMAL
    dwell_time_seconds: float = 15.0

class Route(BaseModel):
    id: str
    name: str
    institution_id: str
    campus_id: str
    institution_type: InstitutionType
    waypoints: List[List[float]] = []  # [[lat, lon], ...]
    stops: List[Stop] = []

class BusTelemetry(BaseModel):
    bus_id: str
    vehicle_number: str
    route_id: str
    route_name: str
    lat: float
    lon: float
    speed_kmh: float
    bearing: float
    status: VehicleStatus = VehicleStatus.ON_TIME
    delay_minutes: int = 0
    occupancy: int = 0
    capacity: int = 45
    driver_name: str
    driver_rating: float = 4.9
    is_gold_star: bool = True
    next_stop_id: Optional[str] = None
    next_stop_name: Optional[str] = None
    eta_next_stop: Optional[str] = None
    eta_next_stop_seconds: Optional[float] = None
    confidence_window: Optional[str] = None
    distance_to_next_stop_m: Optional[float] = None
    last_updated: float
    is_standby: bool = False
    trip_state: str = "SCHEDULED"            # SCHEDULED | IN_TRANSIT | COMPLETED
    rear_sweep_verified: bool = False        # Mandatory physical audit before trip end

class Passenger(BaseModel):
    id: str
    name: str
    role: str = "STUDENT"
    grade_or_dept: str
    assigned_bus_id: str
    assigned_route_id: str
    assigned_stop_id: str
    is_absent_today: bool = False
    is_boarded: bool = False
    boarding_time: Optional[str] = None
    parent_name: Optional[str] = None
    parent_contact_masked: Optional[str] = None

class AbsenceDeclarationRequest(BaseModel):
    student_id: str
    date: Optional[str] = None  # Defaults to today server-side
    reason: Optional[str] = "Sick / Leave"
    declared_by: Optional[str] = "PARENT_APP"

class BoardingRequest(BaseModel):
    student_id: str
    bus_id: str
    stop_id: str = ""
    auth_token: Optional[str] = None  # Dynamic expiring QR token
    method: str = "QR_SCAN"  # "QR_SCAN" | "PROXIMITY" | "MANUAL"
    client_lat: Optional[float] = None
    client_lon: Optional[float] = None

class ReplacementRequest(BaseModel):
    broken_bus_id: Optional[str] = None
    standby_bus_id: Optional[str] = None
    failed_bus_id: Optional[str] = None       # Legacy client alias
    replacement_bus_id: Optional[str] = None  # Legacy client alias
    reason: str = "Engine Breakdown"

    def resolve_ids(self) -> Tuple[str, str]:
        broken = self.broken_bus_id or self.failed_bus_id or ""
        standby = self.standby_bus_id or self.replacement_bus_id or ""
        return broken, standby

class SweepVerificationRequest(BaseModel):
    bus_id: str
    attendant_id: Optional[str] = None
    conductor_id: Optional[str] = None  # Legacy client alias
    rear_qr_payload: str = "EDUTRANSIT_REAR_SWEEP_VERIFIED_2026"
    notes: Optional[str] = "Physical sweep complete. 0 children remaining on bus."

    def resolve_attendant(self) -> str:
        return self.attendant_id or self.conductor_id or "cond-001"

class SosRequest(BaseModel):
    bus_id: str
    driver_id: Optional[str] = None
    reason: Optional[str] = "Driver SOS Panic Trigger"

class TripState(str, Enum):
    SCHEDULED = "SCHEDULED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"

class TripStartRequest(BaseModel):
    bus_id: str
    driver_id: Optional[str] = None

class TripEndRequest(BaseModel):
    bus_id: str
    driver_id: Optional[str] = None

class IncidentEvent(BaseModel):
    id: str
    bus_id: str
    route_id: str
    severity: str  # "MINOR" | "MODERATE" | "CRITICAL"
    event_type: str  # "ROUTE_DEVIATION" | "EXCESSIVE_HALT" | "SOS" | "BREAKDOWN"
    description: str
    timestamp: float
    resolved: bool = False
