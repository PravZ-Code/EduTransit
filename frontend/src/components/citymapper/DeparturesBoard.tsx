"use client";

import React from "react";
import { CMMode, modeColor } from "./theme";

export interface DepartureRow {
  badge: string;
  mode: CMMode;
  destination: string;
  minutes: number;
  subtext?: string;
  live?: boolean;
}

interface DeparturesBoardProps {
  title?: string;
  rows: DepartureRow[];
  onSelectRow?: (row: DepartureRow) => void;
  className?: string;
}

/**
 * Citymapper Departures Board
 * Spec from DESIGN.md:
 * - Container: #1E212B (Dark Surface 2), 14px radius, overflow: hidden
 * - Each row: 13px/16px padding, 1px #282C38 bottom divider
 * - Leading: 34×24 line badge (mode-colored, 12px 900 white text)
 * - Middle: destination 14px weight 600
 * - Trailing: minutes in 16px weight 800 tabular:
 *   #00C281 (GO Green) normally, #FF8A00 (Disruption Orange) when <= 3 min ("leave now")
 */
export function DeparturesBoard({
  title = "Live Departures",
  rows,
  onSelectRow,
  className = "",
}: DeparturesBoardProps) {
  return (
    <div
      style={{
        backgroundColor: "#1E212B",
        borderColor: "#282C38",
      }}
      className={`rounded-[14px] border overflow-hidden text-left select-none ${className}`}
    >
      {title && (
        <div className="px-4 py-3 border-b border-[#282C38] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C281] animate-pulse" />
            <span className="text-[12px] font-black uppercase tracking-[0.4px] text-[#ECEEF3]">
              {title}
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#98A0AE]">
            Auto-refreshing · live
          </span>
        </div>
      )}

      <div>
        {rows.map((row, index) => {
          const isImminent = row.minutes <= 3;
          const bgBadge = modeColor[row.mode] || "#E8453C";
          const minColor = isImminent ? "#FF8A00" : "#00C281";

          return (
            <div
              key={index}
              onClick={() => onSelectRow?.(row)}
              style={{
                borderBottomColor: "#282C38",
              }}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer hover:bg-[#15171F]/80 ${
                index < rows.length - 1 ? "border-b" : ""
              }`}
            >
              {/* 34x24 Line Badge */}
              <div
                style={{ backgroundColor: bgBadge }}
                className="w-[38px] h-[26px] rounded-[6px] flex items-center justify-center font-black text-white text-[12px] tracking-[0.3px] shrink-0 shadow-sm"
              >
                {row.badge}
              </div>

              {/* Destination */}
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-semibold text-[#ECEEF3] tracking-tight block truncate">
                  {row.destination}
                </span>
                {row.subtext && (
                  <span className="text-[11px] text-[#98A0AE] block truncate">
                    {row.subtext}
                  </span>
                )}
              </div>

              {/* Minutes Count (Tabular numerals) */}
              <div className="text-right shrink-0">
                <span
                  style={{ color: minColor }}
                  className="text-[16px] font-extrabold tabular-nums tracking-tight"
                >
                  {row.minutes === 0 ? "Due" : `${row.minutes} min`}
                </span>
                {isImminent && (
                  <span className="block text-[10px] uppercase font-bold text-[#FF8A00] tracking-wider leading-none mt-0.5">
                    Leave now
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
