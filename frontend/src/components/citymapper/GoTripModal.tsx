"use client";

import React, { useState, useEffect } from "react";
import { X, Navigation, CheckCircle2, Clock, Volume2, ShieldCheck, MapPin, Bus } from "lucide-react";
import { CMMode, modeColor } from "./theme";

export interface TripStep {
  id: string;
  instruction: string;
  subtext: string;
  mode: CMMode;
  lineBadge?: string;
  status: "completed" | "current" | "upcoming";
  durationMin?: number;
  stopsRemaining?: number;
}

interface GoTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName: string;
  totalEtaMin: number;
  steps: TripStep[];
  currentStepIndex?: number;
}

/**
 * Citymapper GO Trip Mode (Full-Screen Live Navigation Takeover)
 * Spec from DESIGN.md:
 * - Current-instruction header in 26-32px weight 800-900 ("Get off in 2 stops")
 * - Sub-line in 16px 400 ("Tate Modern · 8 min")
 * - Live vertical progress line with mode-colored segments and stop dots
 * - Current leg pulses in its mode color
 * - Floating "End" control
 * - GO Green theme accents
 */
export function GoTripModal({
  isOpen,
  onClose,
  destinationName,
  totalEtaMin,
  steps,
  currentStepIndex = 1,
}: GoTripModalProps) {
  const [activeStep, setActiveStep] = useState(currentStepIndex);
  const [ticker, setTicker] = useState(totalEtaMin);

  useEffect(() => {
    setActiveStep(currentStepIndex);
  }, [currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = steps[activeStep] || steps[0];
  const legActiveColor = modeColor[currentStep.mode] || "#E8453C";

  return (
    <div
      style={{ backgroundColor: "#0C0E14" }}
      className="fixed inset-0 z-50 flex flex-col text-[#ECEEF3] overflow-y-auto animate-fadeIn select-none font-sans"
    >
      {/* Top Floating Chrome Bar */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-[#0C0E14]/90 backdrop-blur-md border-b border-[#282C38] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            style={{ backgroundColor: "#00C281", color: "#003322" }}
            className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs tracking-wider"
          >
            GO
          </div>
          <div>
            <span className="text-[12px] font-black uppercase tracking-[0.4px] text-[#00C281] block">
              Trip Mode Active
            </span>
            <span className="text-[11px] text-[#98A0AE] truncate max-w-[200px] block">
              To: {destinationName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#15171F] border border-[#282C38] text-[13px] font-extrabold tabular-nums">
            <Clock className="w-3.5 h-3.5 text-[#00C281]" />
            <span>{ticker} min left</span>
          </div>

          <button
            onClick={onClose}
            style={{ backgroundColor: "#1E212B", borderColor: "#282C38" }}
            className="px-3 py-1.5 rounded-full border text-xs font-bold text-[#ECEEF3] hover:bg-[#282C38] active:scale-95 transition"
          >
            End Trip
          </button>
        </div>
      </div>

      {/* Main Instruction Hero (Big Chunky Type) */}
      <div className="p-6 max-w-xl mx-auto w-full">
        <div
          style={{
            backgroundColor: "#15171F",
            borderColor: legActiveColor,
          }}
          className="rounded-[20px] p-5 border-2 shadow-2xl relative overflow-hidden mb-6"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#98A0AE] block">
              Current Live Action
            </span>
            <span
              style={{ backgroundColor: legActiveColor }}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-black text-white uppercase tracking-wider"
            >
              {currentStep.mode}
            </span>
          </div>

          {/* Big Chunky Primary Instruction (28px weight 900) */}
          <h1 className="text-[28px] sm:text-[32px] font-black text-[#ECEEF3] tracking-tight leading-[1.15] mb-1.5">
            {currentStep.instruction}
          </h1>

          <p className="text-[15px] font-medium text-[#98A0AE] flex items-center gap-2">
            <span>{currentStep.subtext}</span>
            {currentStep.durationMin && (
              <>
                <span>•</span>
                <span className="text-[#00C281] font-bold">
                  {currentStep.durationMin} min
                </span>
              </>
            )}
          </p>

          {/* Action Simulation Buttons */}
          <div className="mt-4 pt-3 border-t border-[#282C38] flex items-center justify-between text-xs">
            <span className="text-[#646C7A]">Step {activeStep + 1} of {steps.length}</span>
            <div className="flex gap-2">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                className="px-2.5 py-1 rounded bg-[#1E212B] text-[#ECEEF3] disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={activeStep >= steps.length - 1}
                onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}
                className="px-3 py-1 rounded bg-[#00C281] text-[#003322] font-black disabled:opacity-40"
              >
                Next Action ›
              </button>
            </div>
          </div>
        </div>

        {/* Live Step Progress Line (Transit-style vertical line with colored segments) */}
        <div
          style={{ backgroundColor: "#15171F", borderColor: "#282C38" }}
          className="rounded-[20px] p-5 border shadow-xl relative"
        >
          <h2 className="text-[13px] font-black uppercase tracking-[0.4px] text-[#98A0AE] mb-5">
            Journey Sequence
          </h2>

          <div className="relative pl-7 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[3px] before:bg-[#282C38]">
            {steps.map((st, idx) => {
              const isPast = idx < activeStep;
              const isNow = idx === activeStep;
              const isFuture = idx > activeStep;
              const segColor = modeColor[st.mode] || "#2B5BFF";

              return (
                <div
                  key={st.id}
                  onClick={() => setActiveStep(idx)}
                  className="relative group cursor-pointer"
                >
                  {/* Step node dot */}
                  <div
                    style={{
                      backgroundColor: isPast
                        ? "#00C281"
                        : isNow
                        ? segColor
                        : "#1E212B",
                      borderColor: isNow ? "#ECEEF3" : "#282C38",
                    }}
                    className={`absolute -left-[24px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-md transition-all ${
                      isNow ? "scale-125 ring-4 ring-white/10" : ""
                    }`}
                  >
                    {isPast && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>

                  <div
                    style={{
                      backgroundColor: isNow ? "#1E212B" : "transparent",
                      borderColor: isNow ? segColor : "transparent",
                    }}
                    className={`p-3 rounded-xl border transition-all ${
                      isNow ? "ring-1 ring-white/10" : "opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[15px] text-[#ECEEF3] tracking-tight">
                        {st.instruction}
                      </span>
                      {st.lineBadge && (
                        <span
                          style={{ backgroundColor: segColor }}
                          className="px-2 py-0.5 rounded text-[10px] font-black text-white uppercase"
                        >
                          {st.lineBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-[#98A0AE] block mt-0.5">
                      {st.subtext}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Big Exit Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-[#1E212B] hover:bg-[#282C38] text-[#ECEEF3] font-extrabold text-sm border border-[#282C38] transition"
          >
            Exit GO Trip Mode
          </button>
        </div>
      </div>
    </div>
  );
}
