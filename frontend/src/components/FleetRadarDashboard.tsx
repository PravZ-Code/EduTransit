"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { TopNavPill, FleetFilter, ConnectionState } from "@/components/TopNavPill";
import { MapRadar } from "@/components/MapRadar";
import { FleetDrawer } from "@/components/FleetDrawer";
import { AlertsPanel } from "@/components/AlertsPanel";
import {
  BusTelemetry,
  RouteData,
  StudentPassenger,
  FleetStats,
  normalizeBusTelemetry,
  normalizeRouteData,
} from "@/types/fleet";
import { API_BASE, WS_URL, fetchJson } from "@/lib/api";

const FALLBACK_BUSES: BusTelemetry[] = [
  {
    bus_id: "bus-001",
    registration_number: "KA-01-ET-1001",
    route_id: "route-04n",
    lat: 12.9796,
    lng: 77.5907,
    speed_kmh: 34.0,
    heading_deg: 45.0,
    status: "ON_TIME",
    current_occupancy: 32,
    capacity: 45,
    next_stop_id: "stop-04n-2",
    kalman_smoothed_eta_seconds: 225.0,
    timestamp: "2026-10-03T07:30:00.000Z",
    driver_name: "Ramesh Gowda",
    driver_phone: "+91-98765-43210",
    is_standby: false,
    compliance_rating: 4.95,
  },
  {
    bus_id: "bus-002",
    registration_number: "KA-01-ET-1002",
    route_id: "route-12c",
    lat: 12.9745,
    lng: 77.5995,
    speed_kmh: 12.0,
    heading_deg: 90.0,
    status: "DELAYED",
    current_occupancy: 41,
    capacity: 45,
    next_stop_id: "stop-12c-2",
    kalman_smoothed_eta_seconds: 540.0,
    timestamp: "2026-10-03T07:30:00.000Z",
    driver_name: "Suresh Patil",
    driver_phone: "+91-98765-43211",
    is_standby: false,
    compliance_rating: 4.62,
  },
  {
    bus_id: "bus-003",
    registration_number: "KA-01-ET-1003",
    route_id: "route-18e",
    lat: 12.9778,
    lng: 77.5942,
    speed_kmh: 28.0,
    heading_deg: 180.0,
    status: "ON_TIME",
    current_occupancy: 28,
    capacity: 45,
    next_stop_id: "stop-18e-2",
    kalman_smoothed_eta_seconds: 310.0,
    timestamp: "2026-10-03T07:30:00.000Z",
    driver_name: "Anand Kumar",
    driver_phone: "+91-98765-43212",
    is_standby: false,
    compliance_rating: 4.98,
  },
  {
    bus_id: "bus-099",
    registration_number: "KA-01-ET-9099",
    route_id: "standby-central",
    lat: 12.9760,
    lng: 77.5930,
    speed_kmh: 0.0,
    heading_deg: 0.0,
    status: "STANDBY_DEPLOYED",
    current_occupancy: 0,
    capacity: 50,
    next_stop_id: "none",
    kalman_smoothed_eta_seconds: 0.0,
    timestamp: "2026-10-03T07:30:00.000Z",
    driver_name: "Venkatesh Rao (Standby Pilot)",
    driver_phone: "+91-98765-43299",
    is_standby: true,
    compliance_rating: 5.0,
  },
];

const FALLBACK_ROUTES: RouteData[] = [
  {
    route_id: "route-04n",
    route_name: "North Day-Scholar Corridor",
    campus_id: "campus-vidhana",
    category: "SCHOOL_K12",
    corridor_buffer_meters: 75.0,
    polyline: [
      [12.9796, 77.5907],
      [12.9815, 77.5932],
      [12.9840, 77.5960],
      [12.9875, 77.5990],
    ],
    stops: [
      {
        stop_id: "stop-04n-1",
        name: "Vidhana Soudha North Gate",
        lat: 12.9796,
        lng: 77.5907,
        scheduled_time: "07:30 AM",
        board_count: 14,
        status: "DEPARTED",
        requires_visual_sweep: false,
      },
      {
        stop_id: "stop-04n-2",
        name: "GPO Roundabout",
        lat: 12.9815,
        lng: 77.5932,
        scheduled_time: "07:38 AM",
        board_count: 8,
        status: "APPROACHING",
        requires_visual_sweep: false,
      },
      {
        stop_id: "stop-04n-3",
        name: "Raj Bhavan Crossing",
        lat: 12.9840,
        lng: 77.5960,
        scheduled_time: "07:45 AM",
        board_count: 10,
        status: "PENDING",
        requires_visual_sweep: false,
      },
    ],
  },
  {
    route_id: "route-12c",
    route_name: "Central Cubbon Park Corridor",
    campus_id: "campus-vidhana",
    category: "COLLEGE_HIGHER_ED",
    corridor_buffer_meters: 75.0,
    polyline: [
      [12.9745, 77.5995],
      [12.9768, 77.5960],
      [12.9796, 77.5907],
    ],
    stops: [
      {
        stop_id: "stop-12c-1",
        name: "MG Road Metro Junction",
        lat: 12.9745,
        lng: 77.5995,
        scheduled_time: "07:35 AM",
        board_count: 18,
        status: "DEPARTED",
        requires_visual_sweep: false,
      },
      {
        stop_id: "stop-12c-2",
        name: "Cubbon Park Library Halt",
        lat: 12.9768,
        lng: 77.5960,
        scheduled_time: "07:44 AM",
        board_count: 23,
        status: "APPROACHING",
        requires_visual_sweep: false,
      },
    ],
  },
];

const FALLBACK_PASSENGERS: StudentPassenger[] = [
  {
    student_id: "p_101",
    name: "Aarav Sharma",
    grade_or_dept: "Computer Science 3rd Sem",
    stop_id: "s04_2",
    bus_id: "bus_04",
    status: "WAITING",
    emergency_contact: "+91 98450 XXXXX",
  },
  {
    student_id: "p_102",
    name: "Diya Patel",
    grade_or_dept: "Electronics 5th Sem",
    stop_id: "s04_2",
    bus_id: "bus_04",
    status: "WAITING",
    emergency_contact: "+91 98451 XXXXX",
  },
  {
    student_id: "p_103",
    name: "Rohan Verma",
    grade_or_dept: "Mechanical 1st Sem",
    stop_id: "s12_1",
    bus_id: "bus_12",
    status: "WAITING",
    emergency_contact: "+91 98452 XXXXX",
  },
  {
    student_id: "p_104",
    name: "Ananya Reddy",
    grade_or_dept: "Biotech 7th Sem",
    stop_id: "s18_1",
    bus_id: "bus_18",
    status: "WAITING",
    emergency_contact: "+91 98453 XXXXX",
  },
];

export default function FleetRadarDashboard() {
  const [buses, setBuses] = useState<BusTelemetry[]>(FALLBACK_BUSES);
  const [routes, setRoutes] = useState<RouteData[]>(FALLBACK_ROUTES);
  const [passengers, setPassengers] = useState<StudentPassenger[]>(FALLBACK_PASSENGERS);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [resetCounter, setResetCounter] = useState<number>(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>("OFFLINE");
  const [activeFilter, setActiveFilter] = useState<FleetFilter>("ALL");
  const [alertRefresh, setAlertRefresh] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const everConnectedRef = useRef(false);

  // Fetch initial fleet data from FastAPI backend with resilient error boundaries
  const fetchFleetData = useCallback(async () => {
    const [fleet, routesData, passData, statsData] = await Promise.all([
      fetchJson<any[]>("/fleet"),
      fetchJson<any[]>("/routes"),
      fetchJson<any[]>("/passengers"),
      fetchJson<FleetStats>("/stats/summary"),
    ]);

    if (Array.isArray(fleet) && fleet.length > 0) {
      setBuses(fleet.map(normalizeBusTelemetry));
    }
    if (Array.isArray(routesData) && routesData.length > 0) {
      setRoutes(routesData.map(normalizeRouteData));
    }
    if (Array.isArray(passData)) {
      setPassengers(passData);
    }
    if (statsData) {
      setStats(statsData);
      everConnectedRef.current = true;
      setConnectionState((prev) => (prev === "OFFLINE" ? "RECONNECTING" : prev));
    }
  }, []);

  // Connect to persistent real-time WebSocket telemetry stream
  useEffect(() => {
    fetchFleetData();

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connectWebSocket = () => {
      if (disposed) return;
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          everConnectedRef.current = true;
          setConnectionState("LIVE");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.fleet && Array.isArray(data.fleet)) {
              setBuses(data.fleet.map(normalizeBusTelemetry));
            } else if (data.buses && Array.isArray(data.buses)) {
              setBuses(data.buses.map(normalizeBusTelemetry));
            } else if (data.bus) {
              const updated = normalizeBusTelemetry(data.bus);
              setBuses((prev) => prev.map((b) => (b.bus_id === updated.bus_id ? updated : b)));
            }

            // Incident lifecycle events -> refresh Incident Radar + KPIs
            if (
              data.type === "SOS_TRIGGERED" ||
              data.type === "SOS_RESOLVED" ||
              data.type === "INCIDENT_RESOLVED" ||
              data.type === "BUS_REPLACED" ||
              data.type === "ABSENCE_DECLARED"
            ) {
              setAlertRefresh((c) => c + 1);
              fetchFleetData();
            }
          } catch (e) {
            console.error("Telemetry parse error:", e);
          }
        };

        ws.onclose = () => {
          if (disposed) return;
          setConnectionState(everConnectedRef.current ? "RECONNECTING" : "OFFLINE");
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        // Fallback polling continues below
      }
    };

    connectWebSocket();

    const interval = setInterval(fetchFleetData, 5000);

    return () => {
      disposed = true;
      clearInterval(interval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchFleetData]);

  // Apply the active corridor filter (DESIGN.md §2.2 pill bar)
  const filteredBuses = useMemo(() => {
    switch (activeFilter) {
      case "DELAYED":
        return buses.filter((b) => b.status === "DELAYED");
      case "ALERTS":
        return buses.filter((b) => b.status === "CORRIDOR_DEVIATION" || b.status === "SOS_HALT");
      case "STANDBY":
        return buses.filter((b) => b.is_standby);
      case "GOLD":
        return buses.filter((b) => b.compliance_rating >= 4.9);
      default:
        return buses.filter((b) => !b.is_standby);
    }
  }, [buses, activeFilter]);

  // Drop drone-follow lock if the selected vehicle leaves the active filter
  useEffect(() => {
    if (selectedBusId && !filteredBuses.some((b) => b.bus_id === selectedBusId)) {
      setSelectedBusId(null);
    }
  }, [filteredBuses, selectedBusId]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      {/* Top Floating Campus & Status Pill + Corridor Filter Bar */}
      <TopNavPill
        buses={buses}
        selectedBusId={selectedBusId}
        onSelectBus={setSelectedBusId}
        onResetCamera={() => setResetCounter((c) => c + 1)}
        connectionState={connectionState}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* 3D Isometric MapRadar Engine (OpenFreeMap + MapLibre GL) */}
      <MapRadar
        buses={filteredBuses}
        routes={routes}
        selectedBusId={selectedBusId}
        onSelectBus={setSelectedBusId}
        resetCounter={resetCounter}
      />

      {/* Floating Incident Radar (deviations / SOS / breakdowns + triage resolve) */}
      <AlertsPanel refreshSignal={alertRefresh} />

      {/* Floating Bottom Drawer & Action Modals matching docs/ui_reference.png */}
      <FleetDrawer
        buses={buses}
        routes={routes}
        selectedBusId={selectedBusId}
        onSelectBus={setSelectedBusId}
        passengers={passengers}
        onRefresh={fetchFleetData}
        stats={stats}
      />
    </main>
  );
}
