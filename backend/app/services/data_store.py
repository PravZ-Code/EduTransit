"""
In-Memory Thread-Safe Data Store & Seed Registry for EduTransit.
Seed coordinates precisely match Veltech University, Avadi (Chennai) and the
surrounding Chennai neighborhood corridors the fleet converges from:
- Thiruninravur (west radial)
- Pattabiram / Avadi Junction (CTH Road)
- Ambattur OT (east radial)
- Padi / Mogappair (south-eastern approach)
"""
import time
from typing import Dict, List, Optional
from app.models.schemas import (
    Route, Stop, BusTelemetry, Passenger, VehicleStatus,
    StopDemandState, InstitutionType, IncidentEvent
)

VELTECH_CAMPUS = [13.1186, 80.0754]  # Veltech University, Avadi — Main Gate

class DataStore:
    def __init__(self):
        self.routes: Dict[str, Route] = {}
        self.buses: Dict[str, BusTelemetry] = {}
        self.passengers: Dict[str, Passenger] = {}
        self.incidents: List[IncidentEvent] = []
        self._init_seed_data()

    def _init_seed_data(self):
        now = time.time()

        # 1. ROUTE 04N: Thiruninravur ➔ Pattabiram ➔ Veltech University (West Radial)
        r04_waypoints = [
            [13.1180, 80.0342],  # Thiruninravur Station Rd
            [13.1218, 80.0500],  # Outer Ring Rd stretch
            [13.1218, 80.0622],  # Pattabiram Station Halt
            [13.1201, 80.0690],  # Avadi Camp approach
            VELTECH_CAMPUS       # Veltech University Main Gate
        ]
        r04_stops = [
            Stop(id="s04_1", name="Thiruninravur Station", lat=13.1180, lon=80.0342, sequence=1, scheduled_time="07:35 AM", expected_passengers=6, declared_absent=0),
            Stop(id="s04_2", name="Pattabiram Outer Ring", lat=13.1218, lon=80.0622, sequence=2, scheduled_time="07:42 AM", expected_passengers=12, declared_absent=1),
            Stop(id="s04_3", name="Avadi Camp Crossing", lat=13.1201, lon=80.0690, sequence=3, scheduled_time="07:50 AM", expected_passengers=8, declared_absent=0),
            Stop(id="s04_4", name="Veltech University Main Gate", lat=VELTECH_CAMPUS[0], lon=VELTECH_CAMPUS[1], sequence=4, scheduled_time="08:00 AM", expected_passengers=0, declared_absent=0)
        ]
        self.routes["route_04n"] = Route(
            id="route_04n",
            name="Route 04N (Thiruninravur Express)",
            institution_id="inst_veltech_univ",
            campus_id="campus_avadi",
            institution_type=InstitutionType.UNIVERSITY,
            waypoints=r04_waypoints,
            stops=r04_stops
        )

        # 2. ROUTE 12C: Ambattur OT ➔ Avadi ➔ Veltech University (East Radial)
        r12_waypoints = [
            [13.1143, 80.1548],  # Ambattur OT Bus Stand
            [13.1101, 80.1330],  # Mannur / Venkatapuram
            [13.1012, 80.1002],  # Avadi Junction (CTH Road)
            [13.1080, 80.0870],  # Mittanamalli Rd
            VELTECH_CAMPUS       # Veltech University Main Gate
        ]
        r12_stops = [
            Stop(id="s12_1", name="Ambattur OT Bus Stand", lat=13.1143, lon=80.1548, sequence=1, scheduled_time="07:40 AM", expected_passengers=14, declared_absent=2),
            Stop(id="s12_2", name="Avadi Junction (CTH Rd)", lat=13.1012, lon=80.1002, sequence=2, scheduled_time="07:48 AM", expected_passengers=5, declared_absent=0),
            Stop(id="s12_3", name="Mittanamalli Junction", lat=13.1080, lon=80.0870, sequence=3, scheduled_time="07:55 AM", expected_passengers=9, declared_absent=1),
            Stop(id="s12_4", name="Veltech University Main Gate", lat=VELTECH_CAMPUS[0], lon=VELTECH_CAMPUS[1], sequence=4, scheduled_time="08:05 AM", expected_passengers=0, declared_absent=0)
        ]
        self.routes["route_12c"] = Route(
            id="route_12c",
            name="Route 12C (Ambattur Shuttle)",
            institution_id="inst_veltech_univ",
            campus_id="campus_avadi",
            institution_type=InstitutionType.COLLEGE,
            waypoints=r12_waypoints,
            stops=r12_stops
        )

        # 3. ROUTE 18E: Perambur ➔ Padi ➔ Avadi ➔ Veltech University (City Corridor)
        r18_waypoints = [
            [13.1211, 80.2330],  # Perambur High Rd
            [13.0969, 80.1437],  # Padi Roundtana
            [13.0955, 80.1110],  # Mogappair West
            [13.1012, 80.1002],  # Avadi Junction
            VELTECH_CAMPUS       # Veltech University Main Gate
        ]
        r18_stops = [
            Stop(id="s18_1", name="Perambur High Road", lat=13.1211, lon=80.2330, sequence=1, scheduled_time="07:38 AM", expected_passengers=11, declared_absent=0),
            Stop(id="s18_2", name="Padi Roundtana", lat=13.0969, lon=80.1437, sequence=2, scheduled_time="07:45 AM", expected_passengers=7, declared_absent=0),
            Stop(id="s18_3", name="Mogappair West Depot", lat=13.0955, lon=80.1110, sequence=3, scheduled_time="07:52 AM", expected_passengers=4, declared_absent=4),  # 4 absent -> 0 remaining
            Stop(id="s18_4", name="Veltech University Main Gate", lat=VELTECH_CAMPUS[0], lon=VELTECH_CAMPUS[1], sequence=4, scheduled_time="08:00 AM", expected_passengers=0, declared_absent=0)
        ]
        self.routes["route_18e"] = Route(
            id="route_18e",
            name="Route 18E (Perambur Corridor)",
            institution_id="inst_veltech_univ",
            campus_id="campus_avadi",
            institution_type=InstitutionType.UNIVERSITY,
            waypoints=r18_waypoints,
            stops=r18_stops
        )

        # 4. ACTIVE BUSES IN FLEET (mid-morning commute toward Veltech)
        self.buses["bus_04"] = BusTelemetry(
            bus_id="bus_04",
            vehicle_number="TN-13-F-4004",
            route_id="route_04n",
            route_name="Route 04N (Thiruninravur Express)",
            lat=13.1218,
            lon=80.0520,
            speed_kmh=36.0,
            bearing=95.0,
            status=VehicleStatus.ON_TIME,
            delay_minutes=0,
            occupancy=28,
            capacity=45,
            driver_name="Ramesh Kumar",
            driver_rating=4.95,
            is_gold_star=True,
            next_stop_id="s04_2",
            next_stop_name="Pattabiram Outer Ring",
            eta_next_stop="07:42 AM",
            confidence_window="07:41 - 07:43 AM",
            last_updated=now,
            trip_state="IN_TRANSIT"
        )

        self.buses["bus_12"] = BusTelemetry(
            bus_id="bus_12",
            vehicle_number="TN-13-F-1212",
            route_id="route_12c",
            route_name="Route 12C (Ambattur Shuttle)",
            lat=13.1125,
            lon=80.1450,
            speed_kmh=12.0,
            bearing=255.0,
            status=VehicleStatus.DELAYED,
            delay_minutes=7,
            occupancy=38,
            capacity=45,
            driver_name="S. Murthy",
            driver_rating=4.82,
            is_gold_star=False,
            next_stop_id="s12_2",
            next_stop_name="Avadi Junction (CTH Rd)",
            eta_next_stop="07:55 AM",
            confidence_window="07:53 - 07:57 AM",
            last_updated=now,
            trip_state="IN_TRANSIT"
        )

        self.buses["bus_18"] = BusTelemetry(
            bus_id="bus_18",
            vehicle_number="TN-13-F-1818",
            route_id="route_18e",
            route_name="Route 18E (Perambur Corridor)",
            lat=13.1020,
            lon=80.1700,
            speed_kmh=29.0,
            bearing=265.0,
            status=VehicleStatus.ON_TIME,
            delay_minutes=1,
            occupancy=18,
            capacity=45,
            driver_name="Anwar Khan",
            driver_rating=4.91,
            is_gold_star=True,
            next_stop_id="s18_2",
            next_stop_name="Padi Roundtana",
            eta_next_stop="07:46 AM",
            confidence_window="07:45 - 07:48 AM",
            last_updated=now,
            trip_state="IN_TRANSIT"
        )

        # 5. STANDBY BUS FOR 60-SEC REPLACEMENT CONTINGENCY (garaged at campus depot)
        self.buses["bus_standby_99"] = BusTelemetry(
            bus_id="bus_standby_99",
            vehicle_number="TN-13-F-9999",
            route_id="",
            route_name="Standby Reserve Fleet",
            lat=13.1178,
            lon=80.0730,
            speed_kmh=0.0,
            bearing=0.0,
            status=VehicleStatus.STANDBY,
            delay_minutes=0,
            occupancy=0,
            capacity=45,
            driver_name="Mohan Lal (Reserve Driver)",
            driver_rating=4.98,
            is_gold_star=True,
            last_updated=now,
            is_standby=True
        )

        # 6. SEED PASSENGERS (DAY SCHOLARS COMMUTING BETWEEN CHENNAI HOME STOPS & VELTECH)
        passengers_data = [
            ("p_101", "Aarav Sharma", "Computer Science 3rd Sem", "bus_04", "route_04n", "s04_2", "Suresh Sharma", "+91 98450 XXXXX"),
            ("p_102", "Diya Patel", "Electronics 5th Sem", "bus_04", "route_04n", "s04_2", "K. Patel", "+91 98451 XXXXX"),
            ("p_103", "Rohan Verma", "Mechanical 1st Sem", "bus_12", "route_12c", "s12_1", "V. Verma", "+91 98452 XXXXX"),
            ("p_104", "Ananya Reddy", "Biotech 7th Sem", "bus_18", "route_18e", "s18_1", "G. Reddy", "+91 98453 XXXXX"),
            ("p_105", "Karthik Nair", "Data Science 3rd Sem", "bus_18", "route_18e", "s18_3", "M. Nair", "+91 98454 XXXXX"),
        ]
        for pid, name, dept, bid, rid, sid, pname, pphone in passengers_data:
            self.passengers[pid] = Passenger(
                id=pid,
                name=name,
                grade_or_dept=dept,
                assigned_bus_id=bid,
                assigned_route_id=rid,
                assigned_stop_id=sid,
                parent_name=pname,
                parent_contact_masked=pphone
            )

# Global data store singleton
store = DataStore()
