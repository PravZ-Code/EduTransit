"use client";

import React from "react";
import { AlertTriangle, AlertOctagon } from "lucide-react";

interface DisruptionBannerProps {
  message: string;
  subtext?: string;
  severe?: boolean;
  onDismiss?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Citymapper Disruption Banner
 * Spec from DESIGN.md:
 * - Inline strip in route results
 * - Background at 18%: rgba(255,138,0,0.18) (or Delay Red #E8453C if severe)
 * - 1pt border in #FF8A00 (or #E8453C)
 * - 10px corner radius
 * - Alert glyph + 14px weight 700 text
 */
export function DisruptionBanner({
  message,
  subtext,
  severe = false,
  onDismiss,
  onClick,
  className = "",
}: DisruptionBannerProps) {
  const color = severe ? "#E8453C" : "#FF8A00";
  const bg = severe ? "rgba(232,69,60,0.18)" : "rgba(255,138,0,0.18)";

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: bg,
        borderColor: color,
      }}
      className={`rounded-[10px] border p-3 flex items-start gap-3 transition-all select-none ${className}`}
    >
      <div className="shrink-0 mt-0.5">
        {severe ? (
          <AlertOctagon className="w-4 h-4" style={{ color }} />
        ) : (
          <AlertTriangle className="w-4 h-4" style={{ color }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span
          style={{ color: "#ECEEF3" }}
          className="text-[14px] font-bold tracking-tight block"
        >
          {message}
        </span>
        {subtext && (
          <span
            style={{ color: "#98A0AE" }}
            className="text-[12px] font-medium leading-relaxed block mt-0.5"
          >
            {subtext}
          </span>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[#98A0AE] hover:text-[#ECEEF3] text-xs font-bold px-1.5 py-0.5"
        >
          ✕
        </button>
      )}
    </div>
  );
}
