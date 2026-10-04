"use client";

import React from "react";
import { LegStrip, LegItem } from "./LegStrip";

export interface RouteTag {
  text: string;
  type?: "fastest" | "cheapest" | "easiest" | "rainsafe" | "recommended";
}

interface RouteCardProps {
  etaMin: number;
  arrivalClock?: string;
  tag?: RouteTag;
  legs: LegItem[];
  best?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Citymapper Route Option Card
 * Spec from DESIGN.md:
 * - Background: #15171F (Dark Surface 1), border: #282C38, 16px radius, 14px/16px padding
 * - Best route border switches to GO Green #00C281
 * - Header: ETA Hero "24" 22px 800 tabular + "min" 13px 600 secondary
 * - Right-aligned tag pill: "Fastest" (GO green tint), "Cheapest" (blue tint), etc.
 * - Horizontal leg strip of colored mode chips with '›' arrows
 */
export function RouteCard({
  etaMin,
  arrivalClock,
  tag,
  legs,
  best = false,
  selected = false,
  onClick,
  className = "",
}: RouteCardProps) {
  const getTagStyle = (t?: string) => {
    switch (t) {
      case "fastest":
      case "recommended":
        return {
          bg: "rgba(0,194,129,0.18)",
          text: "#00C281",
          border: "rgba(0,194,129,0.3)",
        };
      case "cheapest":
        return {
          bg: "rgba(43,91,255,0.18)",
          text: "#4D7BFF",
          border: "rgba(43,91,255,0.3)",
        };
      case "rainsafe":
        return {
          bg: "rgba(0,168,197,0.18)",
          text: "#00A8C5",
          border: "rgba(0,168,197,0.3)",
        };
      default:
        return {
          bg: "rgba(0,194,129,0.18)",
          text: "#00C281",
          border: "rgba(0,194,129,0.3)",
        };
    }
  };

  const tagStyle = getTagStyle(tag?.type);

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#15171F",
        borderColor: selected ? "#4D7BFF" : best ? "#00C281" : "#282C38",
      }}
      className={`relative rounded-[16px] border p-4 transition-all duration-200 text-left select-none cursor-pointer hover:border-[#4D7BFF] active:scale-[0.99] ${className}`}
    >
      {/* Top Header: ETA Hero + Tag */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black text-[#ECEEF3] tracking-tight tabular-nums leading-none">
            {etaMin}
          </span>
          <span className="text-[13px] font-semibold text-[#98A0AE] leading-none">
            min
          </span>
          {arrivalClock && (
            <span className="text-[12px] text-[#646C7A] ml-2 font-mono">
              arr. {arrivalClock}
            </span>
          )}
        </div>

        {tag && (
          <span
            style={{
              backgroundColor: tagStyle.bg,
              color: tagStyle.text,
              borderColor: tagStyle.border,
            }}
            className="text-[10px] font-black uppercase tracking-[0.4px] px-2.5 py-1 rounded-full border shadow-sm"
          >
            {tag.text}
          </span>
        )}
      </div>

      {/* Signature Leg Strip */}
      <LegStrip legs={legs} />
    </div>
  );
}
