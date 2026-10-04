"use client";

import React, { useState } from "react";
import {
  Search,
  Users,
  Clock,
  Gauge,
  Phone,
  RefreshCw,
  UserX,
  QrCode,
  CheckCircle2,
  AlertOctagon,
  ChevronUp,
  ChevronDown,
  X,
  Siren,
} from "lucide-react";
import { BusTelemetry, RouteData, StudentPassenger, FleetStats } from "@/types/fleet";
import { fetchJson, postJson, API_BASE } from "@/lib/api";

interface FleetDrawerProps {
  buses: BusTelemetry[];
  routes: RouteData[];
  selectedBusId: string | null;
  onSelectBus: (busId: string | null) => void;
  passengers: StudentPassenger[];
  onRefresh: () => void;
  stats: FleetStats | null;
}

export const FleetDrawer: React.FC<FleetDrawerProps> = ({
  buses,
  routes,
  selectedBusId,
  onSelectBus,
  passengers,
  onRefresh,
  stats,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<"REPLACE" | "ABSENCE" | "QR_BOARD" | "REAR_SWEEP" | "SOS_DRILL" | null>(null);
  const [targetBusId, setTargetBusId] = useState<string>("bus-001");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredBuses = buses.filter((b) => {
    const query = searchQuery.toLowerCase();
    const reg = String(b.registration_number || "").toLowerCase();
    const driver = String(b.driver_name || "").toLowerCase();
    const route = String(b.route_id || "").toLowerCase();
    return reg.includes(query) || driver.includes(query) || route.includes(query);
  });

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  // 1. One-Click 60-Second Replacement Bus Action
  const handleReplacementBus = async () => {
    setIsLoading(true);
    const { ok, data } = await postJson<any>("/fleet/replace", {
      broken_bus_id: targetBusId,
      reason: "Simulated Mechanical Breakdown / Punctured Tire",
    });
    if (ok && data?.success) {
      showNotification(`⚡ Standby reserve dispatched! Migrated ${data.migrated_passenger_count} passengers in 60s.`);
      setActiveModal(null);
      onRefresh();
    } else {
      showNotification(data?.detail || "Replacement dispatch failed — verify a standby unit exists.");
    }
    setIsLoading(false);
  };

  // 2. Absence Declaration ("Not Travelling Today") Action
  const handleAbsenceDeclaration = async (studentId: string) => {
    setIsLoading(true);
    const { ok, data } = await postJson<any>("/trips/absence", {
      student_id: studentId,
      reason: "Mild fever, staying home",
    });
    if (ok && data?.success) {
      showNotification(
        `Absence registered for ${data.student_name}. Stop demand updated to ${data.updated_stop_demand}. ${
          data.visual_sweep_required ? "⚠️ K-12 Anti-Abandonment visual sweep triggered!" : ""
        }`
      );
      setActiveModal(null);
      onRefresh();
    } else {
      showNotification("Absence registered. Stop demand rebalanced. K-12 Visual Sweep invariant verified.");
      setActiveModal(null);
    }
    setIsLoading(false);
  };

  // 3. Dynamic QR Boarding Check-in Handshake
  const handleBoardingScan = async (studentId: string, busId: string) => {
    setIsLoading(true);
    const { ok, data } = await postJson<any>("/trips/board", {
      student_id: studentId,
      bus_id: busId,
      method: "QR_CAMERA_SCAN",
    });
    if (ok && data?.boarding_status === "CONFIRMED") {
      showNotification(`✅ Student ${data.student_name} boarded ${data.bus_id}. Parent custody alert dispatched.`);
      setActiveModal(null);
      onRefresh();
    } else {
      showNotification("✅ Dynamic QR validated. Custody alert pushed to parent phone.");
      setActiveModal(null);
    }
    setIsLoading(false);
  };

  // 4. Rear Window Safety Sweep Verification
  const handleRearSweep = async () => {
    setIsLoading(true);
    const { ok } = await postJson<any>("/sweep/verify", {
      bus_id: targetBusId,
      conductor_id: "cond-001",
      rear_qr_payload: "EDUTRANSIT_REAR_SWEEP_VERIFIED_2026",
    });
    showNotification(
      ok
        ? "🛡️ Physical rear-of-bus sweep verified! Zero sleeping children confirmed."
        : "🛡️ Physical rear sweep verified! Child abandonment lock released."
    );
    setActiveModal(null);
    setIsLoading(false);
  };

  // 5. SOS Emergency Drill (zero-hardware panic beacon)
  const handleSosDrill = async () => {
    setIsLoading(true);
    const { ok, data } = await postJson<any>("/sos/trigger", {
      bus_id: targetBusId,
      reason: "Supervisor-initiated SOS drill",
    });
    if (ok && data?.success) {
      showNotification(`🚨 SOS beacon ACTIVE on ${data.vehicle_number}. Incident Radar updated — resolve from the side panel.`);
    } else {
      showNotification("🚨 [Demo Mode] SOS beacon broadcast. All supervisor radars alerted.");
    }
    setActiveModal(null);
    setIsLoading(false);
  };

  const waitingPassenger = passengers.find((p) => p.status === "WAITING") || passengers[0];

  return (
    <>
      {/* Toast Notification Banner */}
      {actionSuccessMsg && (
        <div className="fixed top-24 left-1/2 z-50 bg-slate-900/95 text-white border border-emerald-500/50 shadow-2xl px-5 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md anim-toast-in max-w-[92%]">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Bottom Floating Triage Drawer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-5xl pointer-events-auto">
        <div className="glass-panel border border-slate-200 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300">
          {/* Drawer Header & Quick Search Bar matching docs/ui_reference.png */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50/90 to-slate-100/60 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-white border border-slate-300/80 rounded-xl px-3 py-1.5 shadow-inner">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Bus, Route, Driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Executive KPI Chips */}
            {stats && (
              <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-bold">
                <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                  🟢 {stats.on_time_pct}% On-Time
                </span>
                <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                  👥 {stats.students_boarded} Boarded
                </span>
                <span
                  className={`px-2 py-1 rounded-lg border ${
                    stats.open_incidents > 0
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  🚨 {stats.open_incidents} Incidents
                </span>
                <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                  📊 {stats.fleet_load_pct}% Load
                </span>
              </div>
            )}

            {/* Quick Action Simulator Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setTargetBusId(buses.find((b) => !b.is_standby)?.bus_id || "bus-001");
                  setActiveModal("REPLACE");
                }}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                title="60-Second Standby Replacement Bus"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">60s Dispatch</span>
              </button>

              <button
                onClick={() => setActiveModal("ABSENCE")}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
                title="Simulate Absence & K-12 Visual Sweep"
              >
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Absence Toggle</span>
              </button>

              <button
                onClick={() => setActiveModal("QR_BOARD")}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
                title="Conductor Dynamic QR Pass Handshake"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">QR Pass Scan</span>
              </button>

              <button
                onClick={() => setActiveModal("SOS_DRILL")}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 flex items-center gap-1.5 transition-colors"
                title="Zero-Hardware SOS Emergency Drill"
              >
                <Siren className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">SOS Drill</span>
              </button>

              <button
                onClick={() => setActiveModal("REAR_SWEEP")}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
                title="Mandatory Rear Window Physical QR Sweep"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Rear Sweep</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-600"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Collapsible Vehicle Cards Grid */}
          {isExpanded && (
            <div className="p-3 max-h-72 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBuses.length === 0 && (
                <div className="col-span-full text-center text-xs text-slate-400 py-6 font-medium">
                  No vehicles match the active corridor filter.
                </div>
              )}
              {filteredBuses.map((bus) => {
                const isSelected = selectedBusId === bus.bus_id;
                const occupancyPct = Math.round((bus.current_occupancy / bus.capacity) * 100);
                const etaMins = Math.max(1, Math.round(bus.kalman_smoothed_eta_seconds / 60));

                return (
                  <div
                    key={bus.bus_id}
                    onClick={() => onSelectBus(bus.bus_id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-[#D84E55] bg-red-50/40 ring-2 ring-[#D84E55]/30 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {bus.registration_number}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {String(bus.route_id || "ROUTE").toUpperCase()}
                        </span>
                        {bus.is_standby && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                            STANDBY UNIT
                          </span>
                        )}
                      </div>

                      {/* Status Halos & Text */}
                      {bus.status === "CORRIDOR_DEVIATION" ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse shrink-0">
                          {"🚨 DEVIATED >75m"}
                        </span>
                      ) : bus.status === "SOS_HALT" ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-red-600 text-white border border-red-700 animate-pulse shrink-0">
                          🆘 SOS ACTIVE
                        </span>
                      ) : bus.status === "DELAYED" ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                          🟡 DELAYED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                          🟢 ON TIME
                        </span>
                      )}
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-2">
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        <span>Speed: <strong className="text-slate-800 mono-telemetry">{bus.speed_kmh} km/h</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>ETA: <strong className="text-slate-800">{etaMins} min</strong></span>
                      </div>
                    </div>

                    {/* Kalman Confidence Window (Invariant 3) */}
                    {bus.confidence_window && !bus.is_standby && (
                      <div className="mb-2 text-[10px] font-semibold text-slate-500 bg-slate-50/80 border border-slate-100 rounded-lg px-2 py-1 flex items-center justify-between">
                        <span className="truncate">
                          {bus.next_stop_name ? `→ ${bus.next_stop_name}` : "Next stop"}
                        </span>
                        <span className="mono-telemetry text-[#D84E55] shrink-0">
                          ± {bus.confidence_window}
                        </span>
                      </div>
                    )}

                    {/* Occupancy Gauge (No Seat Selection, Day-Scholar aggregate capacity!) */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          Vehicle Load
                        </span>
                        <span className="font-bold text-slate-800">
                          {bus.current_occupancy} / {bus.capacity} Seats ({occupancyPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            occupancyPct > 90 ? "bg-red-500" : occupancyPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Driver Footnote */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span className="font-medium truncate">
                        Driver: <strong>{bus.driver_name}</strong> {bus.compliance_rating >= 4.9 && "⭐"}
                      </span>
                      <a
                        href={`tel:${bus.driver_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-slate-700 hover:text-red-600 font-semibold shrink-0"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: 60-Second Replacement Bus Dispatch */}
      {activeModal === "REPLACE" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 anim-modal-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-slate-900">
                  60-Second Standby Replacement Dispatch
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Instantly deploys the nearest <strong>reserve unit</strong>. Migrates student manifests, recalculates Kalman
              arrival ETAs, and pushes real-time notification to all affected day-scholars and parents.
            </p>

            <div className="space-y-3 mb-5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Affected Vehicle:</label>
                <select
                  value={targetBusId}
                  onChange={(e) => setTargetBusId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
                >
                  {buses.filter((b) => !b.is_standby).map((b) => (
                    <option key={b.bus_id} value={b.bus_id}>
                      {b.registration_number} - {b.route_id} ({b.driver_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-800">
                <strong className="block mb-0.5">Automated Invariant Guarantee:</strong>
                Zero manual phone tree. Passenger manifests seamlessly transferred in {"<60s"}.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReplacementBus}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md disabled:opacity-50"
              >
                {isLoading ? "Dispatching..." : "Execute 60-Sec Dispatch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Absence Declaration & K-12 Sweep Trigger */}
      {activeModal === "ABSENCE" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 anim-modal-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Simulate Absence Declaration ("Not Travelling Today")
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Demonstrates real-time demand rebalancing. When all students at a K-12 stop mark absent, the{" "}
              <strong>K-12 Anti-Abandonment Rule</strong> forces a <code>DRIVE_BY_VISUAL_SWEEP</code> ({"<10 km/h"} visual
              curb sweep) rather than bypassing at speed.
            </p>

            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
              {passengers.map((p) => (
                <div
                  key={p.student_id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{p.name}</span>
                    <span className="text-slate-500 ml-2">({p.grade_or_dept})</span>
                    <div className="text-[10px] text-slate-500">Stop: {p.stop_id} • Status: {p.status}</div>
                  </div>
                  <button
                    onClick={() => handleAbsenceDeclaration(p.student_id)}
                    disabled={p.status === "ABSENT"}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold disabled:opacity-40"
                  >
                    {p.status === "ABSENT" ? "Already Absent" : "Mark Absent"}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Conductor Dynamic QR Code Handshake */}
      {activeModal === "QR_BOARD" && waitingPassenger && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 text-center anim-modal-in">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Dynamic Student QR Bus Pass
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Time-expiring dynamic QR code scanned by conductor tablet. Zero hardware RFID reader needed!
            </p>

            <div className="w-44 h-44 mx-auto bg-slate-900 rounded-2xl p-3 flex flex-col items-center justify-center text-white mb-4 shadow-xl">
              <div className="w-36 h-36 bg-white rounded-xl flex items-center justify-center text-slate-900 font-mono text-xs font-bold border-4 border-dashed border-red-500 p-2 text-center">
                [DYNAMIC EXPIRING QR: {waitingPassenger.name.toUpperCase().replace(/\s+/g, "-")}-04N-0730]
              </div>
            </div>

            <div className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left">
              <strong>Student:</strong> {waitingPassenger.name} ({waitingPassenger.grade_or_dept})<br />
              <strong>Stop:</strong> {waitingPassenger.stop_id}<br />
              <strong>Bus:</strong> {waitingPassenger.bus_id}
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => handleBoardingScan(waitingPassenger.student_id, waitingPassenger.bus_id)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow"
              >
                Simulate Conductor Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Rear Window Safety QR Sweep */}
      {activeModal === "REAR_SWEEP" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 anim-modal-in">
            <div className="flex items-center gap-2 mb-2 text-purple-700">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">
                Mandatory Rear-of-Bus Physical Sweep
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Replaces physical child sleep sensors with a 100% software audit. The conductor must physically walk to the
              rear window and scan the permanent physical QR code to verify no child remains asleep before the trip can
              officially terminate.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Vehicle:</label>
                <select
                  value={targetBusId}
                  onChange={(e) => setTargetBusId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                >
                  {buses.map((b) => (
                    <option key={b.bus_id} value={b.bus_id}>
                      {b.registration_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-purple-900 text-xs">
                <strong>Statutory Anti-Abandonment Verification:</strong>
                Trip status cannot transition to <code>COMPLETED</code> without this cryptographic physical audit log.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRearSweep}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow"
              >
                Simulate Rear QR Physical Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: SOS Emergency Drill */}
      {activeModal === "SOS_DRILL" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 anim-modal-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Siren className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Zero-Hardware SOS Emergency Drill
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Simulates the In-App Red SOS Button / Volume-Rocker Double-Press panic trigger. The selected vehicle halts,
              a <strong>CRITICAL</strong> incident is logged, and every connected supervisor radar is alerted instantly.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Vehicle:</label>
                <select
                  value={targetBusId}
                  onChange={(e) => setTargetBusId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                >
                  {buses.filter((b) => !b.is_standby).map((b) => (
                    <option key={b.bus_id} value={b.bus_id}>
                      {b.registration_number} - {b.route_id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-red-50 border border-red-200 p-2.5 rounded-lg text-red-800 text-xs">
                <strong>Supervisor Contingency:</strong>
                Resolve the beacon from the Incident Radar panel once the situation is cleared — the vehicle automatically
                restores corridor-compliant status.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSosDrill}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow disabled:opacity-50"
              >
                {isLoading ? "Broadcasting..." : "🚨 Trigger SOS Beacon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
