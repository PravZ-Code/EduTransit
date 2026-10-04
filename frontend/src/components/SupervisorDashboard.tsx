"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  Bus,
  Route as RouteIcon,
  Users,
  AlertTriangle,
  Megaphone,
  FileText,
  Settings,
  Search,
  Calendar,
  Bell,
  LogOut,
  Maximize2,
  ChevronDown,
  Phone,
  Radio,
  Clock,
  ShieldCheck,
  Siren,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  UserCheck,
  Compass,
  ArrowRight,
} from "lucide-react";
import { PortSwitcherHeader } from "./PortSwitcherHeader";
import { GoButton } from "./citymapper/GoButton";
import { ModeChip, LegStrip } from "./citymapper/LegStrip";
import { DisruptionBanner } from "./citymapper/DisruptionBanner";
import { DeparturesBoard } from "./citymapper/DeparturesBoard";
import { MapRadar } from "./MapRadar";
import { useToast } from "./citymapper/Toast";
import {
  BusTelemetry,
  RouteData,
  normalizeBusTelemetry,
  normalizeRouteData,
} from "@/types/fleet";
import { fetchJson, postJson } from "@/lib/api";

interface RouteItem {
  name: string;
  badge: string;
  startTime: string;
  buses: number;
  stops: number;
  students: number;
  status: "On Track" | "Delayed +12 min" | "Off Route";
}

const INITIAL_ROUTES: RouteItem[] = [
  { name: "Route A", badge: "R-A", startTime: "06:30 AM", buses: 8, stops: 24, students: 612, status: "On Track" },
  { name: "Route B", badge: "R-B", startTime: "06:45 AM", buses: 8, stops: 28, students: 721, status: "Delayed +12 min" },
  { name: "Route C", badge: "R-C", startTime: "06:40 AM", buses: 7, stops: 26, students: 544, status: "On Track" },
  { name: "Route D", badge: "R-D", startTime: "07:00 AM", buses: 6, stops: 20, students: 398, status: "Off Route" },
  { name: "Route E", badge: "R-E", startTime: "06:50 AM", buses: 5, stops: 18, students: 421, status: "On Track" },
  { name: "Route F", badge: "R-F", startTime: "07:10 AM", buses: 6, stops: 22, students: 512, status: "On Track" },
];

const SEED_BUSES: BusTelemetry[] = [
  {
    bus_id: "bus_01",
    registration_number: "TN-13-F-4004",
    route_id: "route_04n",
    lat: 13.1218,
    lng: 80.0520,
    speed_kmh: 38.0,
    heading_deg: 95.0,
    status: "ON_TIME",
    current_occupancy: 32,
    capacity: 45,
    next_stop_id: "stop_01",
    kalman_smoothed_eta_seconds: 120.0,
    timestamp: "2026-10-04T07:18:00Z",
    driver_name: "Rajesh K.",
    driver_phone: "+91 98401 23456",
    is_standby: false,
    compliance_rating: 4.98,
  },
  {
    bus_id: "bus_02",
    registration_number: "TN-13-F-1212",
    route_id: "route_12c",
    lat: 13.1125,
    lng: 80.1450,
    speed_kmh: 12.0,
    heading_deg: 255.0,
    status: "DELAYED",
    current_occupancy: 41,
    capacity: 45,
    next_stop_id: "stop_02",
    kalman_smoothed_eta_seconds: 720.0,
    timestamp: "2026-10-04T07:18:00Z",
    driver_name: "Suresh P.",
    driver_phone: "+91 98401 23457",
    is_standby: false,
    compliance_rating: 4.62,
  },
  {
    bus_id: "bus_03",
    registration_number: "TN-13-F-1818",
    route_id: "route_18e",
    lat: 13.1020,
    lng: 80.1700,
    speed_kmh: 28.0,
    heading_deg: 265.0,
    status: "ON_TIME",
    current_occupancy: 28,
    capacity: 45,
    next_stop_id: "stop_03",
    kalman_smoothed_eta_seconds: 310.0,
    timestamp: "2026-10-04T07:18:00Z",
    driver_name: "Murugan S.",
    driver_phone: "+91 98401 23458",
    is_standby: false,
    compliance_rating: 4.95,
  },
];

const SEED_ROUTES: RouteData[] = [
  {
    route_id: "route_04n",
    route_name: "Route 04N (Thiruninravur ➔ Veltech University)",
    campus_id: "campus_avadi",
    category: "COLLEGE_HIGHER_ED",
    corridor_buffer_meters: 75,
    polyline: [
      [13.1180, 80.0342],
      [13.1218, 80.0500],
      [13.1218, 80.0622],
      [13.1201, 80.0690],
      [13.1186, 80.0754],
    ],
    stops: [
      {
        stop_id: "stop_01",
        name: "Thiruninravur Station",
        lat: 13.1180,
        lng: 80.0342,
        scheduled_time: "07:35 AM",
        board_count: 8,
        status: "PENDING",
        requires_visual_sweep: false,
      },
      {
        stop_id: "stop_02",
        name: "Pattabiram Outer Ring",
        lat: 13.1218,
        lng: 80.0622,
        scheduled_time: "07:42 AM",
        board_count: 6,
        status: "PENDING",
        requires_visual_sweep: false,
      },
      {
        stop_id: "stop_03",
        name: "Veltech University Main Gate",
        lat: 13.1186,
        lng: 80.0754,
        scheduled_time: "08:00 AM",
        board_count: 0,
        status: "PENDING",
        requires_visual_sweep: false,
      },
    ],
  },
];

export function SupervisorDashboard() {
  const { showToast } = useToast();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [selectedCampus, setSelectedCampus] = useState("Veltech University (Avadi)");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("07:18 AM");

  // MapRadar live state
  const [buses, setBuses] = useState<BusTelemetry[]>(SEED_BUSES);
  const [routes, setRoutes] = useState<RouteData[]>(SEED_ROUTES);
  const [selectedBusId, setSelectedBusId] = useState<string | null>("bus_01");
  const [resetCounter, setResetCounter] = useState(0);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll backend fleet + corridor geometry (live when API is up, seeds offline)
  const fetchFleet = useCallback(async () => {
    try {
      const [fleetData, routesData] = await Promise.all([
        fetchJson<any[]>("/fleet"),
        fetchJson<any[]>("/routes"),
      ]);
      if (Array.isArray(fleetData) && fleetData.length > 0) {
        setBuses(fleetData.map(normalizeBusTelemetry));
      }
      if (Array.isArray(routesData) && routesData.length > 0) {
        setRoutes(routesData.map(normalizeRouteData));
      }
    } catch {
      // graceful offline fallback
    }
  }, []);

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 5000);
    return () => clearInterval(interval);
  }, [fetchFleet]);

  const triggerStandbyDispatch = async () => {
    const victim =
      buses.find((b) => !b.is_standby && b.bus_id === selectedBusId) ??
      buses.find((b) => !b.is_standby);
    const { ok, data } = await postJson<any>("/fleet/replace", {
      broken_bus_id: victim?.bus_id,
      reason: "Supervisor 60-second standby drill",
    });
    if (ok && data?.success) {
      showToast(
        "Standby Bus Deployed",
        `Reserve ${data.replacement_bus_number} promoted to ${data.migrated_route}. ` +
          `${data.migrated_passenger_count} passengers migrated in 60s.`,
        "success"
      );
      fetchFleet();
    } else {
      showToast(
        "Dispatch Blocked",
        "Reserve pool empty — standby unit already deployed. Reset simulation to re-arm.",
        "warning"
      );
    }
    setActiveModal(null);
  };

  return (
    <div
      style={{ backgroundColor: "#0C0E14" }}
      className="min-h-screen text-[#ECEEF3] flex flex-col font-sans select-none"
    >
      <PortSwitcherHeader currentPort={3000} />

      <div className="flex flex-1 overflow-hidden">
        {/* ================= LEFT SIDEBAR (Citymapper Surface 1) ================= */}
        <aside
          style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
          className="w-64 border-r flex flex-col justify-between shrink-0 hidden md:flex"
        >
          <div>
            {/* Brand Logo */}
            <div className="p-5 border-b border-[#282C38] flex items-center gap-3">
              <div
                style={{ backgroundColor: "#2B5BFF" }}
                className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white shadow-lg shadow-[#2B5BFF]/30"
              >
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-[15px] tracking-tight text-[#ECEEF3] leading-tight">
                  EduTransit Radar
                </h1>
                <p className="text-[11px] text-[#98A0AE] font-medium">
                  Citymapper Spec · Controller
                </p>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="p-3 space-y-1">
              {[
                { name: "Dashboard", icon: LayoutDashboard },
                { name: "Live Fleet", icon: Bus },
                { name: "Routes", icon: RouteIcon },
                { name: "Students", icon: Users },
                { name: "Incidents", icon: AlertTriangle },
                { name: "Announcements", icon: Megaphone },
                { name: "Reports", icon: FileText },
                { name: "Settings", icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name)}
                    style={{
                      backgroundColor: isActive ? "#2B5BFF" : "transparent",
                      color: isActive ? "#FFFFFF" : "#98A0AE",
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-xs font-bold transition-all ${
                      isActive
                        ? "shadow-md shadow-[#2B5BFF]/25"
                        : "hover:text-[#ECEEF3] hover:bg-[#1E212B]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Profile & Campus Picker */}
          <div className="p-4 border-t border-[#282C38] space-y-3">
            <div
              style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
              className="rounded-[12px] p-2.5 border"
            >
              <label className="text-[10px] uppercase font-bold text-[#646C7A] tracking-wider block mb-1">
                Active Campus
              </label>
              <div className="flex items-center justify-between text-xs font-semibold text-[#ECEEF3]">
                <span>{selectedCampus}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#98A0AE]" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: "#2B5BFF" }}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white"
                >
                  RM
                </div>
                <div>
                  <p className="text-xs font-bold text-[#ECEEF3] leading-tight">
                    Rakesh M.
                  </p>
                  <p className="text-[10px] text-[#98A0AE]">Chief Controller</p>
                </div>
              </div>
              <button
                onClick={() => showToast("Session Active", "Logged in as Chief Controller.", "info")}
                title="Status"
                className="p-1.5 rounded-lg text-[#98A0AE] hover:text-[#ECEEF3] hover:bg-[#1E212B] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ================= MAIN CONTENT AREA ================= */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Bar matching Citymapper dark theme */}
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border-b px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30"
          >
            {/* Global Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#646C7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search buses, routes, stops, students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
                className="w-full pl-9 pr-4 py-2 border rounded-[12px] text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF] transition"
              />
            </div>

            {/* Header Right Tools */}
            <div className="flex items-center gap-3">
              {/* Date & Time pill */}
              <div
                style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-[12px] text-xs font-bold text-[#ECEEF3]"
              >
                <Calendar className="w-3.5 h-3.5 text-[#2B5BFF]" />
                <span>Mon, 22 Sep 2026</span>
                <span className="text-[#646C7A]">•</span>
                <Clock className="w-3.5 h-3.5 text-[#00C281]" />
                <span className="font-mono text-[#00C281]">{currentTime}</span>
              </div>

              {/* Campus Selector */}
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                style={{ backgroundColor: "#1E212B", borderColor: "#282C38", color: "#ECEEF3" }}
                className="px-3 py-1.5 border rounded-[12px] text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All Campuses">All Campuses</option>
                <option value="Veltech University (Avadi)">Veltech University (Avadi)</option>
                <option value="Veltech North Block">Veltech North Block</option>
                <option value="Veltech Engineering Annexe">Veltech Engineering Annexe</option>
              </select>

              {/* Live Status Badge */}
              <div
                style={{ backgroundColor: "rgba(0,194,129,0.18)", borderColor: "rgba(0,194,129,0.3)" }}
                className="flex items-center gap-1.5 px-3 py-1.5 border rounded-[12px] text-xs font-black text-[#00C281]"
              >
                <span className="w-2 h-2 rounded-full bg-[#00C281] animate-pulse" />
                <span>RADAR LIVE</span>
              </div>

              {/* Notification Bell */}
              <button
                onClick={() =>
                  showToast(
                    "Fleet Triage Alert",
                    "Bus 7 experiencing +12m traffic delay near Central Circle.",
                    "warning"
                  )
                }
                style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
                className="relative p-2 rounded-[12px] border text-[#98A0AE] hover:text-[#ECEEF3] transition"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF8A00]" />
              </button>
            </div>
          </div>

          {/* ================= DASHBOARD CONTENT ================= */}
          <main className="p-6 space-y-6">
            {/* ROW 1: 6 STAT CARDS with Tabular Figures */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Total Buses */}
              <div
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#98A0AE] text-xs font-bold">
                  <div className="w-7 h-7 rounded-[8px] bg-[#2B5BFF]/15 text-[#4D7BFF] flex items-center justify-center">
                    <Bus className="w-4 h-4" />
                  </div>
                  <span>Total Fleet</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-[#ECEEF3] tabular-nums">48</div>
                  <p className="text-[11px] text-[#646C7A] mt-0.5">Fleet Enrolled</p>
                </div>
              </div>

              {/* Active Trips */}
              <div
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#98A0AE] text-xs font-bold">
                  <div className="w-7 h-7 rounded-[8px] bg-[#00C281]/15 text-[#00C281] flex items-center justify-center">
                    <RouteIcon className="w-4 h-4" />
                  </div>
                  <span>Active Trips</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-[#ECEEF3] tabular-nums">42</span>
                    <span className="text-xs font-bold text-[#00C281]">87%</span>
                  </div>
                  <div className="w-full bg-[#1E212B] rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-[#00C281] h-1.5 rounded-full" style={{ width: "87%" }} />
                  </div>
                </div>
              </div>

              {/* Delayed */}
              <div
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#98A0AE] text-xs font-bold">
                  <div className="w-7 h-7 rounded-[8px] bg-[#FF8A00]/15 text-[#FF8A00] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>Delayed &gt;5m</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-[#ECEEF3] tabular-nums">4</span>
                    <span className="text-xs font-bold text-[#FF8A00]">8%</span>
                  </div>
                  <div className="w-full bg-[#1E212B] rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-[#FF8A00] h-1.5 rounded-full" style={{ width: "8%" }} />
                  </div>
                </div>
              </div>

              {/* Route Deviations */}
              <div
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#98A0AE] text-xs font-bold">
                  <div className="w-7 h-7 rounded-[8px] bg-[#E8453C]/15 text-[#E8453C] flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span>Deviations</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-[#ECEEF3] tabular-nums">2</span>
                    <span className="text-xs font-bold text-[#E8453C]">4%</span>
                  </div>
                  <div className="w-full bg-[#1E212B] rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-[#E8453C] h-1.5 rounded-full" style={{ width: "4%" }} />
                  </div>
                </div>
              </div>

              {/* Critical Incidents */}
              <div
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#98A0AE] text-xs font-bold">
                  <div className="w-7 h-7 rounded-[8px] bg-[#646C7A]/15 text-[#98A0AE] flex items-center justify-center">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <span>Critical SOS</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-[#ECEEF3] tabular-nums">0</span>
                    <span className="text-xs font-bold text-[#646C7A]">0%</span>
                  </div>
                  <div className="w-full bg-[#1E212B] rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-[#646C7A] h-1.5 rounded-full" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>

              {/* Students Onboard */}
              <div
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#98A0AE] text-xs font-bold">
                  <div className="w-7 h-7 rounded-[8px] bg-[#8E44D8]/15 text-[#8E44D8] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Onboard Custody</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-[#ECEEF3] tabular-nums">3,842</span>
                    <span className="text-xs font-bold text-[#8E44D8]">92%</span>
                  </div>
                  <div className="w-full bg-[#1E212B] rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-[#8E44D8] h-1.5 rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: LIVE FLEET MAP (REAL MAPLIBRE GL JS ENGINE) + ACTIVE TRIPS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Live Fleet Map Panel (7 Cols) */}
              <div
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="lg:col-span-7 rounded-[18px] p-4 border flex flex-col shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="font-extrabold text-[15px] text-[#ECEEF3] flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#2B5BFF]" />
                    <span>Live 3D Tactical Fleet Radar (OpenFreeMap)</span>
                  </h2>

                  {/* Status Legend Chips */}
                  <div className="flex items-center gap-3 text-[11px] font-bold text-[#98A0AE]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00C281]" />
                      On Time
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF8A00]" />
                      Delayed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#E8453C]" />
                      Off Route
                    </span>
                    <button
                      onClick={() => setResetCounter((c) => c + 1)}
                      className="px-2 py-0.5 rounded bg-[#1E212B] text-[#ECEEF3] hover:bg-[#282C38] text-[10px]"
                    >
                      Reset View
                    </button>
                  </div>
                </div>

                {/* Real MapLibre GL JS Container */}
                <div className="relative flex-1 min-h-[380px] rounded-[14px] overflow-hidden border border-[#282C38]">
                  <MapRadar
                    buses={buses}
                    routes={routes}
                    selectedBusId={selectedBusId}
                    onSelectBus={(id) => setSelectedBusId(id)}
                    resetCounter={resetCounter}
                  />
                </div>
              </div>

              {/* Active Trips List & Leg Strips (5 Cols) */}
              <div
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="lg:col-span-5 rounded-[18px] p-4 border flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#282C38] mb-3">
                    <h3 className="font-extrabold text-[14px] text-[#ECEEF3]">
                      Active Trips Manifest
                    </h3>
                    <span className="text-[11px] text-[#4D7BFF] font-bold">
                      View All 42 ›
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { num: 3, route: "Route 04N", dest: "Veltech Uni Main Gate", mode: "bus" as const, eta: "2m", status: "On Time", color: "#00C281" },
                      { num: 7, route: "Route 12C", dest: "Veltech North Block", mode: "bus" as const, eta: "14m", status: "Delayed +12m", color: "#FF8A00" },
                      { num: 12, route: "Route 18E", dest: "Veltech Eng. Annexe", mode: "bus" as const, eta: "8m", status: "On Time", color: "#00C281" },
                      { num: 15, route: "Route 09S", dest: "Avadi Depot Loop", mode: "bus" as const, eta: "21m", status: "Off Route", color: "#E8453C" },
                    ].map((bus) => (
                      <div
                        key={bus.num}
                        onClick={() => setSelectedBusId(`bus_0${bus.num}`)}
                        style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
                        className="p-3 rounded-[12px] border flex items-center justify-between text-xs hover:border-[#4D7BFF] cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            style={{ backgroundColor: bus.color === "#00C281" ? "#00C281" : bus.color }}
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center font-black text-white text-[11px]"
                          >
                            {bus.num}
                          </div>
                          <div>
                            <span className="font-bold text-[#ECEEF3] block">
                              Bus {bus.num} · {bus.route}
                            </span>
                            <span className="text-[11px] text-[#98A0AE]">
                              To: {bus.dest}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            style={{ color: bus.color }}
                            className="font-bold text-[11px] block"
                          >
                            {bus.status}
                          </span>
                          <span className="text-[10px] font-mono text-[#646C7A]">
                            ETA {bus.eta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instant Standby GO Dispatch Button */}
                <div className="mt-4 pt-3 border-t border-[#282C38]">
                  <GoButton
                    onClick={() => setActiveModal("Emergency Standby Bus Dispatch")}
                    label="GO · 60-SEC STANDBY DISPATCH"
                  />
                </div>
              </div>
            </div>

            {/* ROW 3: ROUTE STATUS TABLE */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[18px] p-5 border shadow-sm"
            >
              <h3 className="font-extrabold text-[15px] text-[#ECEEF3] mb-4">
                Institutional Route Corridors
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ borderColor: "#282C38" }} className="border-b text-[#646C7A] uppercase text-[10px] tracking-wider font-black">
                      <th className="pb-3">Route</th>
                      <th className="pb-3">Corridor Badge</th>
                      <th className="pb-3">Start Time</th>
                      <th className="pb-3">Buses</th>
                      <th className="pb-3">Stops</th>
                      <th className="pb-3">Registered</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282C38]">
                    {INITIAL_ROUTES.map((r, i) => (
                      <tr key={i} className="hover:bg-[#1E212B] transition-colors">
                        <td className="py-3 font-bold text-[#ECEEF3]">{r.name}</td>
                        <td className="py-3">
                          <ModeChip mode="bus" label={r.badge} />
                        </td>
                        <td className="py-3 font-mono text-[#98A0AE]">{r.startTime}</td>
                        <td className="py-3 font-bold text-[#ECEEF3] tabular-nums">{r.buses}</td>
                        <td className="py-3 font-mono text-[#98A0AE] tabular-nums">{r.stops}</td>
                        <td className="py-3 font-bold text-[#4D7BFF] tabular-nums">{r.students}</td>
                        <td className="py-3">
                          <span
                            style={{
                              backgroundColor:
                                r.status === "On Track"
                                  ? "rgba(0,194,129,0.18)"
                                  : r.status === "Delayed +12 min"
                                  ? "rgba(255,138,0,0.18)"
                                  : "rgba(232,69,60,0.18)",
                              color:
                                r.status === "On Track"
                                  ? "#00C281"
                                  : r.status === "Delayed +12 min"
                                  ? "#FF8A00"
                                  : "#E8453C",
                            }}
                            className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-current"
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Standby Dispatch Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-6 max-w-sm w-full shadow-2xl relative text-center"
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3] mb-2">
              {activeModal}
            </h3>
            <p className="text-[12px] text-[#98A0AE] mb-5">
              Instantly migrates passenger manifests and broadcasts live reassignment notifications.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-full bg-[#1E212B] text-[#ECEEF3] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={triggerStandbyDispatch}
                style={{ backgroundColor: "#00C281", color: "#003322" }}
                className="flex-1 py-2.5 rounded-full font-black text-xs"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
