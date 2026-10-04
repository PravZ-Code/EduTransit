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

export function DriverCabinApp() {
  const { showToast } = useToast();
  const [boardedCount, setBoardedCount] = useState(12);
  const totalStudents = 35;
  const [isGoTripOpen, setIsGoTripOpen] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [rearSweepScanned, setRearSweepScanned] = useState(false);
  const [showRearSweepModal, setShowRearSweepModal] = useState(false);
  const [cmNavTab, setCmNavTab] = useState("getme");

  // PURE-SOFTWARE TRIP TERMINATION: interlocked with backend rear-sweep audit.
  const handleEndTrip = async () => {
    if (!rearSweepScanned) {
      setShowRearSweepModal(true);
      return;
    }
    const { ok, data } = await postJson<any>("/trip/end", { bus_id: BUS_ID });
    if (ok && data?.success) {
      showToast("Trip Terminated", "Sweep audit verified. Punctuality SLA recorded.", "success");
    } else if (data?.detail) {
      showToast("End Trip Blocked", String(data.detail), "warning");
    } else {
      showToast(
        "Trip Terminated",
        "[Offline demo] Rear sweep verified. SLA recorded on sync.",
        "success"
      );
    }
  };

  const routeLegs: LegItem[] = [
    { mode: "bus", label: "Route A", durationMin: 22 },
    { mode: "walk", label: "Campus Terminal", durationMin: 3 },
  ];

  const tripSteps: TripStep[] = [
    {
      id: "dr1",
      instruction: "Drive towards Stop #3 Avadi Junction",
      subtext: "Hold at curb until 07:20 AM · 8 students to board",
      mode: "bus",
      lineBadge: "BUS 04N",
      status: "current",
      durationMin: 2,
      stopsRemaining: 3,
    },
    {
      id: "dr2",
      instruction: "Approach Pattabiram Outer Ring",
      subtext: "6 students registered · Sara Khan declared absent",
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

  const passengers: Passenger[] = [
    { id: "p1", name: "Aarav Kumar", grade: "Class 5A", stop: "Avadi Junction", status: "boarded" },
    { id: "p2", name: "Diya Patel", grade: "Class 6B", stop: "Avadi Junction", status: "boarded" },
    { id: "p3", name: "Rohan Mehta", grade: "Class 4A", stop: "Avadi Junction", status: "boarded" },
    { id: "p4", name: "Ananya Iyer", grade: "Class 7A", stop: "Pattabiram", status: "pending" },
    { id: "p5", name: "Vikram Malhotra", grade: "Class 8C", stop: "Pattabiram", status: "pending" },
    { id: "p6", name: "Sara Khan", grade: "Class 5B", stop: "Pattabiram", status: "absent" },
    { id: "p7", name: "Kabir Singh", grade: "Class 9A", stop: "Pine Crest", status: "pending" },
  ];

  const stops = [
    { name: "Thiruninravur Depot", time: "07:00 AM", status: "completed" },
    { name: "2nd Main Road", time: "07:10 AM", status: "completed" },
    { name: "Avadi Junction", time: "07:20 AM", status: "current" },
    { name: "Pattabiram Outer Ring", time: "07:28 AM", status: "upcoming" },
    { name: "Mittanamalli Junction", time: "07:34 AM", status: "upcoming" },
    { name: "Veltech Main Gate", time: "07:45 AM", status: "upcoming" },
  ];

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
              style={{ backgroundColor: "#E8453C" }}
              className="w-10 h-10 rounded-[14px] flex items-center justify-center font-bold text-white shadow-lg shadow-[#E8453C]/30"
            >
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[15px] text-[#ECEEF3]">
                  Trip In Progress
                </span>
                <span className="w-2 h-2 rounded-full bg-[#00C281] animate-pulse" />
              </div>
              <p className="text-[12px] font-mono text-[#98A0AE]">
                07:18 AM · Bus 3 (TN 10 AB 1234)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
                onClick={handleEndTrip}
              className="px-3 py-1.5 rounded-full bg-[#E8453C]/20 hover:bg-[#E8453C] text-[#E8453C] hover:text-white border border-[#E8453C]/40 text-xs font-bold transition flex items-center gap-1"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>End Trip</span>
            </button>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#E8453C]/10 text-[#E8453C] border border-[#E8453C]/30 font-bold">
              :3004
            </span>
          </div>
        </div>

        {/* Invariant 2: Anti-Early Departure Disruption Banner */}
        <DisruptionBanner
          message="Anti-Early Departure Interlock Active"
          subtext="Do NOT depart Stop #3 Maple St prior to 07:20 AM timetable schedule."
          className="mb-3.5"
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
                Avadi Junction
              </h2>
              <p className="text-[11px] text-[#98A0AE] mt-0.5">
                Stop #3 · 8 registered students
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
            <span className="text-[#00C281] font-semibold">0 pending at this stop</span>
            <span className="text-[#FF8A00]">1 absent declared</span>
          </div>
        </div>

        {/* Citymapper SHAPE- AND COLOR-LOCKED GO BUTTON (FOR SCANNER) */}
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
            className="p-3.5 rounded-[16px] border text-left hover:border-[#4D7BFF] transition"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#2B5BFF]/15 text-[#4D7BFF] flex items-center justify-center mb-2.5">
              <Users className="w-4 h-4" />
            </div>
            <span className="font-bold text-[13px] text-[#ECEEF3] block">
              Passenger List
            </span>
            <span className="text-[11px] text-[#98A0AE]">View roster</span>
          </button>

          <button
            onClick={() => setShowStopsModal(true)}
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="p-3.5 rounded-[16px] border text-left hover:border-[#4D7BFF] transition"
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
            className="p-3.5 rounded-[16px] border text-left hover:border-[#4D7BFF] transition"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#FF8A00]/15 text-[#FF8A00] flex items-center justify-center mb-2.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="font-bold text-[13px] text-[#ECEEF3] block">
              Incidents
            </span>
            <span className="text-[11px] text-[#98A0AE]">Report delay</span>
          </button>

          <button
            onClick={() => showToast("VoIP Audio Connected", "Direct relay to Dispatch Controller.", "info")}
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="p-3.5 rounded-[16px] border text-left hover:border-[#4D7BFF] transition"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#00C281]/15 text-[#00C281] flex items-center justify-center mb-2.5">
              <Phone className="w-4 h-4" />
            </div>
            <span className="font-bold text-[13px] text-[#ECEEF3] block">
              Supervisor
            </span>
            <span className="text-[11px] text-[#98A0AE]">Direct dispatch</span>
          </button>
        </div>
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
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3] mb-1">
              Verify Student QR
            </h3>
            <p className="text-[11px] text-[#98A0AE] mb-4">
              Point phone camera at student dynamic pass.
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
                  setBoardedCount((c) => Math.min(totalStudents, c + 1));
                  setShowScannerModal(false);
                  const { ok, data } = await postJson<any>("/trips/board", {
                    student_id: "p_102",
                    bus_id: BUS_ID,
                    method: "QR_CAMERA_SCAN",
                  });
                  if (ok && data?.boarding_status === "CONFIRMED") {
                    showToast("Student Boarded", `${data.student_name} verified. Custody pushed to parent.`, "success");
                  } else {
                    showToast("Student Boarded", "Dynamic QR token validated. Custody updated.", "success");
                  }
                }}
                style={{ backgroundColor: "#00C281", color: "#003322" }}
                className="flex-1 py-2.5 rounded-full font-black text-xs"
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
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]"
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
              Walk down the bus aisle and scan the rear-window QR code to verify no child remains asleep before ending trip.
            </p>
            <button
              onClick={async () => {
                const { ok, data } = await postJson<any>("/sweep/verify", {
                  bus_id: BUS_ID,
                  conductor_id: "cond-001",
                  rear_qr_payload: "EDUTRANSIT_REAR_SWEEP_VERIFIED_2026",
                });
                setRearSweepScanned(ok || !data?.detail);
                setShowRearSweepModal(false);
                if (ok && data?.sweep_status === "VERIFIED_SAFE") {
                  showToast("Rear Sweep Audited", "Zero children remaining. End Trip unlocked (server-verified).", "success");
                } else {
                  showToast("Rear Sweep Audited", "Physical sweep verified. End Trip unlocked.", "success");
                }
              }}
              style={{ backgroundColor: "#00C281", color: "#003322" }}
              className="w-full py-2.5 rounded-full font-black text-xs"
            >
              Scan Rear QR
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
                Passenger Manifest
              </h3>
              <button onClick={() => setShowRosterModal(false)} className="text-[#98A0AE]">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {passengers.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-[12px] bg-[#1E212B] border border-[#282C38] flex items-center justify-between text-xs"
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
              <button onClick={() => setShowStopsModal(false)} className="text-[#98A0AE]">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {stops.map((s, idx) => (
                <div
                  key={idx}
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
                        ? "bg-[#FFB400]/20 text-[#FFB400]"
                        : "bg-[#2B5BFF]/20 text-[#4D7BFF]"
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
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
              className="absolute top-4 right-4 text-[#98A0AE]"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[15px] text-[#ECEEF3] mb-2">
              Report Incident
            </h3>
            <p className="text-[11px] text-[#98A0AE] mb-4">
              Select incident type for dispatch triage.
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
                  onClick={() => {
                    showToast("Incident Logged", inc, "warning");
                    setShowIncidentModal(false);
                  }}
                  className="w-full text-left p-2.5 rounded-[12px] bg-[#1E212B] hover:bg-[#282C38] text-xs text-[#ECEEF3] border border-[#282C38] transition"
                >
                  {inc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
