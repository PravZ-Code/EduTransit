"use client";

import React from "react";
import { Play } from "lucide-react";

interface GoButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Citymapper Shape- & Color-Locked GO Button
 * Spec from DESIGN.md:
 * - Full rounded pill, height 54px, 28px corner radius
 * - Background: #00C281 (GO Green) — NEVER any other color
 * - Filled play triangle + word "GO" in 18px font weight 900
 * - Text color: #003322 (dark green text for warmth)
 * - Shadow: 0 10px 22px -10px rgba(0,194,129,0.7)
 * - Pressed: scale 0.98 + brightness 0.95
 */
export function GoButton({ onClick, label = "GO", className = "", disabled }: GoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: "#00C281",
        color: "#003322",
        boxShadow: "0 10px 22px -10px rgba(0,194,129,0.7)",
      }}
      className={`h-[54px] w-full rounded-full flex items-center justify-center gap-2.5 font-black text-[18px] tracking-[0.4px] transition-all duration-150 active:scale-[0.98] active:brightness-95 select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${className}`}
    >
      <Play className="w-5 h-5 fill-[#003322] stroke-none" />
      <span>{label}</span>
    </button>
  );
}
