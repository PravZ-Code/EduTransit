"use client";

import React from "react";
import { ShieldCheck, Bus, RotateCcw, AlertTriangle, Navigation, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { BusTelemetry } from "@/types/fleet";

export type FleetFilter = "ALL" | "DELAYED" | "ALERTS" | "STANDBY" | "GOLD";
export type ConnectionState = "LIVE" | "RECONNECTING" | "OFFLINE";

interface TopNavPillProps {
  buses: BusTelemetry[];
  onResetCamera: () => void;
  selectedBusId: string | null;
  onSelectBus: (busId: string | null) => void;
  connectionState: ConnectionState;
  activeFilter: FleetFilter;
  onFilterChange: (filter: FleetFilter) => void;
}

const FILTER_PILLS: { key: FleetFilter; label: string }[] = [
  { key: "ALL", label: "All Active" },
  { key: "DELAYED", label: "Delayed" },
  { key: "ALERTS", label: "Off-Route / SOS" },
  { key: "STANDBY", label: "Standby" },
  { key: "GOLD", label: "⭐ Top Drivers" },
];

export const TopNavPill: React.FC<TopNavPillProps> = ({
  buses,
  onResetCamera,
  selectedBusId,
  onSelectBus,
  connectionState,
  activeFilter,
  onFilterChange,
}) => {
  const activeBuses = buses.filter((b) => !b.is_standby);
  const standbyBuses = buses.filter((b) => b.is_standby);
  const delayedBuses = buses.filter((b) => b.status === "DELAYED");
  const deviatedBuses = buses.filter(
    (b) => b.status === "CORRIDOR_DEVIATION" || b.status === "SOS_HALT"
  );
  const goldBuses = buses.filter((b) => b.compliance_rating >= 4.9 && !b.is_standby);

  const pillCounts: Record<FleetFilter, number> = {
    ALL: activeBuses.length,
    DELAYED: delayedBuses.length,
    ALERTS: deviatedBuses.length,
    STANDBY: standbyBuses.length,
    GOLD: goldBuses.length,
  };

  const connDot =
    connectionState === "LIVE" ? "text-emerald-500" :
    connectionState === "RECONNECTING" ? "text-amber-500" : "text-slate-400";

  return (
    <header className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-5xl pointer-events-auto">
      <div className="glass-panel border border-slate-200/80 rounded-2xl shadow-xl px-4 py-2.5 flex items-center justify-between gap-3 text-slate-800 transition-all">
        {/* Campus & Core System Pill */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D84E55] to-[#B91C1C] flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                Veltech University - Avadi Campus
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% Software
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${connectionState === "LIVE" ? "live-dot bg-emerald-500" : connectionState === "RECONNECTING" ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`}
              />
              {connectionState === "LIVE" && (
                <>
                  <Wifi className="w-3 h-3 text-emerald-500" />
                  Live Fleet Radar
                </>
              )}
              {connectionState === "RECONNECTING" && (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                  Reconnecting telemetry stream…
                </>
              )}
              {connectionState === "OFFLINE" && (
                <>
                  <WifiOff className="w-3 h-3 text-slate-400" />
                  Offline — Demo Mode (cached fleet)
                </>
              )}
              <span className="hidden lg:inline">• Corridor 04N / 12C / 18E</span>
            </div>
          </div>
        </div>

        {/* Operational Metrics Bar */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <span className="font-semibold text-slate-700">Fleet:</span>
            <span className="font-bold text-slate-900">{activeBuses.length} In-Transit</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-700 font-semibold">{standbyBuses.length} Standby</span>
          </div>

          {deviatedBuses.length > 0 ? (
            <div className="bg-red-100/90 text-red-800 border border-red-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{deviatedBuses.length} Alert Active</span>
            </div>
          ) : delayedBuses.length > 0 ? (
            <div className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
              <span>⚠️ {delayedBuses.length} Delayed</span>
            </div>
          ) : (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Corridor Invariants Nominal</span>
            </div>
          )}
        </div>

        {/* Actions & Follow Mode Switcher */}
        <div className="flex items-center gap-2">
          {selectedBusId && (
            <button
              onClick={() => onSelectBus(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1.5 shadow transition-all"
              title="Exit Drone Follow Mode"
            >
              <Navigation className={`w-3.5 h-3.5 text-emerald-400 ${connectionState === "LIVE" ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
              <span>Exit Drone Mode</span>
            </button>
          )}

          <button
            onClick={onResetCamera}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shadow-sm"
            title="Reset 3D Isometric View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Corridor Filter & Route Pill Bar (DESIGN.md §2.2) */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 px-0.5" style={{ scrollbarWidth: "none" }}>
        {FILTER_PILLS.map((pill) => {
          const isActive = activeFilter === pill.key;
          const count = pillCounts[pill.key];
          const showAlertColor = pill.key === "ALERTS" && count > 0;
          return (
            <button
              key={pill.key}
              onClick={() => onFilterChange(pill.key)}
              className={`shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-full border flex items-center gap-1.5 transition-all active:scale-95 ${
                isActive
                  ? showAlertColor
                    ? "bg-[#E8453C] border-[#E8453C] text-white shadow-md shadow-red-500/25"
                    : "bg-[#2B5BFF] border-[#2B5BFF] text-white shadow-md shadow-blue-500/25"
                  : showAlertColor
                    ? "bg-white/90 border-red-300 text-red-700 hover:border-red-400"
                    : "bg-white/80 border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800"
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                  isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
