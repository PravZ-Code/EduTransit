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
  Bell,
  Heart,
  ChevronRight,
  Phone,
  Sparkles,
  CheckCircle2,
  Share2,
  MessageSquare,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Star,
  EyeOff,
  Send,
  ThumbsUp,
  FileText,
  AlertOctagon,
  Copy,
  Check,
} from "lucide-react";
import { postJson, fetchJson } from "@/lib/api";

interface RouteDetail {
  id: string;
  name: string;
  destination: string;
  etaMin: number;
  occupancy: number;
  capacity: number;
  fromStop: string;
  toStop: string;
}

const SHUTTLE_ROUTES: Record<string, RouteDetail> = {
  "NC-1": {
    id: "NC-1",
    name: "North Campus Express",
    destination: "Engineering Tech Block via Central Library",
    etaMin: 2,
    occupancy: 32,
    capacity: 40,
    fromStop: "Hostel Stop #2 (North Quad)",
    toStop: "Engineering Tech Block Concourse",
  },
  "SC-2": {
    id: "SC-2",
    name: "South Quad Shuttle",
    destination: "South Quad & Research Park",
    etaMin: 7,
    occupancy: 18,
    capacity: 40,
    fromStop: "Central Library Hub",
    toStop: "Innovation Research Park Bay 3",
  },
  "EC-4": {
    id: "EC-4",
    name: "Hostels Loop Shuttle",
    destination: "Hostels Connector Loop & Sports Complex",
    etaMin: 14,
    occupancy: 25,
    capacity: 40,
    fromStop: "Sports Complex Gate",
    toStop: "Hostel Block 4 Concourse",
  },
};

interface StudentComplaint {
  ticket_id: string;
  student_alias: string;
  category: string;
  category_label: string;
  bus_id: string;
  route_id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  is_anonymous: boolean;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  created_at: string;
  resolution_notes?: string | null;
}

const GRIEVANCE_CATEGORIES = [
  { id: "RASH_DRIVING", label: "Rash Driving / Overspeeding", icon: "🚨" },
  { id: "OVERCROWDING", label: "Overcrowding & Standee Surge", icon: "👥" },
  { id: "DELAY", label: "Unannounced Delay (>10 min)", icon: "⏱️" },
  { id: "BEHAVIOR", label: "Driver / Conductor Misconduct", icon: "👤" },
  { id: "SAFETY", label: "Safety Concern / Harassment", icon: "🛡️" },
  { id: "CLEANLINESS", label: "AC / Cabin Hygiene Issue", icon: "🧼" },
];

export function CollegeCampusPassApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"shuttle" | "pass">("shuttle");
  const [cmNavTab, setCmNavTab] = useState("getme");
  const [isGoTripOpen, setIsGoTripOpen] = useState(false);
  const [absenceDeclared, setAbsenceDeclared] = useState(false);
  const [proximityCheckedIn, setProximityCheckedIn] = useState(false);
  const [passTimer, setPassTimer] = useState(24);
  const [selectedRouteId, setSelectedRouteId] = useState("NC-1");
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [autoProximityEnabled, setAutoProximityEnabled] = useState(true);

  // Privacy Feedback & Grievance State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTab, setFeedbackTab] = useState<"LODGE" | "RATE" | "TICKETS">("LODGE");
  const [complaintCategory, setComplaintCategory] = useState("RASH_DRIVING");
  const [complaintStop, setComplaintStop] = useState("Hostel Stop #2 (North Quad)");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintSeverity, setComplaintSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Rating State
  const [starRating, setStarRating] = useState(5);
  const [selectedRatingTags, setSelectedRatingTags] = useState<string[]>(["Punctual", "Smooth Ride"]);
  const [ratingComment, setRatingComment] = useState("");

  // Tracked Tickets List
  const [myTickets, setMyTickets] = useState<StudentComplaint[]>([
    {
      ticket_id: "CMP-2026-104",
      student_alias: "🔒 Anonymous Student #49",
      category: "RASH_DRIVING",
      category_label: "Overspeeding / Rash Driving",
      bus_id: "bus_01",
      route_id: "NC-1",
      description: "Driver exceeded 45 km/h on Avadi bypass ramp during morning hours without slowing down.",
      severity: "HIGH",
      is_anonymous: true,
      status: "INVESTIGATING",
      created_at: "Today, 07:35 AM",
      resolution_notes: "Contractor SLA warning issued to Driver. Telemetry speed governor logs under review.",
    },
    {
      ticket_id: "CMP-2026-088",
      student_alias: "🔒 Anonymous Student #49",
      category: "CLEANLINESS",
      category_label: "AC / Cabin Hygiene Issue",
      bus_id: "bus_02",
      route_id: "SC-2",
      description: "Rear air-conditioning unit was blowing warm air on return trip.",
      severity: "LOW",
      is_anonymous: true,
      status: "RESOLVED",
      created_at: "Yesterday",
      resolution_notes: "HVAC compressor filter serviced and pressure topped up at depot maintenance bay.",
    },
  ]);

  const currentRoute = SHUTTLE_ROUTES[selectedRouteId] || SHUTTLE_ROUTES["NC-1"];

  // Rotating TOTP Countdown for Digital Pass
  useEffect(() => {
    const timer = setInterval(() => {
      setPassTimer((t) => (t > 1 ? t - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const routeLegs: LegItem[] = [
    { mode: "walk", label: "Walk", durationMin: 3 },
    { mode: "tube", label: currentRoute.id, durationMin: 12 },
    { mode: "walk", label: "Tech Block", durationMin: 2 },
  ];

  const tripSteps: TripStep[] = [
    {
      id: "cp1",
      instruction: `Walk to ${currentRoute.fromStop}`,
      subtext: "200 meters · Departure platform",
      mode: "walk",
      status: "completed",
      durationMin: 3,
    },
    {
      id: "cp2",
      instruction: `Board ${currentRoute.name} (${currentRoute.id})`,
      subtext: `High-frequency express corridor · ${currentRoute.capacity - currentRoute.occupancy} seats free`,
      mode: "tube",
      lineBadge: currentRoute.id,
      status: "current",
      durationMin: 12,
      stopsRemaining: 2,
    },
    {
      id: "cp3",
      instruction: `Alight at ${currentRoute.toStop}`,
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
      subtext: "Regular Shuttle · 22 seats remaining",
    },
    {
      badge: "EC-4",
      mode: "rail",
      destination: "Hostels Connector Loop",
      minutes: 14,
      subtext: "Inter-Campus Loop · 15 seats remaining",
    },
  ];

  const campusStops = [
    { id: "cs1", name: "Hostel Stop #2 (North Quad)", walk: "3 min", distance: "210m", shuttles: ["NC-1", "EC-4"], isCurrent: true },
    { id: "cs2", name: "Central Library Terminal", walk: "6 min", distance: "450m", shuttles: ["NC-1", "SC-2"], isCurrent: false },
    { id: "cs3", name: "Engineering Tech Block (Bay 1)", walk: "11 min", distance: "820m", shuttles: ["NC-1", "SC-2"], isCurrent: false },
    { id: "cs4", name: "Research Innovation Park", walk: "16 min", distance: "1.2 km", shuttles: ["SC-2"], isCurrent: false },
    { id: "cs5", name: "Sports Arena & Cafeteria", walk: "8 min", distance: "600m", shuttles: ["EC-4"], isCurrent: false },
  ];

  const handleToggleAbsence = async () => {
    const next = !absenceDeclared;
    setAbsenceDeclared(next);

    await postJson("/trips/absence", {
      student_id: "stu_07",
      student_name: "Aditya Verma",
      route_id: currentRoute.id,
      is_absent: next,
    });

    if (next) {
      showToast(
        "Absence Declared",
        `Shuttle ${currentRoute.id} stop bypass enabled. Empty detour eliminated.`,
        "warning"
      );
    } else {
      showToast(
        "Seat Reserved",
        `Attendance active for ${currentRoute.id}. Driver notified for pickup.`,
        "success"
      );
    }
  };

  const handleProximityCheckin = async () => {
    const next = !proximityCheckedIn;
    setProximityCheckedIn(next);

    if (next) {
      await postJson("/trips/board", {
        student_id: "stu_07",
        student_name: "Aditya Verma",
        bus_id: "bus_02",
        method: "PROXIMITY_RADAR",
      });

      showToast(
        "Proximity Boarding Verified",
        `Matched GPS within 18m of ${currentRoute.id} door. Digital Pass stamped.`,
        "success"
      );
    } else {
      showToast("Boarding Reset", "Proximity check-in reset to standby mode.", "info");
    }
  };

  // Submit Grievance with Cryptographic Privacy
  const handleSubmitGrievance = async () => {
    if (!complaintDesc.trim()) {
      showToast("Description Required", "Please provide details of what occurred.", "warning");
      return;
    }

    const categoryObj = GRIEVANCE_CATEGORIES.find((c) => c.id === complaintCategory);
    const generatedTicket = `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      ticket_id: generatedTicket,
      student_name: isAnonymous ? null : "Aditya Verma",
      is_anonymous: isAnonymous,
      category: complaintCategory,
      category_label: categoryObj?.label || "General Grievance",
      bus_id: currentRoute.id === "NC-1" ? "bus_01" : currentRoute.id === "SC-2" ? "bus_02" : "bus_03",
      route_id: currentRoute.id,
      description: complaintDesc,
      severity: complaintSeverity,
      stop: complaintStop,
    };

    const { ok } = await postJson("/complaints", payload);

    const newTicketRecord: StudentComplaint = {
      ticket_id: generatedTicket,
      student_alias: isAnonymous ? "🔒 Anonymous Student (You)" : "Aditya Verma (You)",
      category: complaintCategory,
      category_label: categoryObj?.label || "General Grievance",
      bus_id: payload.bus_id,
      route_id: currentRoute.id,
      description: complaintDesc,
      severity: complaintSeverity,
      is_anonymous: isAnonymous,
      status: "OPEN",
      created_at: "Just now",
      resolution_notes: null,
    };

    setMyTickets((prev) => [newTicketRecord, ...prev]);
    setSubmittedTicket(generatedTicket);
    setComplaintDesc("");

    showToast(
      isAnonymous ? "🔒 Anonymous Grievance Lodged" : "Grievance Submitted",
      `Ticket ${generatedTicket} assigned. Forwarded to Transport Ombudsman with zero retribution protection.`,
      "success"
    );
  };

  // Submit Ride Rating
  const handleSubmitRating = async () => {
    await postJson("/feedback", {
      route_id: currentRoute.id,
      rating: starRating,
      tags: selectedRatingTags,
      comment: ratingComment,
    });

    showToast("Feedback Received", `Thank you for rating ${currentRoute.id}! Feedback logged.`, "success");
    setRatingComment("");
    setShowFeedbackModal(false);
  };

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

          <div className="flex items-center gap-2">
            {/* Quick Grievance Entry Button in Top Header */}
            <button
              onClick={() => {
                setFeedbackTab("LODGE");
                setShowFeedbackModal(true);
              }}
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs text-[#ECEEF3] hover:border-[#00C281] hover:text-[#00C281] transition active:scale-95"
              title="Lodge Anonymous Grievance"
            >
              <Lock className="w-3.5 h-3.5 text-[#00C281]" />
              <span className="text-[11px] font-bold">Feedback</span>
            </button>

            <button
              onClick={() => setShowNotifModal(true)}
              className="relative w-9 h-9 rounded-xl bg-[#15171F] border border-[#282C38] flex items-center justify-center text-[#98A0AE] hover:text-[#ECEEF3] transition active:scale-95"
              title="Campus Shuttle Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00C281]" />
            </button>
            <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#2B5BFF]/10 text-[#4D7BFF] border border-[#2B5BFF]/30 font-bold">
              :3003
            </span>
          </div>
        </div>

        {/* ================= TAB 1: GET ME (Active Commute & Pass) ================= */}
        {cmNavTab === "getme" && (
          <>
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
                className="py-2 rounded-[12px] font-extrabold text-[12px] flex items-center justify-center gap-1.5 transition shadow-sm active:scale-98"
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
                className="py-2 rounded-[12px] font-extrabold text-[12px] flex items-center justify-center gap-1.5 transition shadow-sm active:scale-98"
              >
                <QrCode className="w-4 h-4" />
                <span>My Pass</span>
              </button>
            </div>

            {activeTab === "shuttle" ? (
              <>
                {/* Disruption Alert Banner */}
                <DisruptionBanner
                  message={`${currentRoute.name}: Normal Operations`}
                  subtext={`${currentRoute.id} operating with ${currentRoute.capacity - currentRoute.occupancy} remaining seats · Next arrival in ${currentRoute.etaMin} min`}
                  className="mb-3.5 cursor-pointer"
                  onClick={() =>
                    showToast(
                      "Express Corridor Active",
                      `${currentRoute.name} corridor running with zero delays. Dynamic headways every 10 mins.`,
                      "info"
                    )
                  }
                />

                {/* Origin → Destination Card */}
                <ODCard
                  from={currentRoute.fromStop}
                  to={currentRoute.toStop}
                  fromSubtitle="Departure Platform"
                  toSubtitle="Main Academic Concourse"
                  className="mb-3.5"
                />

                {/* Shuttle Route Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 text-xs">
                  {Object.values(SHUTTLE_ROUTES).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRouteId(r.id);
                        showToast("Switched Route", `Selected ${r.name} (${r.id}).`, "info");
                      }}
                      style={{
                        backgroundColor: selectedRouteId === r.id ? "rgba(43,91,255,0.2)" : "#15171F",
                        borderColor: selectedRouteId === r.id ? "#2B5BFF" : "#282C38",
                        color: selectedRouteId === r.id ? "#4D7BFF" : "#98A0AE",
                      }}
                      className="px-3 py-1.5 rounded-[12px] border font-bold whitespace-nowrap transition active:scale-95"
                    >
                      {r.id}: {r.etaMin}m
                    </button>
                  ))}
                </div>

                {/* Dynamic Seat Availability Card */}
                <div
                  style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                  className="rounded-[16px] border p-4 mb-3.5 shadow-md"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-[#ECEEF3] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#2B5BFF]" />
                      Seat Availability ({currentRoute.id})
                    </span>
                    <span className="font-mono font-extrabold text-[#4D7BFF]">
                      {currentRoute.occupancy} / {currentRoute.capacity} seats filled
                    </span>
                  </div>

                  {/* Occupancy bar */}
                  <div className="relative h-2.5 w-full bg-[#1E212B] rounded-full overflow-hidden mb-2">
                    <div
                      style={{
                        width: `${(currentRoute.occupancy / currentRoute.capacity) * 100}%`,
                        background:
                          currentRoute.occupancy / currentRoute.capacity > 0.85
                            ? "linear-gradient(90deg, #FFB400 0%, #E8453C 100%)"
                            : "linear-gradient(90deg, #00B894 0%, #00C281 60%, #FFB400 100%)",
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#98A0AE]">
                    <span className="text-[#00C281] font-bold">
                      {currentRoute.capacity - currentRoute.occupancy} seats available
                    </span>
                    <span>
                      {Math.round((currentRoute.occupancy / currentRoute.capacity) * 100)}% Occupancy
                    </span>
                  </div>
                </div>

                {/* Route Option Card with Leg Strip */}
                <div className="mb-3.5">
                  <RouteCard
                    etaMin={currentRoute.etaMin + 15}
                    arrivalClock="08:15"
                    tag={{ text: "Fastest", type: "fastest" }}
                    legs={routeLegs}
                    best={true}
                    onClick={() => setIsGoTripOpen(true)}
                  />
                </div>

                {/* Citymapper GO BUTTON */}
                <div className="mb-3.5">
                  <GoButton
                    onClick={() => setIsGoTripOpen(true)}
                    label={`GO · LIVE ${currentRoute.id} SHUTTLE`}
                  />
                </div>

                {/* Dedicated Anonymous Grievance & Rating Pill */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => {
                      setFeedbackTab("LODGE");
                      setShowFeedbackModal(true);
                    }}
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="p-3 rounded-[14px] border text-left hover:border-[#00C281] transition active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#ECEEF3] mb-0.5">
                      <Lock className="w-3.5 h-3.5 text-[#00C281]" />
                      <span>Lodge Grievance</span>
                    </div>
                    <span className="text-[10px] text-[#98A0AE] block">
                      100% Anonymous Privacy
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setFeedbackTab("RATE");
                      setShowFeedbackModal(true);
                    }}
                    style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
                    className="p-3 rounded-[14px] border text-left hover:border-[#FFB400] transition active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#ECEEF3] mb-0.5">
                      <Star className="w-3.5 h-3.5 text-[#FFB400] fill-[#FFB400]" />
                      <span>Rate My Ride</span>
                    </div>
                    <span className="text-[10px] text-[#98A0AE] block">
                      Driver & Comfort Score
                    </span>
                  </button>
                </div>

                {/* Departures Board */}
                <div className="mb-5">
                  <DeparturesBoard
                    title="Live Campus Departures"
                    rows={departureRows}
                    onSelectRow={(row) => {
                      if (SHUTTLE_ROUTES[row.badge]) {
                        setSelectedRouteId(row.badge);
                      }
                      showToast("Selected Shuttle", `${row.badge} arriving in ${row.minutes} min`, "info");
                      setIsGoTripOpen(true);
                    }}
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
                      Higher-Ed dynamic bypass: eliminates empty campus stop detours
                    </span>
                  </div>
                  <button
                    onClick={handleToggleAbsence}
                    className="p-1 transition active:scale-95"
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
                  <RefreshCw
                    className="w-3.5 h-3.5 animate-spin cursor-pointer"
                    onClick={() => {
                      setPassTimer(30);
                      showToast("Token Refreshed", "Generated new dynamic TOTP pass signature.", "info");
                    }}
                  />
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
                    onClick={handleProximityCheckin}
                    style={{
                      backgroundColor: proximityCheckedIn ? "#15171F" : "#2B5BFF",
                      color: proximityCheckedIn ? "#00C281" : "#FFFFFF",
                      borderColor: proximityCheckedIn ? "#00C281" : "transparent",
                    }}
                    className="w-full py-2.5 rounded-full font-black text-xs border transition active:scale-95"
                  >
                    {proximityCheckedIn ? "✓ Boarding Confirmed" : "Trigger Proximity Verification"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: NEARBY (Campus Shuttle Stops) ================= */}
        {cmNavTab === "nearby" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-[17px] font-extrabold text-[#ECEEF3]">Campus Shuttle Stops</h2>
                <p className="text-[12px] text-[#98A0AE]">Real-time platforms and walking distances</p>
              </div>
              <Compass className="w-5 h-5 text-[#2B5BFF]" />
            </div>

            {/* Search Stop Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#646C7A] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search campus bus bays, libraries, hostels..."
                className="w-full bg-[#15171F] border border-[#282C38] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF]"
                onChange={(e) => {
                  if (e.target.value.length > 2) {
                    showToast("Searching Campus Hubs", `Filtering for "${e.target.value}"`, "info");
                  }
                }}
              />
            </div>

            <div className="space-y-2.5">
              {campusStops.map((s) => (
                <div
                  key={s.id}
                  style={{ backgroundColor: "#15171F", borderColor: s.isCurrent ? "#2B5BFF" : "#282C38" }}
                  className="rounded-[16px] border p-3.5 transition hover:border-[#4D7BFF]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#ECEEF3]">{s.name}</span>
                        {s.isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C281]/20 text-[#00C281] border border-[#00C281]/30">
                            Nearest
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#98A0AE] mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#FFB400]" />
                        {s.walk} ({s.distance})
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        showToast("Boarding Platform Selected", `Set ${s.name} as current campus origin.`, "success");
                        setIsGoTripOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#1E212B] hover:bg-[#282C38] text-[11px] font-bold text-[#ECEEF3] border border-[#282C38]"
                    >
                      Walk Here
                    </button>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#282C38]/60 flex items-center gap-2 overflow-x-auto">
                    {s.shuttles.map((sh, idx) => (
                      <span
                        key={idx}
                        onClick={() => {
                          setSelectedRouteId(sh);
                          setCmNavTab("getme");
                          setActiveTab("shuttle");
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0C0E14] text-[#4D7BFF] border border-[#282C38] cursor-pointer hover:border-[#4D7BFF]"
                      >
                        🚌 {sh} Shuttle
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                showToast("Campus Shuttle Radar", "Displaying 3D shuttle corridors across campus.", "info");
                setIsGoTripOpen(true);
              }}
              style={{ backgroundColor: "#2B5BFF" }}
              className="w-full py-3 rounded-full text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#2B5BFF]/30 active:scale-95 transition"
            >
              <Navigation className="w-4 h-4" />
              <span>LIVE INTER-CAMPUS SHUTTLE RADAR</span>
            </button>
          </div>
        )}

        {/* ================= TAB 3: SAVED (Student Daily Commutes) ================= */}
        {cmNavTab === "saved" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-[17px] font-extrabold text-[#ECEEF3]">Saved Daily Routes</h2>
                <p className="text-[12px] text-[#98A0AE]">Frequent student timetable corridors</p>
              </div>
              <Heart className="w-5 h-5 text-[#E8453C]" />
            </div>

            {/* Route 1 */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[#ECEEF3] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00C281]" />
                  Hostel #2 → CS Engineering Block
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00C281]/20 text-[#00C281]">
                  NC-1 EXPRESS
                </span>
              </div>
              <p className="text-[11px] text-[#98A0AE] mb-3">
                Daily Class Timetable · 08:30 AM Lecture
              </p>
              <button
                onClick={() => {
                  setSelectedRouteId("NC-1");
                  setCmNavTab("getme");
                  setActiveTab("shuttle");
                  setIsGoTripOpen(true);
                }}
                style={{ backgroundColor: "#00C281", color: "#003322" }}
                className="w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Track NC-1 Inbound</span>
              </button>
            </div>

            {/* Route 2 */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[#ECEEF3] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2B5BFF]" />
                  Central Library → Innovation Park
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#2B5BFF]/20 text-[#4D7BFF]">
                  SC-2 REGULAR
                </span>
              </div>
              <p className="text-[11px] text-[#98A0AE] mb-3">
                Project Lab Shift · 02:00 PM Afternoon
              </p>
              <button
                onClick={() => {
                  setSelectedRouteId("SC-2");
                  setCmNavTab("getme");
                  setActiveTab("shuttle");
                  setIsGoTripOpen(true);
                }}
                className="w-full py-2 rounded-xl bg-[#1E212B] hover:bg-[#282C38] text-[#ECEEF3] border border-[#282C38] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Clock className="w-3.5 h-3.5 text-[#FFB400]" />
                <span>Track SC-2 Shuttle</span>
              </button>
            </div>

            <button
              onClick={() => {
                showToast("Route Template Saved", "Added Library → Gym loop to saved routes.", "success");
              }}
              className="w-full py-3 rounded-[16px] border border-dashed border-[#282C38] hover:border-[#4D7BFF] text-xs font-bold text-[#98A0AE] hover:text-[#ECEEF3] flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-[#4D7BFF]" />
              <span>+ Bookmark New Campus Shuttle Corridor</span>
            </button>
          </div>
        )}

        {/* ================= TAB 4: YOU (Student Profile & Pass Settings) ================= */}
        {cmNavTab === "you" && (
          <div className="space-y-3.5">
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[20px] border p-4 text-center shadow-lg"
            >
              <div
                style={{ backgroundColor: "#2B5BFF" }}
                className="w-16 h-16 rounded-[18px] flex items-center justify-center font-black text-white text-xl mx-auto mb-2 shadow-lg shadow-[#2B5BFF]/30"
              >
                AV
              </div>
              <h3 className="font-extrabold text-[16px] text-[#ECEEF3]">Aditya Verma</h3>
              <p className="text-[11px] text-[#98A0AE]">B.Tech Computer Science & Engineering</p>
              <p className="text-[11px] font-mono text-[#4D7BFF] mt-0.5">Roll #22BCE1048 · Term 6</p>

              <div className="mt-3.5 pt-3 border-t border-[#282C38] grid grid-cols-2 gap-2 text-left text-xs">
                <div className="bg-[#1E212B] p-2.5 rounded-xl border border-[#282C38]">
                  <span className="text-[10px] text-[#98A0AE] block">Pass Status</span>
                  <span className="font-bold text-[#00C281]">Active (Valid 2026)</span>
                </div>
                <div className="bg-[#1E212B] p-2.5 rounded-xl border border-[#282C38]">
                  <span className="text-[10px] text-[#98A0AE] block">Primary Shuttle</span>
                  <span className="font-bold text-[#ECEEF3]">NC-1 North Express</span>
                </div>
              </div>
            </div>

            {/* PRIVACY FEEDBACK & GRIEVANCE ACCESS CARD */}
            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-4 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#00C281]/15 text-[#00C281] flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#ECEEF3]">
                      Privacy Grievance & Feedback
                    </h4>
                    <p className="text-[11px] text-[#98A0AE]">
                      100% Cryptographic Shielding · Zero Retaliation
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00C281]/20 text-[#00C281]">
                  ENCRYPTED
                </span>
              </div>

              <p className="text-[11px] text-[#98A0AE] leading-relaxed">
                Lodge confidential complaints directly with the Institution Transport Ombudsman. Driver and contractors cannot view your name, phone, or roll number.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setFeedbackTab("LODGE");
                    setShowFeedbackModal(true);
                  }}
                  style={{ backgroundColor: "#2B5BFF" }}
                  className="py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Lodge Complaint</span>
                </button>

                <button
                  onClick={() => {
                    setFeedbackTab("TICKETS");
                    setShowFeedbackModal(true);
                  }}
                  className="py-2.5 rounded-xl bg-[#1E212B] hover:bg-[#282C38] text-[#ECEEF3] border border-[#282C38] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-[#FFB400]" />
                  <span>My Tickets ({myTickets.length})</span>
                </button>
              </div>
            </div>

            <div
              style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
              className="rounded-[16px] border p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#ECEEF3] block">Automatic Proximity Check-in</span>
                  <span className="text-[11px] text-[#98A0AE]">Auto-logs boarding when within 25m of shuttle</span>
                </div>
                <button
                  onClick={() => {
                    const next = !autoProximityEnabled;
                    setAutoProximityEnabled(next);
                    showToast(next ? "Proximity Auto-Log Enabled" : "Manual Check-in Only", next ? "Bluetooth/GPS proximity active." : "Manual mode.", "info");
                  }}
                  className="p-1"
                >
                  {autoProximityEnabled ? (
                    <ToggleRight className="w-7 h-7 text-[#00C281]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-[#646C7A]" />
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-[#282C38] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#ECEEF3] block">Departures Surge Alert</span>
                  <span className="text-[11px] text-[#98A0AE]">Push alert if shuttle capacity exceeds 85%</span>
                </div>
                <button
                  onClick={() => {
                    showToast("Alert Preferences Updated", "Surge alerts enabled for exam weeks.", "info");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1E212B] border border-[#282C38] font-bold text-xs text-[#4D7BFF]"
                >
                  Active
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                showToast("Campus Security Connected", "Connecting to Campus Security Control Room: +91 44 2684 0249", "warning");
              }}
              style={{ backgroundColor: "#E8453C" }}
              className="w-full py-3 rounded-full text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#E8453C]/30 active:scale-95 transition"
            >
              <Phone className="w-4 h-4" />
              <span>CAMPUS SECURITY & PATROL HOTLINE</span>
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
        destinationName={currentRoute.toStop}
        totalEtaMin={currentRoute.etaMin + 15}
        steps={tripSteps}
        currentStepIndex={1}
      />

      {/* ================= COMPREHENSIVE PRIVACY FEEDBACK & GRIEVANCE MODAL ================= */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0E14]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
            className="border rounded-[22px] max-w-sm w-full shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-[#282C38] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00C281]/20 text-[#00C281] flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[15px] text-[#ECEEF3]">
                    Transport Feedback & Grievance
                  </h3>
                  <p className="text-[10px] text-[#00C281] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C281] animate-pulse" />
                    Zero Retribution Privacy Shield Active
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSubmittedTicket(null);
                }}
                className="w-7 h-7 rounded-lg bg-[#1E212B] text-[#98A0AE] hover:text-[#ECEEF3] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Segmented Subtabs [Lodge Grievance | Rate Ride | My Tickets] */}
            <div className="p-3 bg-[#0C0E14] border-b border-[#282C38] grid grid-cols-3 gap-1">
              <button
                onClick={() => {
                  setFeedbackTab("LODGE");
                  setSubmittedTicket(null);
                }}
                style={{
                  backgroundColor: feedbackTab === "LODGE" ? "#2B5BFF" : "transparent",
                  color: feedbackTab === "LODGE" ? "#FFFFFF" : "#98A0AE",
                }}
                className="py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Grievance</span>
              </button>
              <button
                onClick={() => {
                  setFeedbackTab("RATE");
                  setSubmittedTicket(null);
                }}
                style={{
                  backgroundColor: feedbackTab === "RATE" ? "#2B5BFF" : "transparent",
                  color: feedbackTab === "RATE" ? "#FFFFFF" : "#98A0AE",
                }}
                className="py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
              >
                <Star className="w-3 h-3" />
                <span>Rate Ride</span>
              </button>
              <button
                onClick={() => {
                  setFeedbackTab("TICKETS");
                  setSubmittedTicket(null);
                }}
                style={{
                  backgroundColor: feedbackTab === "TICKETS" ? "#2B5BFF" : "transparent",
                  color: feedbackTab === "TICKETS" ? "#FFFFFF" : "#98A0AE",
                }}
                className="py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
              >
                <FileText className="w-3 h-3" />
                <span>Tickets ({myTickets.length})</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* === VIEW 1: LODGE CONFIDENTIAL GRIEVANCE === */}
              {feedbackTab === "LODGE" && (
                <>
                  {submittedTicket ? (
                    /* Submission Confirmation Screen */
                    <div className="text-center py-4 space-y-3">
                      <div className="w-14 h-14 rounded-full bg-[#00C281]/20 text-[#00C281] flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h4 className="font-extrabold text-[16px] text-[#ECEEF3]">
                        Grievance Lodged Confidentially
                      </h4>
                      <p className="text-[11px] text-[#98A0AE] max-w-xs mx-auto">
                        Your identity has been decoupled and encrypted. Transport dispatchers and operators cannot trace this to your student profile.
                      </p>

                      <div className="p-3.5 bg-[#1E212B] border border-[#282C38] rounded-xl text-left max-w-xs mx-auto space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#98A0AE]">Ticket Tracking ID:</span>
                          <span className="font-mono font-black text-[#00C281]">{submittedTicket}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#98A0AE]">Privacy Level:</span>
                          <span className="font-bold text-[#4D7BFF]">
                            {isAnonymous ? "100% Cryptographic Shield" : "Confidential Ombudsman"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#98A0AE]">Assigned Ombudsman:</span>
                          <span className="font-bold text-[#ECEEF3]">Dean of Student Transport</span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(submittedTicket);
                            setCopiedTicket(true);
                            setTimeout(() => setCopiedTicket(false), 2000);
                            showToast("Copied", `Ticket ${submittedTicket} copied to clipboard.`, "info");
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#1E212B] border border-[#282C38] font-bold text-xs text-[#ECEEF3] flex items-center justify-center gap-1.5"
                        >
                          {copiedTicket ? <Check className="w-3.5 h-3.5 text-[#00C281]" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedTicket ? "Copied" : "Copy Token"}</span>
                        </button>
                        <button
                          onClick={() => setFeedbackTab("TICKETS")}
                          style={{ backgroundColor: "#2B5BFF" }}
                          className="flex-1 py-2 rounded-xl text-white font-bold text-xs"
                        >
                          View Tracked Tickets
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Grievance Submission Form */
                    <div className="space-y-3.5">
                      {/* Identity Shield Toggle Banner */}
                      <div className="p-3 rounded-xl bg-[#00C281]/10 border border-[#00C281]/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <EyeOff className="w-4 h-4 text-[#00C281]" />
                          <div>
                            <span className="font-bold text-xs text-[#ECEEF3] block">
                              Lodge Anonymously
                            </span>
                            <span className="text-[10px] text-[#98A0AE]">
                              Name & roll number are completely hidden
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const next = !isAnonymous;
                            setIsAnonymous(next);
                            showToast(
                              next ? "Anonymous Shield Active" : "Confidential Mode",
                              next
                                ? "Zero identity telemetry attached to grievance."
                                : "Name visible only to University Ombudsman (hidden from driver).",
                              "info"
                            );
                          }}
                        >
                          {isAnonymous ? (
                            <ToggleRight className="w-8 h-8 text-[#00C281]" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-[#646C7A]" />
                          )}
                        </button>
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className="text-[11px] font-bold text-[#98A0AE] block mb-1.5 uppercase tracking-wider">
                          Incident Category
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {GRIEVANCE_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setComplaintCategory(cat.id)}
                              style={{
                                backgroundColor: complaintCategory === cat.id ? "rgba(43,91,255,0.2)" : "#1E212B",
                                borderColor: complaintCategory === cat.id ? "#2B5BFF" : "#282C38",
                                color: complaintCategory === cat.id ? "#4D7BFF" : "#ECEEF3",
                              }}
                              className="p-2 rounded-xl border text-left text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <span>{cat.icon}</span>
                              <span className="text-[11px] truncate">{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Route & Severity Row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-[#98A0AE] block mb-1 uppercase">
                            Shuttle Route
                          </label>
                          <select
                            value={selectedRouteId}
                            onChange={(e) => setSelectedRouteId(e.target.value)}
                            className="w-full bg-[#1E212B] border border-[#282C38] rounded-xl p-2 text-xs text-[#ECEEF3] focus:outline-none focus:border-[#2B5BFF]"
                          >
                            <option value="NC-1">NC-1 North Express</option>
                            <option value="SC-2">SC-2 South Quad</option>
                            <option value="EC-4">EC-4 Hostels Loop</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#98A0AE] block mb-1 uppercase">
                            Urgency / Severity
                          </label>
                          <select
                            value={complaintSeverity}
                            onChange={(e) => setComplaintSeverity(e.target.value as any)}
                            className="w-full bg-[#1E212B] border border-[#282C38] rounded-xl p-2 text-xs text-[#ECEEF3] focus:outline-none focus:border-[#2B5BFF]"
                          >
                            <option value="LOW">Low (Quality Issue)</option>
                            <option value="MEDIUM">Medium (Operation Delay)</option>
                            <option value="HIGH">High (Overspeeding / Hazard)</option>
                            <option value="CRITICAL">Critical (Immediate Danger)</option>
                          </select>
                        </div>
                      </div>

                      {/* Stop / Location Input */}
                      <div>
                        <label className="text-[10px] font-bold text-[#98A0AE] block mb-1 uppercase">
                          Location / Corridor Stop
                        </label>
                        <input
                          type="text"
                          value={complaintStop}
                          onChange={(e) => setComplaintStop(e.target.value)}
                          placeholder="e.g. Hostel Stop #2 or Library Hub"
                          className="w-full bg-[#1E212B] border border-[#282C38] rounded-xl p-2 text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF]"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-[10px] font-bold text-[#98A0AE] block mb-1 uppercase">
                          Grievance Details
                        </label>
                        <textarea
                          rows={3}
                          value={complaintDesc}
                          onChange={(e) => setComplaintDesc(e.target.value)}
                          placeholder="Describe the incident (e.g. vehicle speed, driver actions, timing, overcrowding). Specifics help the ombudsman take corrective action..."
                          className="w-full bg-[#1E212B] border border-[#282C38] rounded-xl p-2.5 text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF] resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmitGrievance}
                        style={{ backgroundColor: "#00C281", color: "#003322" }}
                        className="w-full py-3 rounded-full font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00C281]/20 active:scale-95 transition"
                      >
                        <Lock className="w-4 h-4" />
                        <span>SUBMIT ANONYMOUS GRIEVANCE</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* === VIEW 2: RATE MY RIDE === */}
              {feedbackTab === "RATE" && (
                <div className="space-y-4 py-1 text-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#ECEEF3]">
                      Rate Your Ride on {currentRoute.name}
                    </h4>
                    <p className="text-[11px] text-[#98A0AE]">
                      Help maintain high contractor service ratings
                    </p>
                  </div>

                  {/* 5-Star Interactive Rating */}
                  <div className="flex items-center justify-center gap-2 my-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStarRating(s)}
                        className="p-1 hover:scale-110 transition active:scale-95"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            s <= starRating ? "text-[#FFB400] fill-[#FFB400]" : "text-[#282C38]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#FFB400]">
                    {starRating === 5
                      ? "⭐⭐⭐⭐⭐ Outstanding Ride"
                      : starRating === 4
                      ? "⭐⭐⭐⭐ Good & On Schedule"
                      : starRating === 3
                      ? "⭐⭐⭐ Acceptable"
                      : "Needs Improvement"}
                  </span>

                  {/* Feedback Chips */}
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-[#98A0AE] block mb-1.5 uppercase">
                      What went well?
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Punctual Arrival",
                        "Smooth Ride",
                        "AC Cold",
                        "Polite Driver",
                        "Clean Seats",
                        "Safe Speed",
                      ].map((tag) => {
                        const isSelected = selectedRatingTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedRatingTags((prev) =>
                                isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                              );
                            }}
                            style={{
                              backgroundColor: isSelected ? "rgba(0,194,129,0.2)" : "#1E212B",
                              borderColor: isSelected ? "#00C281" : "#282C38",
                              color: isSelected ? "#00C281" : "#ECEEF3",
                            }}
                            className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition"
                          >
                            {isSelected ? "✓ " : "+ "}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-[#98A0AE] block mb-1 uppercase">
                      Optional Comment
                    </label>
                    <input
                      type="text"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Add brief note for fleet manager..."
                      className="w-full bg-[#1E212B] border border-[#282C38] rounded-xl p-2.5 text-xs text-[#ECEEF3] placeholder-[#646C7A] focus:outline-none focus:border-[#2B5BFF]"
                    />
                  </div>

                  <button
                    onClick={handleSubmitRating}
                    style={{ backgroundColor: "#2B5BFF" }}
                    className="w-full py-3 rounded-full text-white font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>SUBMIT TRIP RATING</span>
                  </button>
                </div>
              )}

              {/* === VIEW 3: TRACKED TICKETS === */}
              {feedbackTab === "TICKETS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ECEEF3]">
                      Your Grievance History ({myTickets.length})
                    </span>
                    <span className="text-[10px] font-mono text-[#00C281]">
                      Ombudsman Sync Active
                    </span>
                  </div>

                  {myTickets.map((t) => (
                    <div
                      key={t.ticket_id}
                      className="p-3 rounded-xl bg-[#1E212B] border border-[#282C38] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#4D7BFF]">
                            {t.ticket_id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              t.status === "RESOLVED"
                                ? "bg-[#00C281]/20 text-[#00C281]"
                                : t.status === "INVESTIGATING"
                                ? "bg-[#FFB400]/20 text-[#FFB400]"
                                : "bg-[#2B5BFF]/20 text-[#4D7BFF]"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#98A0AE]">
                          {t.created_at}
                        </span>
                      </div>

                      <div className="font-bold text-[#ECEEF3]">
                        {t.category_label} · <span className="text-[#4D7BFF]">{t.route_id}</span>
                      </div>

                      <p className="text-[11px] text-[#98A0AE] leading-relaxed">
                        "{t.description}"
                      </p>

                      {t.resolution_notes && (
                        <div className="p-2 rounded-lg bg-[#0C0E14] border border-[#00C281]/30 text-[10px] text-[#00C281]">
                          <strong className="block text-[#00C281]">Ombudsman Action:</strong>
                          {t.resolution_notes}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setFeedbackTab("LODGE");
                      setSubmittedTicket(null);
                    }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#282C38] hover:border-[#2B5BFF] text-xs font-bold text-[#98A0AE] hover:text-[#ECEEF3] flex items-center justify-center gap-1.5 transition"
                  >
                    <span>+ Lodge New Anonymous Grievance</span>
                  </button>
                </div>
              )}
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
              Campus Shuttle Alerts
            </h3>
            <div className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
              <div className="p-2.5 bg-[#1E212B] rounded-xl border border-[#282C38]">
                <div className="flex items-center justify-between font-bold text-[#ECEEF3]">
                  <span>NC-1 Approaching</span>
                  <span className="text-[10px] text-[#98A0AE]">07:18 AM</span>
                </div>
                <p className="text-[11px] text-[#98A0AE] mt-0.5">2 mins from Hostel Stop #2. 8 seats available.</p>
              </div>
              <div className="p-2.5 bg-[#1E212B] rounded-xl border border-[#282C38]">
                <div className="flex items-center justify-between font-bold text-[#00C281]">
                  <span>Proximity Match Confirmed</span>
                  <span className="text-[10px] text-[#98A0AE]">Yesterday</span>
                </div>
                <p className="text-[11px] text-[#98A0AE] mt-0.5">Zero-hardware radar auto-verified boarding.</p>
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
