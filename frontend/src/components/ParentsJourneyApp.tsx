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
} from "lucide-react";

import { useToast } from "./citymapper/Toast";

export function ParentsJourneyApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("getme");
  const [isGoTripOpen, setIsGoTripOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
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

  return (
    <div
      style={{ backgroundColor: "#0C0E14" }}
      className="min-h-screen text-[#ECEEF3] flex flex-col font-sans select-none"
    >
      <PortSwitcherHeader currentPort={3001} />

      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-24">
        {/* Citymapper Disruption Alert Banner */}
        <DisruptionBanner
          message="Route A Corridor: Traffic normal"
          subtext="±75m lateral buffer valid · Bus 3 on schedule (arr. 07:40 AM)"
          className="mb-3.5"
        />

        {/* Origin → Destination Card (Transit-map stop pair) */}
        <ODCard
          from="Residence (Stop #3 Maple St)"
          to="Veltech Main Gate"
          fromSubtitle="Pickup Stop #3 · Morning Inbound"
          toSubtitle="Bay #2 School Drop Terminal"
          className="mb-3.5"
        />

        {/* Student Custody Profile Mini Card */}
        <div
          style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
          className="rounded-[16px] border p-3.5 mb-3.5 flex items-center justify-between gap-3 shadow-md"
        >
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

        {/* Live Departures Board (Imminent departures in orange <= 3 min) */}
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
      </main>

      {/* Citymapper Bottom Tab Bar */}
      <CMTabBar
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id)}
      />

      {/* Citymapper Full-Screen GO Trip Mode Takeover */}
      <GoTripModal
        isOpen={isGoTripOpen}
        onClose={() => setIsGoTripOpen(false)}
        destinationName="Veltech Main Gate"
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
