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
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Bus,
  QrCode,
  Phone,
  RefreshCw,
  AlertTriangle,
  Navigation,
  Compass,
  Bookmark,
  User,
  ToggleLeft,
  ToggleRight,
  Bell,
  Heart,
  ChevronRight,
  Shield,
  Star,
  Settings,
} from "lucide-react";
import { useToast } from "./citymapper/Toast";

export function ParentsJourneyApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("getme");
  const [isGoTripOpen, setIsGoTripOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [isAbsent, setIsAbsent] = useState(false);
  const [qrToken, setQrToken] = useState("GDN-9482-EDUT");
  const [qrTimer, setQrTimer] = useState(28);

  useEffect(() => {
    const timer = setInterval(() => {
      setQrTimer((prev) => {
        if (prev <= 1) {
          setQrToken(`GDN-${Math.floor(1000 + Math.random() * 9000)}-EDUT`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const routeLegs: LegItem[] = [
    { mode: "walk", label: "Walk", durationMin: 4 },
    { mode: "bus", label: "Bus 3", durationMin: 18 },
    { mode: "walk", label: "Campus Walk", durationMin: 2 },
  ];

  const tripSteps: TripStep[] = [
    {
      id: "s1",
      instruction: "Walk to Stop #3 Maple St",
      subtext: "Depart home at 07:11 AM · 280m walk",
      mode: "walk",
      status: "completed",
      durationMin: 4,
    },
    {
      id: "s2",
      instruction: "Board School Bus 3",
      subtext: "Conductor scan required · TN 10 AB 1234",
      mode: "bus",
      lineBadge: "BUS 3",
      status: "current",
      durationMin: 18,
      stopsRemaining: 3,
    },
    {
      id: "s3",
      instruction: "Alight at Veltech Main Gate",
      subtext: "Rear safety sweep interlock verified",
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
      subtext: "Driver Rajesh K. · Plate TN 10 AB 1234",
    },
    {
      badge: "BUS 7",
      mode: "bus",
      destination: "Veltech University via Pattabiram",
      minutes: 14,
      subtext: "Driver Ananya S.",
    },
    {
      badge: "BUS 3",
      mode: "bus",
      destination: "Afternoon Return to Maple St (Bay #2)",
      minutes: 420,
      subtext: "Scheduled departure 03:30 PM",
    },
  ];

  const toggleAbsence = () => {
    const next = !isAbsent;
    setIsAbsent(next);
    showToast(
      next ? "Absence Declared" : "Resumed Travel",
      next
        ? "Driver manifest dynamically rebalanced. Stop demand updated."
        : "Absence cancelled. Welcome back to Route A manifest!",
      next ? "warning" : "success"
    );
  };

  return (
    <div
      style={{ backgroundColor: "#0C0E14" }}
      className="min-h-screen text-[#ECEEF3] flex flex-col font-sans select-none"
    >
      <PortSwitcherHeader currentPort={3001} />

      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-24">
        {/* ================= TAB 1: GET ME (Active Commute) ================= */}
        {activeTab === "getme" && (
          <>
            {/* Citymapper Disruption Alert Banner */}
            <DisruptionBanner
              message="Route A Corridor: Traffic normal"
              subtext="±75m lateral buffer valid · Bus 3 on schedule (arr. 07:40 AM)"
              className="mb-3.5 cursor-pointer"
              onClick={() => showToast("Corridor Status", "North Corridor operating normally with ±75m lateral buffer adherence.", "info")}
            />

            {/* Origin → Destination Card (Transit-map stop pair) */}
            <ODCard
              from="Residence (Stop #3 Maple St)"
              to="Veltech Main Gate"
              fromSubtitle="Pickup Stop #3 · Morning Inbound"
              toSubtitle="Bay #2 School Drop Terminal"
              className="mb-3.5"
            />

            {/* Student Custody Profile Mini Card with Functional Absence Switch */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-3.5 mb-3.5 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: "#2B5BFF" }}
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center font-black text-white text-sm shadow-md"
                  >
                    AK
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[14px] text-[#ECEEF3]">
                        Aarav Kumar
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2B5BFF]/20 text-[#4D7BFF] border border-[#2B5BFF]/30">
                        Class 5A
                      </span>
                    </div>
                    <span className="text-[11px] text-[#98A0AE] block">
                      Veltech University · Route A
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    style={{
                      backgroundColor: isAbsent ? "rgba(232,69,60,0.18)" : "rgba(0,194,129,0.18)",
                      color: isAbsent ? "#E8453C" : "#00C281",
                      borderColor: isAbsent ? "rgba(232,69,60,0.3)" : "rgba(0,194,129,0.3)",
                    }}
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  >
                    {isAbsent ? "ABSENT" : "ONBOARD BUS 3"}
                  </span>
                </div>
              </div>

              {/* Functional Absence Declaration Button */}
              <div className="pt-2 border-t border-[#282C38] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block text-[11px]">
                    Not Travelling Today
                  </span>
                  <span className="text-[10px] text-[#98A0AE]">
                    Eliminates morning detour & updates driver manifest
                  </span>
                </div>
                <button
                  onClick={toggleAbsence}
                  className="p-1 transition"
                  title="Toggle absence"
                >
                  {isAbsent ? (
                    <ToggleRight className="w-8 h-8 text-[#E8453C]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-[#646C7A]" />
                  )}
                </button>
              </div>
            </div>

            {/* Citymapper Best Route Option Card with Leg Strip */}
            <div className="mb-3.5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black uppercase tracking-[0.4px] text-[#98A0AE]">
                  Recommended Journey
                </span>
                <span className="text-[11px] font-bold text-[#00C281]">
                  Live GPS Sync
                </span>
              </div>

              <RouteCard
                etaMin={24}
                arrivalClock="07:40"
                tag={{ text: "Fastest", type: "fastest" }}
                legs={routeLegs}
                best={true}
                onClick={() => setIsGoTripOpen(true)}
              />
            </div>

            {/* Citymapper SHAPE- AND COLOR-LOCKED GO BUTTON */}
            <div className="mb-5">
              <GoButton
                onClick={() => setIsGoTripOpen(true)}
                label="GO · LIVE TRIP MODE"
              />
            </div>

            {/* Live Departures Board */}
            <div className="mb-5">
              <DeparturesBoard
                title="School Bus Departures"
                rows={departureRows}
                onSelectRow={() => setIsGoTripOpen(true)}
              />
            </div>

            {/* Action Controls: Dynamic Guardian Pass & Masked Call */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                onClick={() => setQrModalOpen(true)}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-3 rounded-[14px] border text-left hover:border-[#4D7BFF] transition active:scale-98"
              >
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className="w-4 h-4 text-[#00C281]" />
                  <span className="text-[12px] font-bold text-[#ECEEF3]">
                    Guardian Pass
                  </span>
                </div>
                <span className="text-[10px] text-[#98A0AE] block">
                  Dynamic QR for pickup
                </span>
              </button>

              <button
                onClick={() => setCallModalOpen(true)}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-3 rounded-[14px] border text-left hover:border-[#4D7BFF] transition active:scale-98"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-[#2B5BFF]" />
                  <span className="text-[12px] font-bold text-[#ECEEF3]">
                    Call Conductor
                  </span>
                </div>
                <span className="text-[10px] text-[#98A0AE] block">
                  Masked encrypted audio
                </span>
              </button>
            </div>

            {/* Journey Assurance Statutory Note */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[14px] border p-3 flex items-start gap-2.5 text-[11px] text-[#98A0AE]"
            >
              <ShieldCheck className="w-4 h-4 text-[#00C281] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-[#ECEEF3]">Journey Assurance:</strong> Key custody milestones are verified via zero hardware time-expiring QR passes. This is journey assurance, not continuous surveillance.
              </p>
            </div>
          </>
        )}

        {/* ================= TAB 2: NEARBY ================= */}
        {activeTab === "nearby" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">Nearby Boarding Stops</h2>
              <span className="text-xs text-[#00C281] font-bold">● GPS High Accuracy</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: "Stop #3 Maple St (Primary)", dist: "280m", buses: ["Bus 3", "Bus 7"], eta: "2 min" },
                { name: "Avadi Railway Concourse", dist: "850m", buses: ["Bus 12"], eta: "8 min" },
                { name: "Pattabiram Outer Bypass", dist: "1.4 km", buses: ["Bus 3", "Bus 15"], eta: "14 min" },
              ].map((stop, i) => (
                <div
                  key={i}
                  onClick={() => showToast("Stop Selected", `Viewing live bus arrivals for ${stop.name}.`, "info")}
                  style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                  className="p-3.5 rounded-[14px] border flex items-center justify-between cursor-pointer hover:border-[#2B5BFF] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2B5BFF]/15 text-[#4D7BFF] flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs text-white block">{stop.name}</strong>
                      <span className="text-[11px] text-[#98A0AE]">{stop.dist} away · {stop.buses.join(", ")}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00C281] font-mono">{stop.eta}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => showToast("Stops Refreshed", "Scanned 1,200m radius for active school stops.", "success")}
              className="w-full py-2.5 rounded-xl bg-[#1E212B] text-xs font-bold text-white border border-[#282C38] hover:bg-[#282C38] transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Nearby Radius (1,200m)
            </button>
          </div>
        )}

        {/* ================= TAB 3: SAVED ================= */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">Saved Commute Corridors</h2>
              <span className="text-xs text-[#2B5BFF] font-bold">2 Bookmarks</span>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => {
                  setActiveTab("getme");
                  showToast("Route Loaded", "Loaded Morning Inbound: Residence ➔ Veltech Main Gate.", "info");
                }}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-4 rounded-[16px] border cursor-pointer hover:border-[#00C281] transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00C281] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Morning Commute (Route A)
                  </span>
                  <span className="text-[10px] font-mono text-[#98A0AE]">07:18 AM Daily</span>
                </div>
                <p className="text-xs font-extrabold text-white">Residence (Maple St) ➔ Veltech Main Gate</p>
                <p className="text-[11px] text-[#98A0AE]">Assigned Vehicle: Bus 3 · Driver Rajesh K.</p>
              </div>

              <div
                onClick={() => {
                  setActiveTab("getme");
                  showToast("Route Loaded", "Loaded Afternoon Return: Veltech Bay #2 ➔ Residence.", "info");
                }}
                style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                className="p-4 rounded-[16px] border cursor-pointer hover:border-[#2B5BFF] transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2B5BFF] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Afternoon Return
                  </span>
                  <span className="text-[10px] font-mono text-[#98A0AE]">03:30 PM Daily</span>
                </div>
                <p className="text-xs font-extrabold text-white">Veltech Bay #2 ➔ Residence (Maple St)</p>
                <p className="text-[11px] text-[#98A0AE]">Assigned Vehicle: Bus 3 · Guardian QR pass required</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: YOU (Profile & Settings) ================= */}
        {activeTab === "you" && (
          <div className="space-y-4">
            <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="p-5 rounded-[18px] border text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#2B5BFF] text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-[#2B5BFF]/30">
                PK
              </div>
              <h2 className="text-base font-extrabold text-white">Priya Kumar</h2>
              <p className="text-xs text-[#4D7BFF] font-semibold">Registered Guardian · +91 98401 11221</p>
              <p className="text-[11px] text-[#98A0AE]">Enrolled Student: Aarav Kumar (Class 5A)</p>
            </div>

            <div style={{ backgroundColor: "#15171F", borderColor: "#282C38" }} className="rounded-[16px] border divide-y divide-[#282C38] text-xs">
              <div
                onClick={() => setQrModalOpen(true)}
                className="p-3.5 flex items-center justify-between hover:bg-[#1E212B] cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-[#00C281]" />
                  <span className="font-bold text-white">Guardian Handover QR Token</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#98A0AE]" />
              </div>

              <div
                onClick={() => showToast("SMS Preferences", "Immediate push alerts enabled for all boarding events.", "success")}
                className="p-3.5 flex items-center justify-between hover:bg-[#1E212B] cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-[#2B5BFF]" />
                  <span className="font-bold text-white">Push & SMS Alerts</span>
                </div>
                <span className="text-[11px] text-[#00C281] font-bold">Enabled</span>
              </div>

              <div
                onClick={() => showToast("Emergency Contact", "Primary: +91 98401 11221 · Secondary: +91 98401 11299.", "info")}
                className="p-3.5 flex items-center justify-between hover:bg-[#1E212B] cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[#E8453C]" />
                  <span className="font-bold text-white">Emergency Contacts</span>
                </div>
                <span className="text-[11px] text-[#98A0AE]">2 Contacts</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Citymapper Bottom Tab Bar */}
      <CMTabBar
        activeTab={activeTab}
        onTabChange={(id) => {
          setActiveTab(id);
          showToast(id.toUpperCase(), `Navigated to ${id} tab.`, "info");
        }}
      />

      {/* Citymapper Full-Screen GO Trip Mode Takeover */}
      <GoTripModal
        isOpen={isGoTripOpen}
        onClose={() => setIsGoTripOpen(false)}
        destinationName="Veltech University Main Gate"
        totalEtaMin={8}
        steps={tripSteps}
        currentStepIndex={1}
      />

      {/* Guardian QR Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-6 max-w-xs w-full text-center shadow-2xl relative"
          >
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]"
            >
              ✕
            </button>
            <h3 className="font-extrabold text-[16px] text-[#ECEEF3] mb-1">
              Guardian Handover Pass
            </h3>
            <p className="text-[11px] text-[#98A0AE] mb-4">
              Present to Bus 3 conductor at afternoon pickup.
            </p>
            <div className="p-4 bg-white rounded-[16px] mx-auto w-44 h-44 flex flex-col items-center justify-center shadow-inner">
              <QrCode className="w-28 h-28 text-[#0C0E14]" />
              <span className="text-[10px] font-mono font-black text-[#0C0E14] mt-2">
                {qrToken}
              </span>
            </div>
            <div className="mt-4 text-[11px] font-mono text-[#00C281] flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Rotates in {qrTimer}s</span>
            </div>
            <button
              onClick={() => setQrModalOpen(false)}
              style={{ backgroundColor: "#00C281", color: "#003322" }}
              className="mt-5 w-full py-2.5 rounded-full font-black text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Masked Call Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[20px] p-6 max-w-xs w-full text-center shadow-2xl relative"
          >
            <button
              onClick={() => setCallModalOpen(false)}
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]"
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
              Masked Voice Channel
            </h3>
            <p className="text-[11px] text-[#98A0AE] mt-1 mb-4">
              Connecting via EduTransit privacy proxy to Conductor Murugan S. (School Bus 3).
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCallModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-[#1E212B] text-[#ECEEF3] font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast(
                    "Voice Stream Connected",
                    "Encrypted audio relay active to Conductor Murugan S.",
                    "info"
                  );
                  setCallModalOpen(false);
                }}
                style={{ backgroundColor: "#2B5BFF" }}
                className="flex-1 py-2.5 rounded-full text-white font-bold text-xs shadow-md shadow-[#2B5BFF]/30"
              >
                Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
