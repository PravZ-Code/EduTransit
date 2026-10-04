"use client";

import React from "react";
import { ArrowUpDown } from "lucide-react";

interface ODCardProps {
  from: string;
  to: string;
  fromSubtitle?: string;
  toSubtitle?: string;
  onSwap?: () => void;
  className?: string;
}

/**
 * Citymapper Origin → Destination Card
 * Spec from DESIGN.md:
 * - Background: #15171F (Dark Surface 1), border: #282C38, 14px radius
 * - Two rows: 10px gray dot ("from") + 10px blue dot ("to")
 * - 2px vertical divider between dots reading like a transit map
 * - Place text: 15px font weight 600
 */
export function ODCard({ from, to, fromSubtitle, toSubtitle, onSwap, className = "" }: ODCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#15171F",
        borderColor: "#282C38",
      }}
      className={`relative rounded-[14px] border p-3.5 sm:px-4 sm:py-3.5 text-left select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2 relative">
          {/* Connecting transit vertical bar */}
          <div
            style={{ backgroundColor: "#282C38" }}
            className="absolute left-[4px] top-[14px] bottom-[14px] w-[2px] pointer-events-none"
          />

          {/* Row 1: Origin ("From") */}
          <div className="flex items-center gap-3 relative z-10">
            <div
              style={{ backgroundColor: "#5A6473" }}
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-[#15171F]"
            />
            <div className="truncate">
              <span className="text-[15px] font-semibold text-[#ECEEF3] tracking-tight block truncate">
                {from}
              </span>
              {fromSubtitle && (
                <span className="text-[12px] text-[#98A0AE] block truncate">
                  {fromSubtitle}
                </span>
              )}
            </div>
          </div>

          {/* Divider hairline */}
          <div style={{ backgroundColor: "#282C38" }} className="h-[1px] ml-5 my-1" />

          {/* Row 2: Destination ("To") */}
          <div className="flex items-center gap-3 relative z-10">
            <div
              style={{ backgroundColor: "#2B5BFF" }}
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-[#15171F]"
            />
            <div className="truncate">
              <span className="text-[15px] font-semibold text-[#ECEEF3] tracking-tight block truncate">
                {to}
              </span>
              {toSubtitle && (
                <span className="text-[12px] text-[#98A0AE] block truncate">
                  {toSubtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {onSwap && (
          <button
            type="button"
            onClick={onSwap}
            style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
            className="p-2 rounded-xl border text-[#98A0AE] hover:text-[#ECEEF3] active:scale-95 transition shrink-0"
            title="Swap origin and destination"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
