"use client";

import React, { useState, useEffect } from "react";
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
  Bell,
  Bus,
  MapPin,
  Clock,
  ShieldCheck,
  UserCheck,
  Phone,
  QrCode,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Compass,
  Navigation,
  Search,
  CheckCircle2,
  AlertTriangle,
  Heart,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Star,
  Users,
} from "lucide-react";
import { useToast } from "./citymapper/Toast";
import { postJson } from "@/lib/api";

export function K12GuardianApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("getme");
  const [boarded, setBoarded] = useState(false);
  const [absent, setAbsent] = useState(false);
  const [isGoTripOpen, setIsGoTripOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(8);
  const [totpCountdown, setTotpCountdown] = useState(25);
  const [selectedPickupStop, setSelectedPickupStop] = useState("Avadi Junction Bay #3");
  const [pushNotifsEnabled, setPushNotifsEnabled] = useState(true);
  const [smsFallbacksEnabled, setSmsFallbacksEnabled] = useState(true);

  // Rotating TOTP Countdown for the dynamic Guardian QR pass
  useEffect(() => {
    const timer = setInterval(() => {
      setTotpCountdown((c) => (c > 1 ? c - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const routeLegs: LegItem[] = [
    { mode: "walk", label: "Walk", durationMin: 2 },
    { mode: "bus", label: "Bus 3", durationMin: 18 },
    { mode: "walk", label: "School Gate", durationMin: 2 },
  ];

  const tripSteps: TripStep[] = [
    {
      id: "k1",
      instruction: "Walk to Stop #3 Avadi Junction",
      subtext: "150 meters · Pickup corridor (±75m adherence)",
      mode: "walk",
      status: "completed",
      durationMin: 2,
    },
    {
      id: "k2",
      instruction: "Board School Bus 3 (TN 10 AB 1234)",
      subtext: "Conductor scan required · Driver Rajesh K. (Rating 4.98 ⭐)",
      mode: "bus",
      lineBadge: "BUS 3",
      status: "current",
      durationMin: 18,
      stopsRemaining: 2,
    },
    {
      id: "k3",
      instruction: "Alight at Veltech University Bay #1",
      subtext: "Rear safety sweep physical audit verified",
      mode: "walk",
      status: "upcoming",
      durationMin: 2,
    },
  ];

  const departureRows: DepartureRow[] = [
    {
      badge: "BUS 3",
      mode: "bus",
      destination: "Veltech University (Morning Inbound)",
      minutes: 2,
      subtext: "Stop #3 Maple St · Driver Rajesh K.",
    },
    {
      badge: "BUS 7",
      mode: "bus",
      destination: "Veltech University via Pattabiram",
      minutes: 11,
      subtext: "Secondary reserve coach",
    },
    {
      badge: "BUS 3",
      mode: "bus",
      destination: "Afternoon Return to Avadi Bay #3",
      minutes: 430,
      subtext: "Scheduled departure 03:30 PM",
    },
  ];

  const nearbyCorridors = [
    {
      id: "c1",
      name: "Avadi Junction Bay #3",
      distance: "150m",
      walkTime: "2 min walk",
      buses: ["Bus 3 (Arr. 2m)", "Bus 7 (Arr. 11m)"],
      isCurrent: true,
    },
    {
      id: "c2",
      name: "2nd Main Road Crossing",
      distance: "650m",
      walkTime: "8 min walk",
      buses: ["Bus 3 (Arr. 9m)", "Bus 12 (Arr. 15m)"],
      isCurrent: false,
    },
    {
      id: "c3",
      name: "Pattabiram Outer Ring Stop",
      distance: "1.4 km",
      walkTime: "16 min walk",
      buses: ["Bus 3 (Arr. 17m)", "Bus 5 (Arr. 22m)"],
      isCurrent: false,
    },
  ];

  const custodyHistory = [
    { time: "07:22 AM", event: "Boarded Bus 3", loc: "Avadi Junction Bay #3", status: "Verified by Conductor QR scan" },
    { time: "07:18 AM", event: "Bus Approaching Stop", loc: "1.2km Geofence Alert", status: "Parent notified" },
    { time: "Yesterday 03:45 PM", event: "Alighted & Guardian Handover", loc: "Avadi Junction", status: "Priya G. Dynamic Pass scanned" },
    { time: "Yesterday 03:30 PM", event: "Rear Safety Sweep Completed", loc: "Veltech School Bay", status: "0 children remaining logged" },
  ];

  // Dynamic Absence Toggle with Invariant 1 enforcement
  const handleToggleAbsence = async () => {
    const nextState = !absent;
    setAbsent(nextState);

    await postJson("/trips/absence", {
      student_id: "stu_01",
      student_name: "Aarav Kumar",
      bus_id: "bus_01",
      is_absent: nextState,
    });

    if (nextState) {
      showToast(
        "Absence Declared",
        "K-12 Invariant 1 active: Bus 3 will still execute <10 km/h curb sweep.",
        "warning"
      );
    } else {
      showToast(
        "Attendance Restored",
        "Aarav marked travelling. Bus 3 driver notified for pickup.",
        "success"
      );
    }
  };

  return (
    <div
      style={{ backgroundColor: "#0C0E14" }}
      className="min-h-screen text-[#ECEEF3] flex flex-col font-sans select-none"
    >
      <PortSwitcherHeader currentPort={3002} />

      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-24">
        {/* Citymapper Top Greeting */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: "#2B5BFF" }}
              className="w-11 h-11 rounded-[14px] flex items-center justify-center font-black text-white text-base shadow-lg shadow-[#2B5BFF]/30"
            >
              PG
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[17px] font-extrabold text-[#ECEEF3]">
                  Good Morning, Priya
                </h1>
                <span>👋</span>
              </div>
              <p className="text-[12px] text-[#98A0AE] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#2B5BFF]" />
                Veltech University · Bus 3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifModal(true)}
              className="relative w-9 h-9 rounded-xl bg-[#15171F] border border-[#282C38] flex items-center justify-center text-[#98A0AE] hover:text-[#ECEEF3] transition active:scale-95"
              title="Recent Custody Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00C281]" />
            </button>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#2B5BFF]/10 text-[#4D7BFF] border border-[#2B5BFF]/30 font-bold">
              :3002
            </span>
          </div>
        </div>

        {/* ================= TAB 1: GET ME (Active Commute) ================= */}
        {activeTab === "getme" && (
          <>
            {/* Citymapper Disruption Banner */}
            <DisruptionBanner
              message="Bus En Route: On Schedule"
              subtext={`Reaching Stop #3 Avadi Junction in ${etaMinutes} mins · 0m lateral deviation`}
              className="mb-3.5 cursor-pointer"
              onClick={() =>
                showToast(
                  "Corridor Status Normal",
                  "Bus 3 tracking smoothly along approved corridor with zero route deviations.",
                  "info"
                )
              }
            />

            {/* Origin → Destination Card */}
            <ODCard
              from="Residence (Stop #3 Avadi Junction)"
              to="Veltech University Campus"
              fromSubtitle="Pickup Corridor · Morning Inbound"
              toSubtitle="Bay #1 Drop Terminal"
              className="mb-3.5"
            />

            {/* Child Profile Card with Absence Switch */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 mb-3.5 shadow-md"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: "#E8453C" }}
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center font-black text-white text-sm shadow-md"
                  >
                    AK
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[15px] text-[#ECEEF3]">
                      Aarav Kumar
                    </h3>
                    <p className="text-[11px] text-[#98A0AE]">
                      Class 5A · Roll #14 · School Bus 3
                    </p>
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      backgroundColor: absent
                        ? "rgba(232,69,60,0.18)"
                        : boarded
                        ? "rgba(0,194,129,0.18)"
                        : "rgba(255,180,0,0.18)",
                      color: absent
                        ? "#E8453C"
                        : boarded
                        ? "#00C281"
                        : "#FFB400",
                      borderColor: absent
                        ? "rgba(232,69,60,0.3)"
                        : boarded
                        ? "rgba(0,194,129,0.3)"
                        : "rgba(255,180,0,0.3)",
                    }}
                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {absent ? "ABSENT" : boarded ? "ONBOARD" : "WAITING AT STOP"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#282C38] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#ECEEF3] block text-[12px]">
                    Not Travelling Today
                  </span>
                  <span className="text-[11px] text-[#98A0AE]">
                    Triggers K-12 slow drive-by visual sweep invariant (&lt;10 km/h)
                  </span>
                </div>
                <button
                  onClick={handleToggleAbsence}
                  className="p-1 transition active:scale-95"
                  title="Toggle absence declaration"
                >
                  {absent ? (
                    <ToggleRight className="w-8 h-8 text-[#E8453C]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[#646C7A]" />
                  )}
                </button>
              </div>
            </div>

            {/* Citymapper Route Option Card */}
            <div className="mb-3.5">
              <RouteCard
                etaMin={etaMinutes}
                arrivalClock="07:40"
                tag={{ text: "Fastest", type: "fastest" }}
                legs={routeLegs}
                best={true}
                onClick={() => setIsGoTripOpen(true)}
              />
            </div>

            {/* Citymapper GO BUTTON (LOCKED GREEN PILL) */}
            <div className="mb-5">
              <GoButton
                onClick={() => setIsGoTripOpen(true)}
                label="GO · LIVE COMMUTE TRACKER"
              />
            </div>

            {/* Live Departures Board */}
            <div className="mb-5">
              <DeparturesBoard
                title="Designated Stop Departures"
                rows={departureRows}
                onSelectRow={(row) => {
                  showToast("Selected Departure", `${row.badge} - Reaching in ${row.minutes} min`, "info");
                  setIsGoTripOpen(true);
                }}
              />
            </div>

            {/* Quick Actions (Guardian QR Pass & Call Conductor) */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                onClick={() => setShowQrModal(true)}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-3.5 rounded-[14px] border text-left hover:border-[#4D7BFF] transition active:scale-95 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className="w-4 h-4 text-[#00C281]" />
                  <span className="text-[12px] font-bold text-[#ECEEF3]">
                    Guardian Pass
                  </span>
                </div>
                <span className="text-[10px] text-[#98A0AE] block">
                  Dynamic Handover QR
                </span>
              </button>

              <button
                onClick={() => setShowCallModal(true)}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-3.5 rounded-[14px] border text-left hover:border-[#4D7BFF] transition active:scale-95 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-[#2B5BFF]" />
                  <span className="text-[12px] font-bold text-[#ECEEF3]">
                    Call Attendant
                  </span>
                </div>
                <span className="text-[10px] text-[#98A0AE] block">
                  Masked encrypted audio
                </span>
              </button>
            </div>
          </>
        )}

        {/* ================= TAB 2: NEARBY (Designated Pickup Corridors) ================= */}
        {activeTab === "nearby" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-[17px] font-extrabold text-[#ECEEF3]">Nearby Corridors</h2>
                <p className="text-[12px] text-[#98A0AE]">Designated safety pickup spots within walking range</p>
              </div>
              <Compass className="w-5 h-5 text-[#2B5BFF]" />
            </div>

            {/* Search Stop Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#646C7A] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search designated neighborhood stops..."
                className="w-full bg-[#15171F] border border-[#282C38] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF]"
                onChange={(e) => {
                  if (e.target.value.length > 2) {
                    showToast("Filtering Stops", `Searching for "${e.target.value}"`, "info");
                  }
                }}
              />
            </div>

            {/* Nearby Corridors List */}
            <div className="space-y-2.5">
              {nearbyCorridors.map((c) => (
                <div
                  key={c.id}
                  style={{ backgroundColor: "#15171F", borderColor: c.isCurrent ? "#2B5BFF" : "#282C38" }}
                  className="rounded-[16px] border p-3.5 transition hover:border-[#4D7BFF]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#ECEEF3]">{c.name}</span>
                        {c.isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C281]/20 text-[#00C281] border border-[#00C281]/30">
                            Assigned Stop
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#98A0AE] mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#FFB400]" />
                        {c.walkTime} ({c.distance})
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPickupStop(c.name);
                        showToast("Pickup Corridor Set", `Selected ${c.name} as primary morning corridor.`, "success");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#1E212B] hover:bg-[#282C38] text-[11px] font-bold text-[#ECEEF3] border border-[#282C38]"
                    >
                      {c.isCurrent ? "Active" : "Switch Stop"}
                    </button>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#282C38]/60 flex items-center gap-2 overflow-x-auto">
                    {c.buses.map((b, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0C0E14] text-[#ECEEF3] border border-[#282C38]">
                        🚌 {b}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => {
                showToast("Walking Navigation", "Showing pedestrian corridor to Avadi Junction Bay #3.", "info");
                setIsGoTripOpen(true);
              }}
              style={{ backgroundColor: "#2B5BFF" }}
              className="w-full py-3 rounded-full text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#2B5BFF]/30 active:scale-95 transition"
            >
              <Navigation className="w-4 h-4" />
              <span>WALK TO DESIGNATED CORRIDOR (2 MIN)</span>
            </button>
          </div>
        )}

        {/* ================= TAB 3: SAVED (Daily Route Templates) ================= */}
        {activeTab === "saved" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-[17px] font-extrabold text-[#ECEEF3]">Saved Daily Routes</h2>
                <p className="text-[12px] text-[#98A0AE]">One-tap commuter templates for Aarav</p>
              </div>
              <Heart className="w-5 h-5 text-[#E8453C]" />
            </div>

            {/* Route Template 1 */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[#ECEEF3] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C281]" />
                  Morning School Inbound
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00C281]/20 text-[#00C281]">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#98A0AE] mb-3">
                Home → Stop #3 Avadi Junction → Veltech School Gate (Bay #1)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGoTripOpen(true)}
                  style={{ backgroundColor: "#00C281", color: "#003322" }}
                  className="flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Start Morning Tracker</span>
                </button>
              </div>
            </div>

            {/* Route Template 2 */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[#ECEEF3] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2B5BFF]" />
                  Afternoon School Return
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#2B5BFF]/20 text-[#4D7BFF]">
                  03:30 PM
                </span>
              </div>
              <p className="text-[11px] text-[#98A0AE] mb-3">
                Veltech School Gate (Bay #2) → Avadi Junction Bay #3 → Home
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast("Schedule Reminder Set", "Notification will trigger at 03:15 PM when Bus 3 starts afternoon route.", "info");
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#1E212B] hover:bg-[#282C38] text-[#ECEEF3] border border-[#282C38] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Clock className="w-3.5 h-3.5 text-[#FFB400]" />
                  <span>Set Return Departure Alert</span>
                </button>
              </div>
            </div>

            {/* Add Custom Route Alert */}
            <button
              onClick={() => {
                showToast("New Route Added", "Exam Special Corridor added to saved schedule.", "success");
              }}
              className="w-full py-3 rounded-[16px] border border-dashed border-[#282C38] hover:border-[#4D7BFF] text-xs font-bold text-[#98A0AE] hover:text-[#ECEEF3] flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-[#4D7BFF]" />
              <span>+ Add Custom Exam / Extra Class Corridor</span>
            </button>
          </div>
        )}

        {/* ================= TAB 4: YOU (Guardian Profile & Safety Custody) ================= */}
        {activeTab === "you" && (
          <div className="space-y-3.5">
            {/* Guardian Profile Card */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[20px] border p-4 text-center shadow-lg"
            >
              <div
                style={{ backgroundColor: "#2B5BFF" }}
                className="w-16 h-16 rounded-[18px] flex items-center justify-center font-black text-white text-xl mx-auto mb-2 shadow-lg shadow-[#2B5BFF]/30"
              >
                PG
              </div>
              <h3 className="font-extrabold text-[16px] text-[#ECEEF3]">Priya G.</h3>
              <p className="text-[11px] text-[#98A0AE]">Registered Parent / Primary Guardian</p>
              <p className="text-[11px] font-mono text-[#4D7BFF] mt-0.5">+91 98401 11221 · Verified OTP</p>

              <div className="mt-3.5 pt-3 border-t border-[#282C38] grid grid-cols-2 gap-2 text-left text-xs">
                <div className="bg-[#1E212B] p-2.5 rounded-xl border border-[#282C38]">
                  <span className="text-[10px] text-[#98A0AE] block">Child Enrolled</span>
                  <span className="font-bold text-[#ECEEF3]">Aarav Kumar (Class 5A)</span>
                </div>
                <div className="bg-[#1E212B] p-2.5 rounded-xl border border-[#282C38]">
                  <span className="text-[10px] text-[#98A0AE] block">Bus Assigned</span>
                  <span className="font-bold text-[#00C281]">School Bus 3 (TN 10 AB 1234)</span>
                </div>
              </div>
            </div>

            {/* Custody Audit Trail */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4"
            >
              <h4 className="font-extrabold text-xs text-[#ECEEF3] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00C281]" />
                Unbroken Custody Timeline
              </h4>
              <div className="space-y-2.5 text-xs">
                {custodyHistory.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 pb-2 border-b border-[#282C38]/50 last:border-0 last:pb-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2B5BFF] mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#ECEEF3]">{item.event}</span>
                        <span className="text-[10px] font-mono text-[#98A0AE]">{item.time}</span>
                      </div>
                      <span className="text-[11px] text-[#98A0AE] block">{item.loc}</span>
                      <span className="text-[10px] text-[#00C281] font-semibold">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings & Toggles */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#ECEEF3] block">Real-time Push Alerts</span>
                  <span className="text-[11px] text-[#98A0AE]">Instant notification on bus approaching stop</span>
                </div>
                <button
                  onClick={() => {
                    const next = !pushNotifsEnabled;
                    setPushNotifsEnabled(next);
                    showToast(next ? "Push Enabled" : "Push Disabled", next ? "Geofence boarding alerts active." : "Alerts paused.", "info");
                  }}
                  className="p-1"
                >
                  {pushNotifsEnabled ? (
                    <ToggleRight className="w-7 h-7 text-[#00C281]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-[#646C7A]" />
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-[#282C38] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#ECEEF3] block">SMS Emergency Fallback</span>
                  <span className="text-[11px] text-[#98A0AE]">Offline custody SMS in case of low cellular data</span>
                </div>
                <button
                  onClick={() => {
                    const next = !smsFallbacksEnabled;
                    setSmsFallbacksEnabled(next);
                    showToast(next ? "SMS Backup Active" : "SMS Paused", "Carrier fallback updated.", "info");
                  }}
                  className="p-1"
                >
                  {smsFallbacksEnabled ? (
                    <ToggleRight className="w-7 h-7 text-[#00C281]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-[#646C7A]" />
                  )}
                </button>
              </div>
            </div>

            {/* Emergency Hotline Button */}
            <button
              onClick={() => {
                showToast("Calling School Transport Desk", "Routing to Central Dispatcher: +91 98401 23456", "warning");
              }}
              style={{ backgroundColor: "#E8453C" }}
              className="w-full py-3 rounded-full text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#E8453C]/30 active:scale-95 transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>EMERGENCY DISPATCH HOTLINE</span>
            </button>
          </div>
        )}
      </main>

      {/* Citymapper Bottom Tab Bar */}
      <CMTabBar activeTab={activeTab} onTabChange={(id) => setActiveTab(id)} />

      {/* Full-Screen GO Trip Mode Takeover */}
      <GoTripModal
        isOpen={isGoTripOpen}
        onClose={() => setIsGoTripOpen(false)}
        destinationName="Veltech University Campus"
        totalEtaMin={etaMinutes}
        steps={tripSteps}
        currentStepIndex={1}
      />

      {/* Guardian Pass Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-6 max-w-xs w-full text-center shadow-2xl relative"
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3] text-sm"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3] mb-1">
              Dynamic Guardian Pass
            </h3>
            <p className="text-[11px] text-[#98A0AE] mb-4">
              Aarav Kumar (Class 5A) · Conductor handover token
            </p>
            <div className="p-4 bg-white rounded-[16px] mx-auto w-44 h-44 flex flex-col items-center justify-center">
              <QrCode className="w-28 h-28 text-[#0C0E14]" />
              <span className="text-[10px] font-mono font-black text-[#0C0E14] mt-2">
                TOTP: 849-291
              </span>
            </div>
            <div className="mt-4 text-[11px] font-mono text-[#00C281]">
              Rotates in {totpCountdown}s
            </div>
            <button
              onClick={() => {
                showToast("Token Verified", "Guardian pass validated by Conductor Murugan S.", "success");
                setShowQrModal(false);
              }}
              style={{ backgroundColor: "#00C281", color: "#003322" }}
              className="mt-5 w-full py-2.5 rounded-full font-black text-xs transition active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Masked Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-6 max-w-xs w-full text-center shadow-2xl relative"
          >
            <button
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3] text-sm"
            >
              ✕
            </button>
            <div
              style={{ backgroundColor: "rgba(43,91,255,0.18)" }}
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            >
              <Phone className="w-6 h-6 text-[#4D7BFF]" />
            </div>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3]">
              Call Conductor
            </h3>
            <p className="text-[11px] text-[#98A0AE] mt-1 mb-4">
              Private masked relay to School Bus 3 Attendant Murugan S. Driver phone numbers masked per privacy invariant.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-2.5 rounded-full bg-[#1E212B] text-[#ECEEF3] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast("Audio Connected", "Encrypted audio relay active to Conductor Murugan S.", "info");
                  setShowCallModal(false);
                }}
                style={{ backgroundColor: "#2B5BFF" }}
                className="flex-1 py-2.5 rounded-full text-white font-bold text-xs active:scale-95 transition"
              >
                Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-5 max-w-xs w-full shadow-2xl relative"
          >
            <button
              onClick={() => setShowNotifModal(false)}
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3] text-sm"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[15px] text-[#ECEEF3] mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00C281]" />
              Custody Push Notifications
            </h3>
            <div className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
              <div className="p-2.5 bg-[#1E212B] rounded-xl border border-[#282C38]">
                <div className="flex items-center justify-between font-bold text-[#ECEEF3]">
                  <span>Bus Entering Geofence</span>
                  <span className="text-[10px] text-[#98A0AE]">07:18 AM</span>
                </div>
                <p className="text-[11px] text-[#98A0AE] mt-0.5">Bus 3 is 1.2km away from Avadi Junction.</p>
              </div>
              <div className="p-2.5 bg-[#1E212B] rounded-xl border border-[#282C38]">
                <div className="flex items-center justify-between font-bold text-[#00C281]">
                  <span>On Schedule Confirmation</span>
                  <span className="text-[10px] text-[#98A0AE]">07:05 AM</span>
                </div>
                <p className="text-[11px] text-[#98A0AE] mt-0.5">Route A morning inbound commenced on time.</p>
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
