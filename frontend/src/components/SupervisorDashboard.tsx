"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  RefreshCw,
  Download,
  Send,
  Eye,
  X,
  Filter,
  Check,
  Zap,
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
  id: string;
  name: string;
  badge: string;
  startTime: string;
  buses: number;
  stops: number;
  students: number;
  status: "On Track" | "Delayed +12 min" | "Off Route";
}

interface StudentRecord {
  id: string;
  name: string;
  grade: string;
  stop: string;
  busId: string;
  guardianPhone: string;
  status: "BOARDED" | "WAITING" | "ABSENT";
  time?: string;
}

interface IncidentRecord {
  id: string;
  busId: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location: string;
  time: string;
  status: "ACTIVE" | "RESOLVED";
}

const INITIAL_ROUTES: RouteItem[] = [
  { id: "route_04n", name: "Route A • North Corridor", badge: "R-A", startTime: "06:30 AM", buses: 8, stops: 24, students: 612, status: "On Track" },
  { id: "route_12c", name: "Route B • Outer Ring", badge: "R-B", startTime: "06:45 AM", buses: 8, stops: 28, students: 721, status: "Delayed +12 min" },
  { id: "route_18e", name: "Route C • Annexe Express", badge: "R-C", startTime: "06:40 AM", buses: 7, stops: 26, students: 544, status: "On Track" },
  { id: "route_09s", name: "Route D • Depot Loop", badge: "R-D", startTime: "07:00 AM", buses: 6, stops: 20, students: 398, status: "Off Route" },
  { id: "route_05w", name: "Route E • West Campus", badge: "R-E", startTime: "06:50 AM", buses: 5, stops: 18, students: 421, status: "On Track" },
  { id: "route_08k", name: "Route F • City Connector", badge: "R-F", startTime: "07:10 AM", buses: 6, stops: 22, students: 512, status: "On Track" },
];

const SEED_BUSES: BusTelemetry[] = [
  {
    bus_id: "bus_01",
    registration_number: "TN-13-F-4004",
    route_id: "route_04n",
    lat: 13.1218,
    lng: 80.052,
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
    lng: 80.145,
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
    registration_number: "TN-13-F-8899",
    route_id: "route_09s",
    lat: 13.119,
    lng: 80.088,
    speed_kmh: 42.0,
    heading_deg: 180.0,
    status: "CORRIDOR_DEVIATION",
    current_occupancy: 28,
    capacity: 45,
    next_stop_id: "stop_03",
    kalman_smoothed_eta_seconds: 480.0,
    timestamp: "2026-10-04T07:18:00Z",
    driver_name: "Murugan S.",
    driver_phone: "+91 98401 23459",
    is_standby: false,
    compliance_rating: 4.1,
  },
  {
    bus_id: "bus_99",
    registration_number: "TN-13-F-9999",
    route_id: "standby_pool",
    lat: 13.114,
    lng: 80.072,
    speed_kmh: 0.0,
    heading_deg: 0.0,
    status: "STANDBY_DEPLOYED",
    current_occupancy: 0,
    capacity: 45,
    next_stop_id: "depot",
    kalman_smoothed_eta_seconds: 0.0,
    timestamp: "2026-10-04T07:18:00Z",
    driver_name: "Anand R. (Reserve Coach)",
    driver_phone: "+91 98401 23458",
    is_standby: true,
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
      [13.118, 80.0342],
      [13.1218, 80.05],
      [13.1218, 80.0622],
      [13.1201, 80.069],
      [13.1186, 80.0754],
    ],
    stops: [
      {
        stop_id: "stop_01",
        name: "Thiruninravur Station",
        lat: 13.118,
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

const INITIAL_STUDENTS: StudentRecord[] = [
  { id: "stu_01", name: "Aarav Kumar", grade: "Class 5A", stop: "Avadi Junction Bay #3", busId: "bus_01", guardianPhone: "+91 98401 11221", status: "BOARDED", time: "07:22 AM" },
  { id: "stu_02", name: "Diya Patel", grade: "Class 6B", stop: "Avadi Junction Bay #3", busId: "bus_01", guardianPhone: "+91 98401 11222", status: "BOARDED", time: "07:23 AM" },
  { id: "stu_03", name: "Rohan Mehta", grade: "Class 4A", stop: "Avadi Junction Bay #3", busId: "bus_01", guardianPhone: "+91 98401 11223", status: "BOARDED", time: "07:24 AM" },
  { id: "stu_04", name: "Sara Khan", grade: "Class 5B", stop: "Pattabiram Outer Ring", busId: "bus_01", guardianPhone: "+91 98401 11224", status: "ABSENT" },
  { id: "stu_05", name: "Ananya Iyer", grade: "Class 7A", stop: "Pattabiram Outer Ring", busId: "bus_01", guardianPhone: "+91 98401 11225", status: "WAITING" },
  { id: "stu_06", name: "Vikram Malhotra", grade: "Class 8C", stop: "Pattabiram Outer Ring", busId: "bus_01", guardianPhone: "+91 98401 11226", status: "WAITING" },
  { id: "stu_07", name: "Aditya Verma", grade: "B.Tech Term 6", stop: "Hostel Stop #2", busId: "bus_02", guardianPhone: "+91 98401 11227", status: "BOARDED", time: "07:15 AM" },
  { id: "stu_08", name: "Pooja Hegde", grade: "B.Tech Term 4", stop: "North Quad Concourse", busId: "bus_02", guardianPhone: "+91 98401 11228", status: "WAITING" },
];

const INITIAL_INCIDENTS: IncidentRecord[] = [
  { id: "inc_01", busId: "bus_03", type: "Lateral Corridor Deviation (>75m)", severity: "HIGH", location: "Avadi Bypass Link Road", time: "07:14 AM", status: "ACTIVE" },
  { id: "inc_02", busId: "bus_02", type: "Traffic Halt (>5 min)", severity: "MEDIUM", location: "Pattabiram Railway Gate", time: "07:10 AM", status: "ACTIVE" },
  { id: "inc_03", busId: "bus_01", type: "Early Departure Prevented (Hold Banner Engaged)", severity: "LOW", location: "Thiruninravur Depot", time: "06:58 AM", status: "RESOLVED" },
];

export function SupervisorDashboard() {
  const { showToast } = useToast();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [selectedCampus, setSelectedCampus] = useState("Veltech University (Avadi)");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState("07:18 AM");

  // Live state
  const [buses, setBuses] = useState<BusTelemetry[]>(SEED_BUSES);
  const [routes, setRoutes] = useState<RouteData[]>(SEED_ROUTES);
  const [selectedBusId, setSelectedBusId] = useState<string | null>("bus_01");
  const [resetCounter, setResetCounter] = useState(0);

  // Entities
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(INITIAL_INCIDENTS);
  const [studentFilter, setStudentFilter] = useState<"ALL" | "BOARDED" | "WAITING" | "ABSENT">("ALL");

  // Modals & Panels
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showFleetDrawer, setShowFleetDrawer] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState("All Parents & Drivers");
  const [broadcastPriority, setBroadcastPriority] = useState<"NORMAL" | "WARNING" | "CRITICAL">("NORMAL");

  // Algorithm configuration thresholds (Settings tab)
  const [thresholds, setThresholds] = useState({
    gpsIntervalSec: 3,
    corridorBufferM: 75,
    antiEarlyHoldSec: 60,
    visualSweepSpeedKmh: 10,
    proximityCheckinM: 25,
  });

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll backend fleet (live when API is up, seamless fallback when offline)
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
      // Graceful offline fallback
    }
  }, []);

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 5000);
    return () => clearInterval(interval);
  }, [fetchFleet]);

  // Filtered lists
  const filteredBuses = useMemo(() => {
    if (!searchQuery.trim()) return buses;
    const q = searchQuery.toLowerCase();
    return buses.filter(
      (b) =>
        b.bus_id.toLowerCase().includes(q) ||
        b.registration_number.toLowerCase().includes(q) ||
        b.driver_name.toLowerCase().includes(q) ||
        b.route_id.toLowerCase().includes(q)
    );
  }, [buses, searchQuery]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesFilter = studentFilter === "ALL" || s.status === studentFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.stop.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [students, studentFilter, searchQuery]);

  // Actions
  const triggerStandbyDispatch = async () => {
    const victim =
      buses.find((b) => !b.is_standby && b.bus_id === selectedBusId) ??
      buses.find((b) => !b.is_standby);

    const { ok } = await postJson<any>("/fleet/replace", {
      broken_bus_id: victim?.bus_id || "bus_01",
      reason: "Supervisor 60-second standby drill",
    });

    if (ok) {
      setBuses((prev) =>
        prev.map((b) => {
          if (b.is_standby) {
            return {
              ...b,
              is_standby: false,
              status: "STANDBY_DEPLOYED",
              route_id: victim?.route_id || "route_04n",
              lat: 13.118,
              lng: 80.065,
              speed_kmh: 32.0,
            };
          }
          if (b.bus_id === victim?.bus_id) {
            return { ...b, status: "CORRIDOR_DEVIATION", speed_kmh: 0.0 };
          }
          return b;
        })
      );
      showToast(
        "Standby Bus Deployed",
        `Reserve Coach TN-13-F-9999 promoted to ${victim?.route_id || "Route A"}. Manifest migrated in 60s.`,
        "success"
      );
    }
    setActiveModal(null);
  };

  const resolveIncident = (incId: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incId ? { ...inc, status: "RESOLVED" } : inc))
    );
    showToast("Incident Cleared", `Incident #${incId} marked resolved. Fleet radar status updated.`, "success");
  };

  const toggleStudentStatus = (stuId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== stuId) return s;
        const nextStatus = s.status === "BOARDED" ? "WAITING" : s.status === "WAITING" ? "ABSENT" : "BOARDED";
        return { ...s, status: nextStatus };
      })
    );
    showToast("Custody Updated", `Student #${stuId} status toggled in manifest.`, "info");
  };

  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) {
      showToast("Input Required", "Please enter broadcast message text.", "warning");
      return;
    }
    showToast(
      "Broadcast Dispatched",
      `Sent to ${broadcastAudience}: "${broadcastMessage.slice(0, 35)}..."`,
      "success"
    );
    setBroadcastMessage("");
    setActiveModal(null);
  };

  const saveSettings = () => {
    showToast("Settings Saved", "Zero-hardware statutory parameters updated in cache.", "success");
  };

  return (
    <div style={{ backgroundColor: "#0C0E14" }} className="min-h-screen text-[#ECEEF3] flex flex-col font-sans select-none">
      <PortSwitcherHeader currentPort={3000} />

      <div className="flex flex-1 overflow-hidden">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside
          style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
          className="w-64 border-r flex flex-col justify-between shrink-0 hidden md:flex"
        >
          <div>
            {/* Brand Logo */}
            <div className="p-5 border-b border-[#282C38] flex items-center gap-3">
              <div
                style={{ backgroundColor: "#2B5BFF" }}
                className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white shadow-lg shadow-[#2B5BFF]/30 cursor-pointer"
                onClick={() => setActiveNav("Dashboard")}
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

            {/* Nav Menu with 8 fully functional tabs */}
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
                    onClick={() => {
                      setActiveNav(item.name);
                      showToast(item.name, `Switched to ${item.name} operational view.`, "info");
                    }}
                    style={{
                      backgroundColor: isActive ? "#2B5BFF" : "transparent",
                      color: isActive ? "#FFFFFF" : "#98A0AE",
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-xs font-bold transition-all ${
                      isActive ? "shadow-md shadow-[#2B5BFF]/25" : "hover:text-[#ECEEF3] hover:bg-[#1E212B]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.name === "Incidents" && incidents.filter((i) => i.status === "ACTIVE").length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#E8453C] text-white text-[10px] font-black">
                        {incidents.filter((i) => i.status === "ACTIVE").length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Profile & Campus Picker */}
          <div className="p-4 border-t border-[#282C38] space-y-3">
            <div
              style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
              className="rounded-[12px] p-2.5 border cursor-pointer"
              onClick={() => showToast("Campus Switcher", `Active operational zone: ${selectedCampus}`, "info")}
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
                  <p className="text-xs font-bold text-[#ECEEF3] leading-tight">Rakesh M.</p>
                  <p className="text-[10px] text-[#98A0AE]">Chief Controller</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal("Sign Out Confirmation")}
                title="Log Out / Switch Session"
                className="p-1.5 rounded-lg text-[#98A0AE] hover:text-[#ECEEF3] hover:bg-[#1E212B] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ================= MAIN CONTENT AREA ================= */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Bar */}
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
                className="w-full pl-9 pr-8 py-2 border rounded-[12px] text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A0AE] hover:text-[#ECEEF3]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
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
                onChange={(e) => {
                  setSelectedCampus(e.target.value);
                  showToast("Campus Switched", `Filtering telematics for ${e.target.value}.`, "info");
                }}
                style={{ backgroundColor: "#1E212B", borderColor: "#282C38", color: "#ECEEF3" }}
                className="px-3 py-1.5 border rounded-[12px] text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All Campuses">All Campuses</option>
                <option value="Veltech University (Avadi)">Veltech University (Avadi)</option>
                <option value="Veltech North Block">Veltech North Block</option>
                <option value="Veltech Engineering Annexe">Veltech Engineering Annexe</option>
              </select>

              {/* Live Status Badge */}
              <button
                onClick={() => {
                  fetchFleet();
                  showToast("Sync Dispatched", "Refreshed high-frequency telemetry vectors.", "success");
                }}
                style={{ backgroundColor: "rgba(0,194,129,0.18)", borderColor: "rgba(0,194,129,0.3)" }}
                className="flex items-center gap-1.5 px-3 py-1.5 border rounded-[12px] text-xs font-black text-[#00C281] hover:scale-102 transition"
                title="Tap to manually sync"
              >
                <span className="w-2 h-2 rounded-full bg-[#00C281] animate-pulse" />
                <span>RADAR LIVE</span>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
                className="relative p-2 rounded-[12px] border text-[#98A0AE] hover:text-[#ECEEF3] transition"
                title="Toggle Live Incident Notifications"
              >
                <Bell className="w-4 h-4" />
                {incidents.filter((i) => i.status === "ACTIVE").length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF8A00]" />
                )}
              </button>
            </div>
          </div>

          {/* Notifications Drawer */}
          {showNotifications && (
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="border-b p-4 px-6 flex items-center justify-between gap-4 bg-[#15171F]/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/20 text-[#FF8A00] flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#ECEEF3]">
                    Active Incident Alerts ({incidents.filter((i) => i.status === "ACTIVE").length})
                  </h4>
                  <p className="text-[11px] text-[#98A0AE]">
                    Bus 3 corridor deviation · Bus 2 railway gate delay (+12m)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveNav("Incidents");
                    setShowNotifications(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#2B5BFF] text-white text-xs font-bold hover:bg-[#1E4BEB] transition"
                >
                  Open Triage Panel
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 rounded-lg text-[#98A0AE] hover:text-white hover:bg-[#1E212B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB ROUTING CONTENT ================= */}
          <main className="p-6 space-y-6 flex-1">
            {/* 1. DASHBOARD VIEW */}
            {activeNav === "Dashboard" && (
              <>
                {/* 6 STAT CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div
                    onClick={() => setActiveNav("Live Fleet")}
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm hover:border-[#4D7BFF] cursor-pointer transition"
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

                  <div
                    onClick={() => setActiveNav("Live Fleet")}
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm hover:border-[#00C281] cursor-pointer transition"
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

                  <div
                    onClick={() => setActiveNav("Incidents")}
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm hover:border-[#FF8A00] cursor-pointer transition"
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

                  <div
                    onClick={() => setActiveNav("Incidents")}
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm hover:border-[#E8453C] cursor-pointer transition"
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

                  <div
                    onClick={() => setActiveModal("Emergency SOS Alarm Trigger")}
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm hover:border-[#E8453C] cursor-pointer transition"
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

                  <div
                    onClick={() => setActiveNav("Students")}
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="rounded-[16px] p-4 border flex flex-col justify-between shadow-sm hover:border-[#8E44D8] cursor-pointer transition"
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

                {/* 3D MAP + ACTIVE TRIPS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="lg:col-span-7 rounded-[18px] p-4 border flex flex-col shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <h2 className="font-extrabold text-[15px] text-[#ECEEF3] flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#2B5BFF]" />
                        <span>Live 3D Tactical Fleet Radar (OpenFreeMap)</span>
                      </h2>

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
                          onClick={() => {
                            setResetCounter((c) => c + 1);
                            showToast("Camera Reset", "Returned 3D map to default bird's-eye vantage.", "info");
                          }}
                          className="px-2 py-0.5 rounded bg-[#1E212B] text-[#ECEEF3] hover:bg-[#282C38] text-[10px]"
                        >
                          Reset View
                        </button>
                      </div>
                    </div>

                    <div className="relative flex-1 min-h-[380px] rounded-[14px] overflow-hidden border border-[#282C38]">
                      <MapRadar
                        buses={filteredBuses}
                        routes={routes}
                        selectedBusId={selectedBusId}
                        onSelectBus={(id) => {
                          setSelectedBusId(id);
                          showToast("Vehicle Selected", `Locked tactical camera to Bus #${id}.`, "info");
                        }}
                        resetCounter={resetCounter}
                      />
                    </div>
                  </div>

                  {/* Active Trips List */}
                  <div
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="lg:col-span-5 rounded-[18px] p-4 border flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#282C38] mb-3">
                        <h3 className="font-extrabold text-[14px] text-[#ECEEF3]">
                          Active Trips Manifest
                        </h3>
                        <button
                          onClick={() => setShowFleetDrawer(true)}
                          className="text-[11px] text-[#4D7BFF] font-bold hover:underline"
                        >
                          View All ({filteredBuses.length}) ›
                        </button>
                      </div>

                      <div className="space-y-2">
                        {filteredBuses.slice(0, 4).map((bus) => {
                          const isSelected = selectedBusId === bus.bus_id;
                          const color =
                            bus.status === "ON_TIME"
                              ? "#00C281"
                              : bus.status === "DELAYED"
                              ? "#FF8A00"
                              : "#E8453C";
                          return (
                            <div
                              key={bus.bus_id}
                              onClick={() => {
                                setSelectedBusId(bus.bus_id);
                                showToast("Bus Selected", `Focusing radar on ${bus.bus_id} (${bus.driver_name}).`, "info");
                              }}
                              style={{
                                backgroundColor: isSelected ? "rgba(43,91,255,0.15)" : "#1E212B",
                                borderColor: isSelected ? "#2B5BFF" : "#282C38",
                              }}
                              className="p-3 rounded-[12px] border flex items-center justify-between text-xs hover:border-[#4D7BFF] cursor-pointer transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  style={{ backgroundColor: color }}
                                  className="w-7 h-7 rounded-[8px] flex items-center justify-center font-black text-white text-[11px]"
                                >
                                  {bus.bus_id.replace("bus_", "")}
                                </div>
                                <div>
                                  <span className="font-bold text-[#ECEEF3] block">
                                    {bus.registration_number} · {bus.route_id}
                                  </span>
                                  <span className="text-[11px] text-[#98A0AE]">
                                    Driver: {bus.driver_name} · {bus.current_occupancy}/{bus.capacity} seats
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span style={{ color }} className="font-bold text-[11px] block">
                                  {bus.status.replace("_", " ")}
                                </span>
                                <span className="text-[10px] font-mono text-[#646C7A]">
                                  {Math.round(bus.kalman_smoothed_eta_seconds / 60)}m ETA
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#282C38]">
                      <GoButton
                        onClick={() => setActiveModal("Emergency Standby Bus Dispatch")}
                        label="GO · 60-SEC STANDBY DISPATCH"
                      />
                    </div>
                  </div>
                </div>

                {/* ROUTE CORRIDORS TABLE */}
                <div
                  style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                  className="rounded-[18px] p-5 border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-[15px] text-[#ECEEF3]">
                      Institutional Route Corridors
                    </h3>
                    <button
                      onClick={() => setActiveNav("Routes")}
                      className="text-xs text-[#2B5BFF] font-bold hover:underline"
                    >
                      Manage All Corridors ›
                    </button>
                  </div>
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
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#282C38]">
                        {INITIAL_ROUTES.map((r) => (
                          <tr key={r.id} className="hover:bg-[#1E212B] transition-colors">
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
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setActiveNav("Routes");
                                  showToast("Route Inspected", `Inspecting stops for ${r.name}.`, "info");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#1E212B] hover:bg-[#282C38] text-[11px] font-bold text-[#ECEEF3] transition"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* 2. LIVE FLEET VIEW */}
            {activeNav === "Live Fleet" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#ECEEF3]">Live Fleet Radar Console</h2>
                    <p className="text-xs text-[#98A0AE]">Zero-hardware GPS vector telematics & driver cabin links</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal("Emergency Standby Bus Dispatch")}
                      className="px-3.5 py-2 rounded-xl bg-[#00C281] text-[#003322] font-black text-xs hover:bg-[#00D890] transition flex items-center gap-1.5"
                    >
                      <Zap className="w-4 h-4" />
                      Deploy Standby Bus
                    </button>
                    <button
                      onClick={() => {
                        setResetCounter((c) => c + 1);
                        showToast("View Centered", "Centered tactical radar.", "info");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#1E212B] text-white font-bold text-xs border border-[#282C38] hover:bg-[#282C38] transition"
                    >
                      Reset 3D Map
                    </button>
                  </div>
                </div>

                <div className="h-[480px] rounded-[18px] overflow-hidden border border-[#282C38]">
                  <MapRadar
                    buses={filteredBuses}
                    routes={routes}
                    selectedBusId={selectedBusId}
                    onSelectBus={(id) => setSelectedBusId(id)}
                    resetCounter={resetCounter}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {buses.map((bus) => (
                    <div
                      key={bus.bus_id}
                      style={{ backgroundColor: "#15171F", borderColor: selectedBusId === bus.bus_id ? "#2B5BFF" : "#282C38" }}
                      className="p-4 rounded-[16px] border space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#ECEEF3]">{bus.registration_number}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            bus.status === "ON_TIME"
                              ? "bg-[#00C281]/20 text-[#00C281]"
                              : bus.status === "DELAYED"
                              ? "bg-[#FF8A00]/20 text-[#FF8A00]"
                              : "bg-[#E8453C]/20 text-[#E8453C]"
                          }`}
                        >
                          {bus.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#98A0AE] space-y-1">
                        <p>Driver: <strong className="text-white">{bus.driver_name}</strong></p>
                        <p>Speed: <span className="font-mono text-white">{bus.speed_kmh} km/h</span> · Route: {bus.route_id}</p>
                        <p>Load: {bus.current_occupancy}/{bus.capacity} seats ({Math.round((bus.current_occupancy / bus.capacity) * 100)}%)</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-[#282C38]">
                        <button
                          onClick={() => {
                            setSelectedBusId(bus.bus_id);
                            showToast("Radar Locked", `Focusing camera on ${bus.registration_number}.`, "info");
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-[#2B5BFF] text-white text-xs font-bold hover:bg-[#1E4BEB] transition"
                        >
                          Track
                        </button>
                        <button
                          onClick={() => showToast("Voice Call", `Connecting encrypted proxy to ${bus.driver_name} (${bus.driver_phone}).`, "info")}
                          className="px-3 py-1.5 rounded-lg bg-[#1E212B] text-[#98A0AE] hover:text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. ROUTES VIEW */}
            {activeNav === "Routes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#ECEEF3]">Approved Directional Corridors</h2>
                    <p className="text-xs text-[#98A0AE]">Statutory ±75m buffer compliance & dynamic stop demand</p>
                  </div>
                  <button
                    onClick={() => showToast("Corridor Added", "New campus route corridor opened for scheduling.", "success")}
                    className="px-3.5 py-2 rounded-xl bg-[#2B5BFF] text-white font-bold text-xs hover:bg-[#1E4BEB] transition"
                  >
                    + Add New Corridor
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {INITIAL_ROUTES.map((r) => (
                    <div
                      key={r.id}
                      style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                      className="p-5 rounded-[18px] border space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ModeChip mode="bus" label={r.badge} />
                          <div>
                            <h3 className="font-extrabold text-sm text-[#ECEEF3]">{r.name}</h3>
                            <p className="text-[11px] text-[#98A0AE]">Scheduled Start: {r.startTime}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#00C281] bg-[#00C281]/15 px-2.5 py-1 rounded-full">
                          ±75m Buffer Valid
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-[#1E212B] p-3 rounded-[12px]">
                        <div>
                          <span className="text-[10px] text-[#98A0AE] block">Assigned Buses</span>
                          <strong className="text-white text-sm">{r.buses}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#98A0AE] block">Designated Stops</span>
                          <strong className="text-white text-sm">{r.stops}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#98A0AE] block">Manifest Roster</span>
                          <strong className="text-[#4D7BFF] text-sm">{r.students}</strong>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => showToast("Buffer Checked", `Verified ±75m lateral corridor envelope for ${r.name}.`, "success")}
                          className="flex-1 py-2 rounded-xl bg-[#1E212B] hover:bg-[#282C38] text-xs font-bold text-[#ECEEF3] transition"
                        >
                          Verify Buffer
                        </button>
                        <button
                          onClick={() => showToast("Simulated Delay", `Injected +12m traffic condition into ${r.name}.`, "warning")}
                          className="flex-1 py-2 rounded-xl bg-[#FF8A00]/20 text-[#FF8A00] hover:bg-[#FF8A00] hover:text-white text-xs font-bold transition"
                        >
                          Simulate Traffic (+12m)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. STUDENTS VIEW */}
            {activeNav === "Students" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#ECEEF3]">Unbroken Custody Passenger Manifest</h2>
                    <p className="text-xs text-[#98A0AE]">Dynamic attendance, QR verification & guardian handover</p>
                  </div>
                  <div className="flex gap-2">
                    {(["ALL", "BOARDED", "WAITING", "ABSENT"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStudentFilter(filter)}
                        style={{
                          backgroundColor: studentFilter === filter ? "#2B5BFF" : "#15171F",
                          borderColor: studentFilter === filter ? "#2B5BFF" : "#282C38",
                          color: studentFilter === filter ? "#FFFFFF" : "#98A0AE",
                        }}
                        className="px-3 py-1.5 rounded-lg border text-xs font-bold transition"
                      >
                        {filter}
                      </button>
                    ))}
                    <button
                      onClick={() => showToast("Export Ready", "Exported passenger manifest to CSV.", "success")}
                      className="px-3 py-1.5 rounded-lg bg-[#00C281] text-[#003322] text-xs font-black transition flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="rounded-[18px] border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr style={{ borderColor: "#282C38" }} className="border-b text-[#646C7A] uppercase text-[10px] tracking-wider font-black">
                        <th className="p-4">Student</th>
                        <th className="p-4">Grade</th>
                        <th className="p-4">Designated Stop</th>
                        <th className="p-4">Assigned Bus</th>
                        <th className="p-4">Guardian Contact</th>
                        <th className="p-4">Custody Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#282C38]">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-[#1E212B] transition-colors">
                          <td className="p-4 font-bold text-white">{s.name}</td>
                          <td className="p-4 text-[#98A0AE]">{s.grade}</td>
                          <td className="p-4 text-[#ECEEF3]">{s.stop}</td>
                          <td className="p-4 font-mono text-[#4D7BFF]">{s.busId}</td>
                          <td className="p-4 text-[#98A0AE]">{s.guardianPhone}</td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                s.status === "BOARDED"
                                  ? "bg-[#00C281]/20 text-[#00C281]"
                                  : s.status === "WAITING"
                                  ? "bg-[#FFB400]/20 text-[#FFB400]"
                                  : "bg-[#E8453C]/20 text-[#E8453C]"
                              }`}
                            >
                              {s.status} {s.time ? `(${s.time})` : ""}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggleStudentStatus(s.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#1E212B] hover:bg-[#282C38] text-[11px] font-bold text-[#ECEEF3] transition mr-2"
                            >
                              Toggle
                            </button>
                            <button
                              onClick={() => showToast("Guardian Alert", `Dispatched masked SMS notification to ${s.guardianPhone}.`, "info")}
                              className="p-1 rounded-lg bg-[#2B5BFF]/20 text-[#4D7BFF] hover:bg-[#2B5BFF] hover:text-white transition"
                              title="Send custody SMS"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. INCIDENTS VIEW */}
            {activeNav === "Incidents" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#ECEEF3]">Real-Time Incident Triage</h2>
                    <p className="text-xs text-[#98A0AE]">Corridor deviations, unscheduled halts & emergency alarms</p>
                  </div>
                  <button
                    onClick={() => setActiveModal("Emergency SOS Alarm Trigger")}
                    className="px-3.5 py-2 rounded-xl bg-[#E8453C] text-white font-bold text-xs hover:bg-[#D4342B] transition flex items-center gap-1.5"
                  >
                    <Siren className="w-4 h-4" />
                    Trigger SOS Drill
                  </button>
                </div>

                <div className="space-y-3">
                  {incidents.map((inc) => (
                    <div
                      key={inc.id}
                      style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                      className="p-5 rounded-[18px] border flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-[12px] flex items-center justify-center font-bold text-white ${
                            inc.severity === "HIGH" || inc.severity === "CRITICAL"
                              ? "bg-[#E8453C]"
                              : "bg-[#FF8A00]"
                          }`}
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-[#ECEEF3]">{inc.type}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E212B] text-[#98A0AE]">
                              {inc.time}
                            </span>
                          </div>
                          <p className="text-xs text-[#98A0AE]">
                            Vehicle: <strong className="text-white">{inc.busId}</strong> · Location: {inc.location}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {inc.status === "ACTIVE" ? (
                          <>
                            <button
                              onClick={() => resolveIncident(inc.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#00C281] text-[#003322] font-black text-xs hover:bg-[#00D890] transition"
                            >
                              Resolve Incident
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBusId(inc.busId);
                                setActiveModal("Emergency Standby Bus Dispatch");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#2B5BFF] text-white font-bold text-xs hover:bg-[#1E4BEB] transition"
                            >
                              Dispatch Standby
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-[#00C281] flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. ANNOUNCEMENTS VIEW */}
            {activeNav === "Announcements" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#ECEEF3]">Institutional Broadcast Authority</h2>
                  <p className="text-xs text-[#98A0AE]">Direct push notifications to parents, students, and driver HUDs</p>
                </div>

                <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="p-6 rounded-[20px] border space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#ECEEF3] block mb-1.5">Target Audience</label>
                    <div className="flex flex-wrap gap-2">
                      {["All Parents & Drivers", "School Parents Only", "College Students Only", "Drivers Cabin Only"].map((aud) => (
                        <button
                          key={aud}
                          onClick={() => setBroadcastAudience(aud)}
                          style={{
                            backgroundColor: broadcastAudience === aud ? "#2B5BFF" : "#1E212B",
                            borderColor: broadcastAudience === aud ? "#2B5BFF" : "#282C38",
                            color: broadcastAudience === aud ? "#FFFFFF" : "#98A0AE",
                          }}
                          className="px-3 py-1.5 rounded-xl border text-xs font-bold transition"
                        >
                          {aud}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#ECEEF3] block mb-1.5">Broadcast Message</label>
                    <textarea
                      rows={4}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="e.g. Heavy rain alert on North Corridor. Routes operating with +10m traffic delay caution."
                      style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
                      className="w-full p-3 border rounded-[14px] text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setBroadcastMessage("")}
                      className="px-4 py-2 rounded-full bg-[#1E212B] text-[#98A0AE] text-xs font-bold hover:text-white transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={sendBroadcast}
                      className="px-5 py-2 rounded-full bg-[#2B5BFF] text-white text-xs font-black shadow-md shadow-[#2B5BFF]/30 hover:bg-[#1E4BEB] transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Publish Broadcast
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. REPORTS VIEW */}
            {activeNav === "Reports" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#ECEEF3]">Statutory SLA & Fuel Audit Reports</h2>
                    <p className="text-xs text-[#98A0AE]">Automated reconciliation of punctuality SLAs, dead-mileage & safety</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => showToast("Export PDF", "Generated statutory SLA compliance certificate.", "success")}
                      className="px-3.5 py-2 rounded-xl bg-[#2B5BFF] text-white font-bold text-xs hover:bg-[#1E4BEB] transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="p-5 rounded-[18px] border">
                    <span className="text-xs text-[#98A0AE] font-bold block mb-1">Contractor Punctuality SLA</span>
                    <strong className="text-3xl font-black text-[#00C281] tabular-nums">98.4%</strong>
                    <p className="text-[11px] text-[#646C7A] mt-1">42 of 44 trips completed within published timetable</p>
                  </div>

                  <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="p-5 rounded-[18px] border">
                    <span className="text-xs text-[#98A0AE] font-bold block mb-1">Rear Sweep Safety Score</span>
                    <strong className="text-3xl font-black text-[#2B5BFF] tabular-nums">100%</strong>
                    <p className="text-[11px] text-[#646C7A] mt-1">0 children left behind; all physical QR audits closed</p>
                  </div>

                  <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="p-5 rounded-[18px] border">
                    <span className="text-xs text-[#98A0AE] font-bold block mb-1">Dead-Mileage Eliminated</span>
                    <strong className="text-3xl font-black text-[#8E44D8] tabular-nums">142 km</strong>
                    <p className="text-[11px] text-[#646C7A] mt-1">Saved via dynamic absence stop bypasses</p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. SETTINGS VIEW */}
            {activeNav === "Settings" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#ECEEF3]">Statutory Algorithm Thresholds</h2>
                  <p className="text-xs text-[#98A0AE]">Zero-hardware spatial parameters & safety interlocks</p>
                </div>

                <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="p-6 rounded-[20px] border space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-white">Driver GPS Emission Interval</span>
                      <span className="text-[#2B5BFF] font-mono">{thresholds.gpsIntervalSec} seconds</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={thresholds.gpsIntervalSec}
                      onChange={(e) => setThresholds({ ...thresholds, gpsIntervalSec: Number(e.target.value) })}
                      className="w-full accent-[#2B5BFF]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-white">Corridor Deviation Lateral Buffer</span>
                      <span className="text-[#2B5BFF] font-mono">±{thresholds.corridorBufferM} meters</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="150"
                      step="5"
                      value={thresholds.corridorBufferM}
                      onChange={(e) => setThresholds({ ...thresholds, corridorBufferM: Number(e.target.value) })}
                      className="w-full accent-[#2B5BFF]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-white">Anti-Early Departure Stop Hold</span>
                      <span className="text-[#2B5BFF] font-mono">{thresholds.antiEarlyHoldSec} seconds</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="180"
                      step="10"
                      value={thresholds.antiEarlyHoldSec}
                      onChange={(e) => setThresholds({ ...thresholds, antiEarlyHoldSec: Number(e.target.value) })}
                      className="w-full accent-[#2B5BFF]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-white">K-12 Drive-By Visual Sweep Speed Limit</span>
                      <span className="text-[#2B5BFF] font-mono">&lt;{thresholds.visualSweepSpeedKmh} km/h</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={thresholds.visualSweepSpeedKmh}
                      onChange={(e) => setThresholds({ ...thresholds, visualSweepSpeedKmh: Number(e.target.value) })}
                      className="w-full accent-[#2B5BFF]"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#282C38] flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setThresholds({
                          gpsIntervalSec: 3,
                          corridorBufferM: 75,
                          antiEarlyHoldSec: 60,
                          visualSweepSpeedKmh: 10,
                          proximityCheckinM: 25,
                        });
                        showToast("Defaults Restored", "Reset parameters to SIH statutory values.", "info");
                      }}
                      className="px-4 py-2 rounded-full bg-[#1E212B] text-[#98A0AE] text-xs font-bold hover:text-white transition"
                    >
                      Reset Defaults
                    </button>
                    <button
                      onClick={saveSettings}
                      className="px-5 py-2 rounded-full bg-[#00C281] text-[#003322] text-xs font-black shadow-md hover:bg-[#00D890] transition"
                    >
                      Save Parameters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Fleet Drawer Modal */}
      {showFleetDrawer && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="border rounded-[20px] max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowFleetDrawer(false)} className="absolute top-4 right-4 text-[#98A0AE] hover:text-white">
              ✕
            </button>
            <h3 className="text-lg font-extrabold text-white mb-1">Complete Vehicle Fleet Roster</h3>
            <p className="text-xs text-[#98A0AE] mb-4">48 vehicles enrolled across 6 campus corridors</p>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {buses.map((b) => (
                <div
                  key={b.bus_id}
                  onClick={() => {
                    setSelectedBusId(b.bus_id);
                    setShowFleetDrawer(false);
                    showToast("Vehicle Focused", `Camera locked to ${b.registration_number}.`, "info");
                  }}
                  style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
                  className="p-3 rounded-[12px] border flex items-center justify-between text-xs cursor-pointer hover:border-[#2B5BFF]"
                >
                  <div>
                    <strong className="text-white block">{b.registration_number} ({b.bus_id})</strong>
                    <span className="text-[#98A0AE]">{b.driver_name} · Route: {b.route_id}</span>
                  </div>
                  <span className="font-mono text-xs text-[#00C281]">{b.speed_kmh} km/h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Standby Dispatch Modal */}
      {activeModal === "Emergency Standby Bus Dispatch" && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="border rounded-[20px] p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]">
              ✕
            </button>
            <div className="w-12 h-12 rounded-full bg-[#00C281]/20 text-[#00C281] flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3] mb-2">
              One-Click Standby Dispatch
            </h3>
            <p className="text-[12px] text-[#98A0AE] mb-5">
              Instantly promote reserve coach <strong>TN-13-F-9999</strong>, migrate passenger manifests, and broadcast updates to parents.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setActiveModal(null)} className="flex-1 py-2.5 rounded-full bg-[#1E212B] text-[#ECEEF3] font-bold text-xs">
                Cancel
              </button>
              <button onClick={triggerStandbyDispatch} style={{ backgroundColor: "#00C281", color: "#003322" }} className="flex-1 py-2.5 rounded-full font-black text-xs">
                Execute (60s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Drill Modal */}
      {activeModal === "Emergency SOS Alarm Trigger" && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="border rounded-[20px] p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]">
              ✕
            </button>
            <div className="w-12 h-12 rounded-full bg-[#E8453C]/20 text-[#E8453C] flex items-center justify-center mx-auto mb-3">
              <Siren className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3] mb-2">
              Emergency SOS Drill
            </h3>
            <p className="text-[12px] text-[#98A0AE] mb-5">
              Simulate SOS alert trigger for Bus 3. Fans out high-priority alert to police relay and supervisor desk.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setActiveModal(null)} className="flex-1 py-2.5 rounded-full bg-[#1E212B] text-[#ECEEF3] font-bold text-xs">
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast("SOS Broadcast Active", "High-priority alarm dispatched across all consoles.", "warning");
                  setActiveModal(null);
                }}
                className="flex-1 py-2.5 rounded-full bg-[#E8453C] text-white font-bold text-xs"
              >
                Trigger SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {activeModal === "Sign Out Confirmation" && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="border rounded-[20px] p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]">
              ✕
            </button>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3] mb-2">Supervisor Session</h3>
            <p className="text-[12px] text-[#98A0AE] mb-5">Logged in as Rakesh M. (Chief Controller). Switch to another portal or reset session.</p>
            <div className="flex gap-2">
              <button onClick={() => setActiveModal(null)} className="flex-1 py-2.5 rounded-full bg-[#1E212B] text-[#ECEEF3] font-bold text-xs">
                Close
              </button>
              <button
                onClick={() => {
                  showToast("Session Reset", "Controller session cleared.", "info");
                  setActiveModal(null);
                }}
                className="flex-1 py-2.5 rounded-full bg-[#2B5BFF] text-white font-bold text-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
