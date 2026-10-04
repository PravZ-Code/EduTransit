"use client";

import React from "react";
import {
  Footprints,
  Bus,
  TrainFront,
  TrainTrack,
  Bike,
  Car,
  Ship,
} from "lucide-react";
import { CMMode, modeColor } from "./theme";

export interface LegItem {
  mode: CMMode;
  label: string;
  durationMin?: number;
}

interface ModeChipProps {
  mode: CMMode;
  label: string;
  durationMin?: number;
  className?: string;
}

export function ModeIcon({ mode, className = "w-3.5 h-3.5 text-white" }: { mode: CMMode; className?: string }) {
  switch (mode) {
    case "walk":
      return <Footprints className={className} />;
    case "bus":
      return <Bus className={className} />;
    case "tube":
      return <TrainFront className={className} />;
    case "rail":
      return <TrainTrack className={className} />;
    case "bike":
      return <Bike className={className} />;
    case "cab":
      return <Car className={className} />;
    case "ferry":
      return <Ship className={className} />;
    default:
      return <Bus className={className} />;
  }
}

/**
 * Citymapper Mode Chip (Atomic transit mode badge)
 * Spec:
 * - Rounded 8px pill, mode color background
 * - White text 12px weight 800 uppercase
 * - 13px white mode glyph
 */
export function ModeChip({ mode, label, durationMin, className = "" }: ModeChipProps) {
  const bg = modeColor[mode] || modeColor.bus;

  return (
    <span
      style={{ backgroundColor: bg }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-white text-[12px] font-black uppercase tracking-[0.3px] shadow-sm select-none shrink-0 ${className}`}
    >
      <ModeIcon mode={mode} className="w-3.5 h-3.5 text-white shrink-0" />
      <span>{label}</span>
      {durationMin !== undefined && durationMin > 0 && (
        <span className="opacity-80 font-mono text-[11px] font-bold lowercase">
          {durationMin}m
        </span>
      )}
    </span>
  );
}

/**
 * Citymapper Leg Strip
 * Spec:
 * - Horizontal sequence of color-coded mode chips
 * - Separated by tertiary '›' arrows (#8A93A3 / #646C7A)
 * - Color first, words second. Never plain text.
 */
export function LegStrip({ legs, className = "" }: { legs: LegItem[]; className?: string }) {
  return (
    <div className={`flex items-center flex-wrap gap-1.5 select-none ${className}`}>
      {legs.map((leg, index) => (
        <React.Fragment key={index}>
          <ModeChip
            mode={leg.mode}
            label={leg.label}
            durationMin={leg.durationMin}
          />
          {index < legs.length - 1 && (
            <span
              style={{ color: "#646C7A" }}
              className="font-black text-sm px-0.5 select-none"
            >
              ›
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
