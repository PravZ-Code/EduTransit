"use client";

import React, { useState } from "react";
import { PortSwitcherHeader } from "./PortSwitcherHeader";
import { GoButton } from "./citymapper/GoButton";
import { ODCard } from "./citymapper/ODCard";
import { LegStrip, LegItem } from "./citymapper/LegStrip";
import { RouteCard } from "./citymapper/RouteCard";
import { DeparturesBoard, DepartureRow } from "./citymapper/DeparturesBoard";
import { DisruptionBanner } from "./citymapper/DisruptionBanner";
import { GoTripModal, TripStep } from "./citymapper/GoTripModal";
import { CMTabBar } from "./citymapper/CMTabBar";
import {
  Bus,
  MapPin,
  Clock,
  Users,
  QrCode,
  AlertTriangle,
  Phone,
  ShieldCheck,
  Camera,
  StopCircle,
  PlayCircle,
  Search,
  CheckCircle2,
  AlertOctagon,
  Bell,
  Star,
  Gauge,
  Compass,
  Navigation,
  Sparkles,
  Heart,
  ChevronRight,
  Siren,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { useToast } from "./citymapper/Toast";
import { postJson } from "@/lib/api";

const BUS_ID = "bus_04";

interface Passenger {
  id: string;
  name: string;
  grade: string;
  stop: string;
  status: "boarded" | "pending" | "absent";
}

interface StopItem {
  id: string;
  name: string;
  time: string;
  status: "completed" | "current" | "upcoming";
  visualSweep: boolean;
  studentsToBoard: number;
}

const INITIAL_PASSENGERS: Passenger[] = [
  { id: "p1", name: "Aarav Kumar", grade: "Class 5A", stop: "Avadi Junction", status: "boarded" },
  { id: "p2", name: "Diya Patel", grade: "Class 6B", stop: "Avadi Junction", status: "boarded" },
  { id: "p3", name: "Rohan Mehta", grade: "Class 4A", stop: "Avadi Junction", status: "boarded" },
  { id: "p4", name: "Ananya Iyer", grade: "Class 7A", stop: "Pattabiram", status: "pending" },
  { id: "p5", name: "Vikram Malhotra", grade: "Class 8C", stop: "Pattabiram", status: "pending" },
  { id: "p6", name: "Sara Khan", grade: "Class 5B", stop: "Pattabiram", status: "absent" },
  { id: "p7", name: "Kabir Singh", grade: "Class 9A", stop: "Pine Crest", status: "pending" },
];

const INITIAL_STOPS: StopItem[] = [
  { id: "s1", name: "Thiruninravur Depot", time: "07:00 AM", status: "completed", visualSweep: false, studentsToBoard: 0 },
  { id: "s2", name: "2nd Main Road Crossing", time: "07:10 AM", status: "completed", visualSweep: false, studentsToBoard: 4 },
  { id: "s3", name: "Avadi Junction Bay #3", time: "07:20 AM", status: "current", visualSweep: false, studentsToBoard: 8 },
  { id: "s4", name: "Pattabiram Outer Ring", time: "07:28 AM", status: "upcoming", visualSweep: true, studentsToBoard: 6 },
  { id: "s5", name: "Mittanamalli Junction", time: "07:34 AM", status: "upcoming", visualSweep: false, studentsToBoard: 5 },
  { id: "s6", name: "Veltech University Main Gate", time: "07:45 AM", status: "upcoming", visualSweep: false, studentsToBoard: 0 },
];

export function DriverCabinApp() {
  const { showToast } = useToast();
  const [tripState, setTripState] = useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("IN_PROGRESS");
  const [passengers, setPassengers] = useState<Passenger[]>(INITIAL_PASSENGERS);
  const [stopsList, setStopsList] = useState<StopItem[]>(INITIAL_STOPS);
  const [rosterSearch, setRosterSearch] = useState("");

  const [isGoTripOpen, setIsGoTripOpen] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [rearSweepScanned, setRearSweepScanned] = useState(false);
  const [showRearSweepModal, setShowRearSweepModal] = useState(false);
  const [cmNavTab, setCmNavTab] = useState("getme");

  const boardedCount = passengers.filter((p) => p.status === "boarded").length;
  const totalStudents = passengers.length;

  // PURE-SOFTWARE TRIP LIFECYCLE: START TRIP
  const handleStartTrip = async () => {
    const { ok, data } = await postJson<any>("/trip/start", { bus_id: BUS_ID });
    setTripState("IN_PROGRESS");
    setRearSweepScanned(false);
    showToast(
      "Trip Commenced",
      "Foreground GPS service active (3-second intervals). Corridor locks engaged.",
      "success"
    );
  };

  // PURE-SOFTWARE TRIP LIFECYCLE: END TRIP interlocked with mandatory rear-sweep audit
  const handleEndTrip = async () => {
    if (!rearSweepScanned) {
      setShowRearSweepModal(true);
      return;
    }
    const { ok, data } = await postJson<any>("/trip/end", { bus_id: BUS_ID });
    setTripState("COMPLETED");
    showToast(
      "Trip Successfully Concluded",
      "Rear safety sweep audited. 0 children remaining. SLA logged to database.",
      "success"
    );
  };

  const handleResetTrip = () => {
    setTripState("NOT_STARTED");
    setRearSweepScanned(false);
    showToast("Trip Cycle Reset", "Vehicle returned to Thiruninravur Depot standby.", "info");
  };

  const routeLegs: LegItem[] = [
    { mode: "bus", label: "Route A", durationMin: 22 },
    { mode: "walk", label: "Campus Terminal", durationMin: 3 },
  ];

  const tripSteps: TripStep[] = [
    {
      id: "dr1",
      instruction: "Drive towards Stop #3 Avadi Junction",
      subtext: "Hold at curb until 07:20 AM · Anti-early departure interlock",
      mode: "bus",
      lineBadge: "BUS 04N",
      status: "current",
      durationMin: 2,
      stopsRemaining: 3,
    },
    {
      id: "dr2",
      instruction: "Approach Pattabiram Outer Ring",
      subtext: "6 students registered · Sara Khan declared absent (K-12 Visual Sweep)",
      mode: "bus",
      lineBadge: "BUS 04N",
      status: "upcoming",
      durationMin: 8,
    },
    {
      id: "dr3",
      instruction: "Terminal Arrival: Veltech University",
      subtext: "Perform mandatory Rear-Window QR Physical Sweep",
      mode: "walk",
      status: "upcoming",
      durationMin: 2,
    },
  ];

  const filteredPassengers = passengers.filter(
    (p) =>
      p.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      p.stop.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      p.grade.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <div
      style={{ backgroundColor: "#0C0E14" }}
      className="min-h-screen text-[#ECEEF3] flex flex-col font-sans select-none"
    >
      <PortSwitcherHeader currentPort={3004} />

      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-24">
        {/* Citymapper Driver Status Header */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                backgroundColor:
                  tripState === "IN_PROGRESS"
                    ? "#00C281"
                    : tripState === "NOT_STARTED"
                    ? "#FFB400"
                    : "#2B5BFF",
              }}
              className="w-10 h-10 rounded-[14px] flex items-center justify-center font-bold text-white shadow-lg transition"
            >
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[15px] text-[#ECEEF3]">
                  {tripState === "IN_PROGRESS"
                    ? "Trip In Progress"
                    : tripState === "NOT_STARTED"
                    ? "Standby at Depot"
                    : "Trip Completed"}
                </span>
                {tripState === "IN_PROGRESS" && (
                  <span className="w-2 h-2 rounded-full bg-[#00C281] animate-pulse" />
                )}
              </div>
              <p className="text-[12px] font-mono text-[#98A0AE]">
                07:18 AM · Bus 3 (TN 10 AB 1234)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tripState === "NOT_STARTED" && (
              <button
                onClick={handleStartTrip}
                style={{ backgroundColor: "#00C281", color: "#003322" }}
                className="px-3.5 py-1.5 rounded-full font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Start Trip</span>
              </button>
            )}

            {tripState === "IN_PROGRESS" && (
              <button
                onClick={handleEndTrip}
                className="px-3 py-1.5 rounded-full bg-[#E8453C]/20 hover:bg-[#E8453C] text-[#E8453C] hover:text-white border border-[#E8453C]/40 text-xs font-bold transition flex items-center gap-1 active:scale-95"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>End Trip</span>
              </button>
            )}

            {tripState === "COMPLETED" && (
              <button
                onClick={handleResetTrip}
                className="px-3 py-1.5 rounded-full bg-[#2B5BFF]/20 hover:bg-[#2B5BFF] text-[#4D7BFF] hover:text-white border border-[#2B5BFF]/40 text-xs font-bold transition flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Trip</span>
              </button>
            )}

            <button
              onClick={() => setShowNotifModal(true)}
              className="w-8 h-8 rounded-xl bg-[#15171F] border border-[#282C38] flex items-center justify-center text-[#98A0AE] hover:text-[#ECEEF3]"
              title="Supervisor Dispatch Alerts"
            >
              <Bell className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#E8453C]/10 text-[#E8453C] border border-[#E8453C]/30 font-bold">
              :3004
            </span>
          </div>
        </div>

        {/* ================= TAB 1: GET ME (Cockpit HUD) ================= */}
        {cmNavTab === "getme" && (
          <>
            {/* Invariant 2: Anti-Early Departure Disruption Banner */}
            <DisruptionBanner
              message="Anti-Early Departure Interlock Active"
              subtext="Do NOT depart Stop #3 Avadi Junction prior to 07:20 AM timetable schedule."
              className="mb-3.5 cursor-pointer"
              onClick={() =>
                showToast(
                  "Early Departure Interlock",
                  "Statutory rule: Vehicles must hold at stop until published timetable - 60s.",
                  "info"
                )
              }
            />

            {/* Origin → Destination Card */}
            <ODCard
              from="Depot (Thiruninravur)"
              to="Veltech University"
              fromSubtitle="Route A Morning Inbound"
              toSubtitle="Bay #1 Terminal Drop"
              className="mb-3.5"
            />

            {/* Next Stop Highlight Card */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 mb-3.5 shadow-md"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#E8453C] block">
                    Next Approaching Stop
                  </span>
                  <h2 className="text-[22px] font-black text-[#ECEEF3] tracking-tight">
                    Avadi Junction Bay #3
                  </h2>
                  <p className="text-[11px] text-[#98A0AE] mt-0.5">
                    Stop #3 · 8 registered students awaiting pickup
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#00C281]/20 text-[#00C281] border border-[#00C281]/40 font-mono font-black text-sm">
                    ETA 2 min
                  </span>
                  <span className="block text-[11px] font-mono text-[#98A0AE] mt-1">
                    0.8 km distance
                  </span>
                </div>
              </div>

              {/* Curb Hold Warning */}
              <div className="mt-2 pt-2 border-t border-[#282C38] flex items-center justify-between text-[11px]">
                <span className="text-[#FFB400] font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  HOLD AT CURB UNTIL 07:20 AM
                </span>
                <span className="text-[#98A0AE] font-mono">Monotonic Kalman ETA</span>
              </div>
            </div>

            {/* Manifest Load Gauge */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 mb-3.5"
            >
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-bold text-[#ECEEF3] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#2B5BFF]" />
                  Commuter Manifest Load
                </span>
                <span className="font-mono font-bold text-[#4D7BFF]">
                  {boardedCount} / {totalStudents} Boarded
                </span>
              </div>

              <div className="relative h-2.5 w-full bg-[#1E212B] rounded-full overflow-hidden mb-2">
                <div
                  style={{
                    width: `${(boardedCount / totalStudents) * 100}%`,
                    background: "linear-gradient(90deg, #2B5BFF 0%, #00C281 100%)",
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#98A0AE]">
                <span className="text-[#00C281] font-semibold">
                  {passengers.filter((p) => p.status === "pending").length} pending boarding
                </span>
                <span className="text-[#E8453C]">
                  {passengers.filter((p) => p.status === "absent").length} absent declared
                </span>
              </div>
            </div>

            {/* Citymapper GO BUTTON (FOR SCANNER) */}
            <div className="mb-4">
              <GoButton
                onClick={() => setShowScannerModal(true)}
                label="GO · VERIFY STUDENT BOARDING"
              />
            </div>

            {/* 4 Action Tiles styled in Citymapper Surface palette */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                onClick={() => setShowRosterModal(true)}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-3.5 rounded-[16px] border text-left hover:border-[#4D7BFF] transition active:scale-95"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#2B5BFF]/15 text-[#4D7BFF] flex items-center justify-center mb-2.5">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-bold text-[13px] text-[#ECEEF3] block">
                  Passenger List
                </span>
                <span className="text-[11px] text-[#98A0AE]">View roster ({passengers.length})</span>
              </button>

              <button
                onClick={() => setShowStopsModal(true)}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-3.5 rounded-[16px] border text-left hover:border-[#4D7BFF] transition active:scale-95"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#FFB400]/15 text-[#FFB400] flex items-center justify-center mb-2.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="font-bold text-[13px] text-[#ECEEF3] block">
                  Route & Stops
                </span>
                <span className="text-[11px] text-[#98A0AE]">6 sequence stops</span>
              </button>

              <button
                onClick={() => setShowIncidentModal(true)}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-3.5 rounded-[16px] border text-left hover:border-[#4D7BFF] transition active:scale-95"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#FF8A00]/15 text-[#FF8A00] flex items-center justify-center mb-2.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="font-bold text-[13px] text-[#ECEEF3] block">
                  Report Incident
                </span>
                <span className="text-[11px] text-[#98A0AE]">Delay / Flat tyre</span>
              </button>

              <button
                onClick={() =>
                  showToast(
                    "VoIP Dispatch Connected",
                    "Connecting direct audio relay to Transport Supervisor Office.",
                    "info"
                  )
                }
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-3.5 rounded-[16px] border text-left hover:border-[#4D7BFF] transition active:scale-95"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#00C281]/15 text-[#00C281] flex items-center justify-center mb-2.5">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-bold text-[13px] text-[#ECEEF3] block">
                  Supervisor
                </span>
                <span className="text-[11px] text-[#98A0AE]">Direct dispatch VoIP</span>
              </button>
            </div>
          </>
        )}

        {/* ================= TAB 2: NEARBY (Route Waypoints & Visual Sweep Stops) ================= */}
        {cmNavTab === "nearby" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-[17px] font-extrabold text-[#ECEEF3]">Stop Sequence & Sweeps</h2>
                <p className="text-[12px] text-[#98A0AE]">Approved Route 04N corridor stops</p>
              </div>
              <Compass className="w-5 h-5 text-[#2B5BFF]" />
            </div>

            <div className="space-y-2.5">
              {stopsList.map((s, idx) => (
                <div
                  key={s.id}
                  style={{
                    backgroundColor: "#15171F",
                    borderColor: s.status === "current" ? "#00C281" : "#282C38",
                  }}
                  className="rounded-[16px] border p-3.5 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#1E212B] text-[#ECEEF3] font-mono text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-[#ECEEF3] block">{s.name}</span>
                        <span className="text-[11px] text-[#98A0AE]">Scheduled: {s.time}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === "completed"
                          ? "bg-[#0C0E14] text-[#646C7A]"
                          : s.status === "current"
                          ? "bg-[#00C281]/20 text-[#00C281]"
                          : "bg-[#2B5BFF]/20 text-[#4D7BFF]"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  {s.visualSweep && (
                    <div className="mt-2 pt-2 border-t border-[#282C38] flex items-center gap-2 text-[11px] text-[#FFB400]">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>K-12 Invariant 1: Perform 5-sec visual curb sweep (&lt;10 km/h)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                showToast("Navigation Reroute", "Active corridor verified with ±75m lateral buffer.", "success");
                setIsGoTripOpen(true);
              }}
              style={{ backgroundColor: "#2B5BFF" }}
              className="w-full py-3 rounded-full text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#2B5BFF]/30 active:scale-95 transition"
            >
              <Navigation className="w-4 h-4" />
              <span>TURN-BY-TURN CORRIDOR NAVIGATION</span>
            </button>
          </div>
        )}

        {/* ================= TAB 3: SAVED (Driver Shift Runs) ================= */}
        {cmNavTab === "saved" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-[17px] font-extrabold text-[#ECEEF3]">Assigned Shift Runs</h2>
                <p className="text-[12px] text-[#98A0AE]">Daily institutional timetable rosters</p>
              </div>
              <Calendar className="w-5 h-5 text-[#4D7BFF]" />
            </div>

            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[#ECEEF3] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C281]" />
                  Morning Inbound Run (Route 04N)
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00C281]/20 text-[#00C281]">
                  CURRENT
                </span>
              </div>
              <p className="text-[11px] text-[#98A0AE] mb-3">
                06:30 AM – 08:00 AM · Thiruninravur → Veltech Bay #1 · 35 Students
              </p>
              <button
                onClick={() => {
                  setCmNavTab("getme");
                  showToast("Morning Shift Active", "Roster synchronized with GPS dispatch.", "info");
                }}
                style={{ backgroundColor: "#00C281", color: "#003322" }}
                className="w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Return to Active Cockpit</span>
              </button>
            </div>

            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[#ECEEF3] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2B5BFF]" />
                  Afternoon Outbound Run (Route 04N Return)
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#2B5BFF]/20 text-[#4D7BFF]">
                  03:30 PM
                </span>
              </div>
              <p className="text-[11px] text-[#98A0AE] mb-3">
                03:30 PM – 05:00 PM · Veltech Bay #1 → Thiruninravur
              </p>
              <button
                onClick={() => {
                  showToast("Afternoon Shift Ready", "Scheduled for 03:30 PM departure.", "info");
                }}
                className="w-full py-2 rounded-xl bg-[#1E212B] hover:bg-[#282C38] text-[#ECEEF3] border border-[#282C38] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Clock className="w-3.5 h-3.5 text-[#FFB400]" />
                <span>View Afternoon Stops</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 4: YOU (Driver Cabin Profile & Vehicle Status) ================= */}
        {cmNavTab === "you" && (
          <div className="space-y-3.5">
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[20px] border p-4 text-center shadow-lg"
            >
              <div
                style={{ backgroundColor: "#E8453C" }}
                className="w-16 h-16 rounded-[18px] flex items-center justify-center font-black text-white text-xl mx-auto mb-2 shadow-lg shadow-[#E8453C]/30"
              >
                RK
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="font-extrabold text-[16px] text-[#ECEEF3]">Rajesh K.</h3>
                <Star className="w-4 h-4 fill-[#FFB400] text-[#FFB400]" />
              </div>
              <p className="text-[11px] text-[#00C281] font-semibold">Gold Star Compliance Driver (4.98 ⭐)</p>
              <p className="text-[11px] font-mono text-[#98A0AE] mt-0.5">Heavy Commercial Badge #DL-TN-048921</p>

              <div className="mt-3.5 pt-3 border-t border-[#282C38] grid grid-cols-2 gap-2 text-left text-xs">
                <div className="bg-[#1E212B] p-2.5 rounded-xl border border-[#282C38]">
                  <span className="text-[10px] text-[#98A0AE] block">Vehicle Plate</span>
                  <span className="font-bold text-[#ECEEF3]">TN 10 AB 1234</span>
                </div>
                <div className="bg-[#1E212B] p-2.5 rounded-xl border border-[#282C38]">
                  <span className="text-[10px] text-[#98A0AE] block">Speed Governor</span>
                  <span className="font-bold text-[#00C281]">Max 40 km/h (Active)</span>
                </div>
              </div>
            </div>

            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-3.5 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#98A0AE]">GPS Vector Rate</span>
                <span className="font-mono font-bold text-[#00C281]">3 seconds (Foreground Active)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#98A0AE]">Corridor Adherence</span>
                <span className="font-mono font-bold text-[#4D7BFF]">100% (Within ±75m Buffer)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#98A0AE]">Rear Window Sweep Status</span>
                <span
                  className={`font-mono font-bold ${
                    rearSweepScanned ? "text-[#00C281]" : "text-[#FFB400]"
                  }`}
                >
                  {rearSweepScanned ? "AUDITED SAFE" : "PENDING END OF TRIP"}
                </span>
              </div>
            </div>

            {/* Emergency SOS Trigger */}
            <button
              onClick={() => setShowSosModal(true)}
              style={{ backgroundColor: "#E8453C" }}
              className="w-full py-3 rounded-full text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#E8453C]/30 active:scale-95 transition"
            >
              <Siren className="w-4 h-4" />
              <span>EMERGENCY SOS DRILL TRIGGER</span>
            </button>
          </div>
        )}
      </main>

      {/* Citymapper Bottom Tab Bar */}
      <CMTabBar activeTab={cmNavTab} onTabChange={(id) => setCmNavTab(id)} />

      {/* GO Trip Mode Takeover */}
      <GoTripModal
        isOpen={isGoTripOpen}
        onClose={() => setIsGoTripOpen(false)}
        destinationName="Veltech University Main Gate Bay #1"
        totalEtaMin={24}
        steps={tripSteps}
        currentStepIndex={0}
      />

      {/* Camera Scanner Simulation Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-6 max-w-xs w-full text-center shadow-2xl relative"
          >
            <button
              onClick={() => setShowScannerModal(false)}
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3] text-sm"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3] mb-1">
              Verify Student QR
            </h3>
            <p className="text-[11px] text-[#98A0AE] mb-4">
              Point phone camera at student dynamic pass or guardian handover token.
            </p>
            <div className="w-44 h-44 mx-auto bg-[#0C0E14] rounded-[16px] border-2 border-dashed border-[#00C281] flex flex-col items-center justify-center p-4">
              <Camera className="w-12 h-12 text-[#00C281] animate-pulse mb-2" />
              <span className="text-[10px] text-[#98A0AE]">Camera Stream Active</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowScannerModal(false)}
                className="flex-1 py-2.5 rounded-full bg-[#1E212B] text-[#ECEEF3] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Mark first pending student as boarded
                  const updated = [...passengers];
                  const firstPending = updated.find((p) => p.status === "pending");
                  if (firstPending) {
                    firstPending.status = "boarded";
                    setPassengers(updated);
                  }
                  setShowScannerModal(false);

                  const { ok, data } = await postJson<any>("/trips/board", {
                    student_id: firstPending ? firstPending.id : "stu_01",
                    bus_id: BUS_ID,
                    method: "QR_CAMERA_SCAN",
                  });

                  showToast(
                    "Student Boarded",
                    `${firstPending ? firstPending.name : "Student"} verified. Custody timestamp recorded.`,
                    "success"
                  );
                }}
                style={{ backgroundColor: "#00C281", color: "#003322" }}
                className="flex-1 py-2.5 rounded-full font-black text-xs active:scale-95 transition"
              >
                Simulate Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rear Window QR Physical Sweep Modal */}
      {showRearSweepModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-6 max-w-xs w-full text-center shadow-2xl relative"
          >
            <button
              onClick={() => setShowRearSweepModal(false)}
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3] text-sm"
            >
              ✕
            </button>
            <div className="w-12 h-12 rounded-full bg-[#FFB400]/20 text-[#FFB400] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3]">
              Rear Window Safety Sweep
            </h3>
            <p className="text-[11px] text-[#98A0AE] leading-relaxed mt-1 mb-4">
              Walk down the bus aisle and scan the printed QR code on the rear window to verify no child remains asleep before ending trip.
            </p>
            <button
              onClick={async () => {
                const { ok, data } = await postJson<any>("/sweep/verify", {
                  bus_id: BUS_ID,
                  conductor_id: "cond-001",
                  rear_qr_payload: "EDUTRANSIT_REAR_SWEEP_VERIFIED_2026",
                });
                setRearSweepScanned(true);
                setShowRearSweepModal(false);
                showToast(
                  "Rear Sweep Audited",
                  "Physical rear-window QR code validated. 0 children remaining. End Trip unlocked.",
                  "success"
                );
              }}
              style={{ backgroundColor: "#00C281", color: "#003322" }}
              className="w-full py-2.5 rounded-full font-black text-xs active:scale-95 transition"
            >
              Scan Rear Window QR
            </button>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-5 max-w-xs w-full shadow-2xl relative max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#282C38]">
              <h3 className="font-extrabold text-[15px] text-[#ECEEF3]">
                Passenger Manifest ({boardedCount}/{totalStudents})
              </h3>
              <button
                onClick={() => setShowRosterModal(false)}
                className="text-[#98A0AE] hover:text-[#ECEEF3] text-sm"
              >
                ✕
              </button>
            </div>

            {/* Roster Search */}
            <div className="py-2.5">
              <input
                type="text"
                placeholder="Search passenger or stop..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full bg-[#0C0E14] border border-[#282C38] rounded-xl px-3 py-1.5 text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF]"
              />
            </div>

            <div className="flex-1 overflow-y-auto py-1 space-y-2">
              {filteredPassengers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    // Click to cycle status
                    const updated = passengers.map((item) => {
                      if (item.id === p.id) {
                        const nextStatus: Passenger["status"] =
                          item.status === "pending"
                            ? "boarded"
                            : item.status === "boarded"
                            ? "absent"
                            : "pending";
                        return { ...item, status: nextStatus };
                      }
                      return item;
                    });
                    setPassengers(updated);
                    showToast(
                      "Status Updated",
                      `${p.name} marked ${p.status === "pending" ? "BOARDED" : p.status === "boarded" ? "ABSENT" : "PENDING"}`,
                      "info"
                    );
                  }}
                  className="p-2.5 rounded-[12px] bg-[#1E212B] border border-[#282C38] flex items-center justify-between text-xs cursor-pointer hover:border-[#4D7BFF] transition"
                >
                  <div>
                    <span className="font-bold text-[#ECEEF3] block">{p.name}</span>
                    <span className="text-[11px] text-[#98A0AE]">
                      {p.grade} · {p.stop}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === "boarded"
                        ? "bg-[#00C281]/20 text-[#00C281]"
                        : p.status === "absent"
                        ? "bg-[#E8453C]/20 text-[#E8453C]"
                        : "bg-[#FFB400]/20 text-[#FFB400]"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRosterModal(false)}
              className="mt-3 w-full py-2 rounded-xl bg-[#282C38] text-xs font-bold text-[#ECEEF3]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Stops Modal */}
      {showStopsModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-5 max-w-xs w-full shadow-2xl relative max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#282C38]">
              <h3 className="font-extrabold text-[15px] text-[#ECEEF3]">
                Route A Stops
              </h3>
              <button onClick={() => setShowStopsModal(false)} className="text-[#98A0AE] text-sm">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {stopsList.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-[12px] bg-[#1E212B] border border-[#282C38] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#646C7A]">{idx + 1}.</span>
                    <div>
                      <span className="font-bold text-[#ECEEF3] block">{s.name}</span>
                      <span className="text-[11px] text-[#98A0AE]">Scheduled: {s.time}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === "completed"
                        ? "bg-[#0C0E14] text-[#646C7A]"
                        : s.status === "current"
                        ? "bg-[#00C281]/20 text-[#00C281]"
                        : "bg-[#2B5BFF]/20 text-[#4D7BFF]"
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowStopsModal(false)}
              className="mt-2 w-full py-2 rounded-xl bg-[#282C38] text-xs font-bold text-[#ECEEF3]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-5 max-w-xs w-full shadow-2xl relative"
          >
            <button
              onClick={() => setShowIncidentModal(false)}
              className="absolute top-4 right-4 text-[#98A0AE] text-sm"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[15px] text-[#ECEEF3] mb-1">
              Report Incident
            </h3>
            <p className="text-[11px] text-[#98A0AE] mb-4">
              Select incident type for immediate dispatch triage.
            </p>
            <div className="space-y-2">
              {[
                "Vehicle Breakdown (Request Standby)",
                "Traffic Delay > 10m",
                "Flat Tyre",
                "Medical Emergency",
              ].map((inc, i) => (
                <button
                  key={i}
                  onClick={async () => {
                    await postJson("/sos/trigger", {
                      bus_id: BUS_ID,
                      incident_type: inc,
                      location: "Avadi Junction Bay #3",
                    });
                    showToast("Incident Logged", `${inc} sent to Dispatch Supervisor.`, "warning");
                    setShowIncidentModal(false);
                  }}
                  className="w-full text-left p-2.5 rounded-[12px] bg-[#1E212B] hover:bg-[#282C38] text-xs text-[#ECEEF3] border border-[#282C38] transition active:scale-95"
                >
                  {inc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOS Drill Confirmation Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#E8453C" }}
            className="border-2 rounded-[20px] p-6 max-w-xs w-full text-center shadow-2xl relative"
          >
            <div className="w-12 h-12 rounded-full bg-[#E8453C]/20 text-[#E8453C] flex items-center justify-center mx-auto mb-3">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-black text-[17px] text-[#ECEEF3]">
              Confirm Emergency SOS?
            </h3>
            <p className="text-[11px] text-[#98A0AE] mt-1 mb-5">
              This triggers a high-priority alert across Transport Dispatch, Campus Security, and local Police relay.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSosModal(false)}
                className="flex-1 py-2.5 rounded-full bg-[#1E212B] text-[#ECEEF3] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await postJson("/sos/trigger", {
                    bus_id: BUS_ID,
                    severity: "CRITICAL",
                    location: "Avadi Junction Bay #3",
                  });
                  showToast("SOS Alert Broadcast", "Emergency dispatched. Audio beacon open.", "error");
                  setShowSosModal(false);
                }}
                style={{ backgroundColor: "#E8453C" }}
                className="flex-1 py-2.5 rounded-full text-white font-black text-xs active:scale-95 transition"
              >
                Broadcast SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Notifications Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-5 max-w-xs w-full shadow-2xl relative"
          >
            <button
              onClick={() => setShowNotifModal(false)}
              className="absolute top-4 right-4 text-[#98A0AE] text-sm"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[15px] text-[#ECEEF3] mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00C281]" />
              Dispatch Messages
            </h3>
            <div className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
              <div className="p-2.5 bg-[#1E212B] rounded-xl border border-[#282C38]">
                <div className="flex items-center justify-between font-bold text-[#FFB400]">
                  <span>Pattabiram Rail Gate Delay</span>
                  <span className="text-[10px] text-[#98A0AE]">07:15 AM</span>
                </div>
                <p className="text-[11px] text-[#98A0AE] mt-0.5">Expect 4-min delay on downstream gate crossing.</p>
              </div>
              <div className="p-2.5 bg-[#1E212B] rounded-xl border border-[#282C38]">
                <div className="flex items-center justify-between font-bold text-[#00C281]">
                  <span>Sara Khan Absent</span>
                  <span className="text-[10px] text-[#98A0AE]">07:10 AM</span>
                </div>
                <p className="text-[11px] text-[#98A0AE] mt-0.5">Parent declared absence. Perform &lt;10km/h visual curb sweep at Stop #4.</p>
              </div>
            </div>
            <button
              onClick={() => setShowNotifModal(false)}
              className="mt-4 w-full py-2 rounded-xl bg-[#282C38] text-xs font-bold text-[#ECEEF3]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
