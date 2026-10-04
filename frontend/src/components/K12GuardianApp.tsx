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
} from "lucide-react";
import { useToast } from "./citymapper/Toast";

export function K12GuardianApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("getme");
  const [boarded, setBoarded] = useState(false);
  const [absent, setAbsent] = useState(false);
  const [isGoTripOpen, setIsGoTripOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(8);
  const [totpCountdown, setTotpCountdown] = useState(25);

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
      subtext: "150 meters · Pickup corridor",
      mode: "walk",
      status: "completed",
      durationMin: 2,
    },
    {
      id: "k2",
      instruction: "Board School Bus 3 (TN 10 AB 1234)",
      subtext: "Conductor scan required · Driver Rajesh K.",
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
  ];

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
            <button className="relative w-9 h-9 rounded-xl bg-[#15171F] border border-[#282C38] flex items-center justify-center text-[#98A0AE] hover:text-[#ECEEF3]">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00C281]" />
            </button>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#2B5BFF]/10 text-[#4D7BFF] border border-[#2B5BFF]/30 font-bold">
              :3002
            </span>
          </div>
        </div>

        {/* Citymapper Disruption Banner */}
        <DisruptionBanner
          message="Bus En Route: On Schedule"
          subtext={`Reaching Stop #3 Avadi Junction in ${etaMinutes} mins · 0m lateral deviation`}
          className="mb-3.5"
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
                Triggers K-12 slow drive-by visual sweep invariant
              </span>
            </div>
            <button
              onClick={() => setAbsent(!absent)}
              className="p-1 transition"
              title="Toggle absence"
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
            onSelectRow={() => setIsGoTripOpen(true)}
          />
        </div>

        {/* Quick Actions (Guardian QR Pass & Call Conductor) */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <button
            onClick={() => setShowQrModal(true)}
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="p-3 rounded-[14px] border text-left hover:border-[#4D7BFF] transition"
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
            className="p-3 rounded-[14px] border text-left hover:border-[#4D7BFF] transition"
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
              className="absolute top-4 right-4 text-[#98A0AE] hover:text-[#ECEEF3]"
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
              onClick={() => setShowQrModal(false)}
              style={{ backgroundColor: "#00C281", color: "#003322" }}
              className="mt-5 w-full py-2.5 rounded-full font-black text-xs transition"
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
              Call Conductor
            </h3>
            <p className="text-[11px] text-[#98A0AE] mt-1 mb-4">
              Private relay to School Bus 3 Attendant Murugan S.
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
                  showToast("Audio Connected", "Connecting encrypted relay to Conductor Murugan S.", "info");
                  setShowCallModal(false);
                }}
                style={{ backgroundColor: "#2B5BFF" }}
                className="flex-1 py-2.5 rounded-full text-white font-bold text-xs"
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
