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
import { useToast } from "./citymapper/Toast";
import {
  GraduationCap,
  Bus,
  MapPin,
  Clock,
  Users,
  QrCode,
  Search,
  Shield,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Compass,
  Navigation,
} from "lucide-react";

export function CollegeCampusPassApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"shuttle" | "pass">("shuttle");
  const [cmNavTab, setCmNavTab] = useState("getme");
  const [isGoTripOpen, setIsGoTripOpen] = useState(false);
  const [absenceDeclared, setAbsenceDeclared] = useState(false);
  const [proximityCheckedIn, setProximityCheckedIn] = useState(false);
  const [passTimer, setPassTimer] = useState(24);
  const [selectedRoute, setSelectedRoute] = useState("NC-1");

  useEffect(() => {
    const timer = setInterval(() => {
      setPassTimer((t) => (t > 1 ? t - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const routeLegs: LegItem[] = [
    { mode: "walk", label: "Walk", durationMin: 3 },
    { mode: "tube", label: "NC-1", durationMin: 12 },
    { mode: "walk", label: "Eng Block", durationMin: 2 },
  ];

  const tripSteps: TripStep[] = [
    {
      id: "cp1",
      instruction: "Walk to Hostel Stop #2",
      subtext: "200 meters · Departure platform",
      mode: "walk",
      status: "completed",
      durationMin: 3,
    },
    {
      id: "cp2",
      instruction: "Board North Campus Shuttle NC-1",
      subtext: "High-frequency express corridor",
      mode: "tube",
      lineBadge: "NC-1",
      status: "current",
      durationMin: 12,
      stopsRemaining: 2,
    },
    {
      id: "cp3",
      instruction: "Alight at Engineering Tech Block",
      subtext: "GPS proximity check-in (<25m) auto-logged",
      mode: "walk",
      status: "upcoming",
      durationMin: 2,
    },
  ];

  const departureRows: DepartureRow[] = [
    {
      badge: "NC-1",
      mode: "tube",
      destination: "Engineering Block via Central Library",
      minutes: 2,
      subtext: "Express Corridor · 8 seats remaining",
    },
    {
      badge: "SC-2",
      mode: "bus",
      destination: "South Quad & Research Park",
      minutes: 7,
      subtext: "Regular Shuttle",
    },
    {
      badge: "EC-4",
      mode: "rail",
      destination: "Hostels Connector Loop",
      minutes: 14,
      subtext: "Inter-Campus Connector",
    },
  ];

  return (
    <div
      style={{ backgroundColor: "#0C0E14" }}
      className="min-h-screen text-[#ECEEF3] flex flex-col font-sans select-none"
    >
      <PortSwitcherHeader currentPort={3003} />

      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-24">
        {/* Citymapper Top Brand Header */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: "#2B5BFF" }}
              className="w-11 h-11 rounded-[14px] flex items-center justify-center font-black text-white shadow-lg shadow-[#2B5BFF]/30"
            >
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-extrabold text-[#ECEEF3]">
                  CampusPass
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2B5BFF]/20 text-[#4D7BFF] border border-[#2B5BFF]/30">
                  Higher-Ed
                </span>
              </div>
              <p className="text-[12px] text-[#98A0AE]">
                Citymapper Transit Spec · Tech Campus
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#2B5BFF]/10 text-[#4D7BFF] border border-[#2B5BFF]/30 font-bold">
            :3003
          </span>
        </div>

        {/* Top Segmented Control [Live Shuttle | My Pass] */}
        <div
          style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
          className="grid grid-cols-2 gap-1.5 p-1 rounded-[16px] border mb-3.5"
        >
          <button
            onClick={() => setActiveTab("shuttle")}
            style={{
              backgroundColor: activeTab === "shuttle" ? "#2B5BFF" : "transparent",
              color: activeTab === "shuttle" ? "#FFFFFF" : "#98A0AE",
            }}
            className="py-2 rounded-[12px] font-extrabold text-[12px] flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Bus className="w-4 h-4" />
            <span>Live Shuttle</span>
          </button>
          <button
            onClick={() => setActiveTab("pass")}
            style={{
              backgroundColor: activeTab === "pass" ? "#2B5BFF" : "transparent",
              color: activeTab === "pass" ? "#FFFFFF" : "#98A0AE",
            }}
            className="py-2 rounded-[12px] font-extrabold text-[12px] flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>My Pass</span>
          </button>
        </div>

        {activeTab === "shuttle" ? (
          <>
            {/* Disruption Alert Banner */}
            <DisruptionBanner
              message="North Express Corridor: High Demand"
              subtext="NC-1 operating with 8 remaining seats · Next arrival in 2 min"
              className="mb-3.5"
            />

            {/* Origin → Destination Card */}
            <ODCard
              from="Hostel Stop #2 (North Quad)"
              to="Engineering Tech Block"
              fromSubtitle="Departure Bay #1"
              toSubtitle="Main Academic Concourse"
              className="mb-3.5"
            />

            {/* Shuttle Route Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 text-xs">
              {[
                { id: "NC-1", name: "North Campus Shuttle", eta: "2m" },
                { id: "SC-2", name: "South Quad Express", eta: "7m" },
                { id: "EC-4", name: "Hostels Loop", eta: "14m" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoute(r.id)}
                  style={{
                    backgroundColor: selectedRoute === r.id ? "rgba(43,91,255,0.2)" : "#15171F",
                    borderColor: selectedRoute === r.id ? "#2B5BFF" : "#282C38",
                    color: selectedRoute === r.id ? "#4D7BFF" : "#98A0AE",
                  }}
                  className="px-3 py-1.5 rounded-[12px] border font-bold whitespace-nowrap transition"
                >
                  {r.id}: {r.eta}
                </button>
              ))}
            </div>

            {/* Seat Availability Card */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 mb-3.5"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#ECEEF3] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#2B5BFF]" />
                  Seat Availability (NC-1)
                </span>
                <span className="font-mono font-extrabold text-[#4D7BFF]">
                  32 / 40 seats filled
                </span>
              </div>

              {/* Occupancy bar */}
              <div className="relative h-2.5 w-full bg-[#1E212B] rounded-full overflow-hidden mb-2">
                <div
                  style={{
                    width: "80%",
                    background: "linear-gradient(90deg, #00B894 0%, #00C281 60%, #FFB400 100%)",
                  }}
                  className="h-full rounded-full"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#98A0AE]">
                <span className="text-[#00C281] font-bold">8 seats available</span>
                <span>80% Occupancy</span>
              </div>
            </div>

            {/* Route Option Card with Leg Strip */}
            <div className="mb-3.5">
              <RouteCard
                etaMin={17}
                arrivalClock="08:15"
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
                label="GO · LIVE SHUTTLE TRIP"
              />
            </div>

            {/* Departures Board */}
            <div className="mb-5">
              <DeparturesBoard
                title="Live Campus Departures"
                rows={departureRows}
                onSelectRow={() => setIsGoTripOpen(true)}
              />
            </div>

            {/* Demand Adaptation: Absence Declaration Toggle */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-3.5 mb-5 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-[#ECEEF3] text-xs block">
                  Not Travelling Today
                </span>
                <span className="text-[11px] text-[#98A0AE]">
                  Dynamically eliminates empty campus stop detours
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !absenceDeclared;
                  setAbsenceDeclared(next);
                  showToast(
                    next ? "Absence Declared" : "Attendance Restored",
                    next
                      ? "Stop bypass enabled for NC-1. Manifest rebalanced."
                      : "Seat reserved. Driver notified of your pickup.",
                    next ? "warning" : "success"
                  );
                }}
                className="p-1 transition"
                title="Toggle absence"
              >
                {absenceDeclared ? (
                  <ToggleRight className="w-8 h-8 text-[#E8453C]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[#646C7A]" />
                )}
              </button>
            </div>
          </>
        ) : (
          /* My Pass View - Dynamic Digital Campus Bus Pass */
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="rounded-[20px] border p-6 text-center shadow-2xl"
          >
            <div
              style={{ backgroundColor: "#2B5BFF" }}
              className="w-16 h-16 rounded-[16px] flex items-center justify-center font-black text-white text-xl mx-auto mb-3 shadow-lg shadow-[#2B5BFF]/30"
            >
              AV
            </div>

            <h2 className="text-[20px] font-extrabold text-[#ECEEF3]">
              Aditya Verma
            </h2>
            <p className="text-[12px] text-[#4D7BFF] font-semibold">
              B.Tech Computer Science · Roll #22BCE1048
            </p>
            <p className="text-[11px] text-[#98A0AE] mt-0.5">
              Academic Session 2026 · Term 6
            </p>

            {/* Dynamic QR */}
            <div className="my-6 p-5 bg-white rounded-[20px] max-w-[210px] mx-auto shadow-2xl flex flex-col items-center">
              <QrCode className="w-32 h-32 text-[#0C0E14]" />
              <span className="mt-2 font-mono font-black text-[#0C0E14] text-[11px]">
                PASS-2026-9812-NC
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-[#00C281] mb-5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Rotates in {passTimer}s</span>
            </div>

            {/* Zero-Hardware Proximity Check-in Card */}
            <div
              style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 text-left mb-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#ECEEF3] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#00C281]" />
                  GPS Proximity Check-in
                </span>
                <span
                  style={{
                    backgroundColor: proximityCheckedIn ? "rgba(0,194,129,0.18)" : "rgba(255,180,0,0.18)",
                    color: proximityCheckedIn ? "#00C281" : "#FFB400",
                  }}
                  className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                >
                  {proximityCheckedIn ? "VERIFIED (<25M)" : "STANDBY"}
                </span>
              </div>
              <p className="text-[11px] text-[#98A0AE] leading-relaxed mb-3">
                Zero-hardware proximity radar automatically logs boarding when within 25m of shuttle door.
              </p>
              <button
                onClick={() => {
                  const next = !proximityCheckedIn;
                  setProximityCheckedIn(next);
                  showToast(
                    next ? "Proximity Boarding Verified" : "Boarding Reset",
                    next
                      ? "GPS match confirmed (<25m from NC-1). Custody logged."
                      : "Proximity check-in reset to standby.",
                    next ? "success" : "info"
                  );
                }}
                style={{
                  backgroundColor: proximityCheckedIn ? "#15171F" : "#2B5BFF",
                  color: proximityCheckedIn ? "#00C281" : "#FFFFFF",
                  borderColor: proximityCheckedIn ? "#00C281" : "transparent",
                }}
                className="w-full py-2.5 rounded-full font-black text-xs border transition"
              >
                {proximityCheckedIn ? "✓ Boarding Confirmed" : "Trigger Proximity Verification"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Citymapper Bottom Tab Bar */}
      <CMTabBar activeTab={cmNavTab} onTabChange={(id) => setCmNavTab(id)} />

      {/* GO Trip Mode Takeover */}
      <GoTripModal
        isOpen={isGoTripOpen}
        onClose={() => setIsGoTripOpen(false)}
        destinationName="Engineering Tech Block"
        totalEtaMin={17}
        steps={tripSteps}
        currentStepIndex={1}
      />
    </div>
  );
}
