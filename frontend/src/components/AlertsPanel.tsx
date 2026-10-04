"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { fetchJson, postJson } from "@/lib/api";

export interface RadarIncident {
  id: string;
  bus_id: string;
  route_id: string;
  severity: "MINOR" | "MODERATE" | "CRITICAL" | string;
  event_type: string;
  description: string;
  timestamp: number;
  resolved: boolean;
}

interface AlertsPanelProps {
  /** Bump to force an immediate refetch (e.g. on SOS WebSocket event). */
  refreshSignal: number;
}

const severityStyles: Record<string, string> = {
  CRITICAL: "border-red-300 bg-red-50/90 text-red-800",
  MODERATE: "border-amber-300 bg-amber-50/90 text-amber-800",
  MINOR: "border-slate-200 bg-slate-50/90 text-slate-700",
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ refreshSignal }) => {
  const [incidents, setIncidents] = useState<RadarIncident[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    const data = await fetchJson<RadarIncident[]>("/incidents");
    if (Array.isArray(data)) setIncidents(data);
  }, []);

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 8000);
    return () => clearInterval(interval);
  }, [loadIncidents, refreshSignal]);

  const handleResolve = async (incidentId: string) => {
    setResolvingId(incidentId);
    await postJson(`/incidents/${incidentId}/resolve`, {});
    await loadIncidents();
    setResolvingId(null);
  };

  const open = incidents.filter((i) => !i.resolved);
  const closed = incidents.filter((i) => i.resolved).slice(-3).reverse();

  if (incidents.length === 0) return null;

  return (
    <aside className="absolute right-4 top-40 z-20 w-72 max-h-[52vh] flex flex-col pointer-events-auto anim-slide-in-right">
      <div className="glass-panel border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2.5 flex items-center justify-between gap-2 border-b border-slate-200/70 bg-gradient-to-r from-white/60 to-slate-50/60"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${open.length > 0 ? "text-red-600" : "text-emerald-600"}`} />
            <span className="text-xs font-extrabold text-slate-900 tracking-tight">Incident Radar</span>
            {open.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-red-600 text-white animate-pulse">
                {open.length} OPEN
              </span>
            )}
          </div>
          <span className="text-slate-500">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {isExpanded && (
          <div className="overflow-y-auto max-h-[44vh] p-2.5 space-y-2">
            {open.length === 0 && (
              <div className="flex items-center gap-2 px-2 py-3 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                All corridor invariants nominal. No active deviations, halts, or SOS beacons.
              </div>
            )}

            {[...open].reverse().map((inc) => (
              <div
                key={inc.id}
                className={`p-2.5 rounded-xl border text-[11px] anim-fade-in ${
                  severityStyles[inc.severity] || severityStyles.MINOR
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-extrabold uppercase tracking-wide truncate">
                      {inc.event_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleResolve(inc.id)}
                    disabled={resolvingId === inc.id}
                    className="shrink-0 px-2 py-1 text-[10px] font-bold rounded-lg bg-white/80 border border-current/30 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {resolvingId === inc.id ? "…" : "Resolve"}
                  </button>
                </div>
                <p className="mt-1 leading-snug opacity-90">{inc.description}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono opacity-60">
                  <span>{inc.bus_id}</span>
                  <span>
                    {new Date(inc.timestamp * 1000).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {closed.length > 0 && (
              <div className="pt-1.5 border-t border-slate-200/70 space-y-1.5">
                {closed.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2 rounded-lg border border-slate-200/60 bg-white/50 text-[10px] text-slate-400 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate line-through">{inc.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
