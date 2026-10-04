// Citymapper Design System Tokens
// Framework-neutral spec from .agents/citymapper/DESIGN.md

export const cmColors = {
  // Surfaces (Dark Mode - Primary canvas is deep blue-black, NOT pure black)
  darkCanvas: "#0C0E14",
  darkSurface1: "#15171F",
  darkSurface2: "#1E212B",
  darkDivider: "#282C38",

  // Surfaces (Light Mode)
  canvas: "#FFFFFF",
  surface1: "#F4F5F8",
  surface2: "#E8EAF0",
  divider: "#E3E5EC",

  // Text
  darkTextPrim: "#ECEEF3",
  darkTextSec: "#98A0AE",
  darkTextTer: "#646C7A",
  textPrimary: "#10131A",
  textSecondary: "#5A6473",
  textTertiary: "#8A93A3",

  // Brand Accent (Citymapper Blue - destination pin, selected states, metro/tube)
  cmBlue: "#2B5BFF",
  cmBlueBright: "#4D7BFF",
  cmBluePressed: "#1E45CC",

  // GO Green (RESERVED EXCLUSIVELY for the GO button and live/on-time indicator)
  goGreen: "#00C281",
  goTextDark: "#003322",

  // Transit Mode Colors (Theme-Invariant — the brand's soul, never swap for dark)
  modeWalk: "#00B894",
  modeBus: "#E8453C",
  modeTube: "#2B5BFF",
  modeRail: "#8E44D8",
  modeBike: "#00A8C5",
  modeCab: "#FFB400",
  modeFerry: "#0094C6",

  // Semantic
  disruption: "#FF8A00", // Line delays & imminent departure (<= 3 min)
  delayRed: "#E8453C",   // Severe disruptions & cancellations
} as const;

export type CMMode = "walk" | "bus" | "tube" | "rail" | "bike" | "cab" | "ferry";

export const modeColor: Record<CMMode, string> = {
  walk: cmColors.modeWalk,
  bus: cmColors.modeBus,
  tube: cmColors.modeTube,
  rail: cmColors.modeRail,
  bike: cmColors.modeBike,
  cab: cmColors.modeCab,
  ferry: cmColors.modeFerry,
};

export const modeBgTint: Record<CMMode, string> = {
  walk: "rgba(0,184,148,0.18)",
  bus: "rgba(232,69,60,0.18)",
  tube: "rgba(43,91,255,0.18)",
  rail: "rgba(142,68,216,0.18)",
  bike: "rgba(0,168,197,0.18)",
  cab: "rgba(255,180,0,0.18)",
  ferry: "rgba(0,148,198,0.18)",
};
