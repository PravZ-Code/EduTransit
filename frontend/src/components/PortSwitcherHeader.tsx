"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HeartHandshake,
  Baby,
  GraduationCap,
  Bus,
  ExternalLink,
} from "lucide-react";

interface PortSwitcherProps {
  currentPort?: number;
}

export function PortSwitcherHeader({ currentPort }: PortSwitcherProps) {
  const pathname = usePathname();

  const apps = [
    {
      name: "College Monitoring",
      role: "Transport Supervisor Dashboard",
      port: 3000,
      path: "/",
      icon: LayoutDashboard,
      badge: "Desktop Radar",
      color: "from-blue-600 to-indigo-600",
    },
    {
      name: "Parents App",
      role: "Journey Assurance",
      port: 3001,
      path: "/parents",
      icon: HeartHandshake,
      badge: "Custody Events",
      color: "from-emerald-600 to-teal-600",
    },
    {
      name: "K-12 App",
      role: "Guardian Commute",
      port: 3002,
      path: "/k12",
      icon: Baby,
      badge: "School Bus",
      color: "from-amber-500 to-orange-500",
    },
    {
      name: "College Students",
      role: "CampusPass & Shuttles",
      port: 3003,
      path: "/college",
      icon: GraduationCap,
      badge: "Live Shuttles",
      color: "from-cyan-600 to-blue-600",
    },
    {
      name: "Driver App",
      role: "Driver Cabin HUD",
      port: 3004,
      path: "/driver",
      icon: Bus,
      badge: "Verify Boarding",
      color: "from-rose-600 to-red-600",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0C0E14]/95 backdrop-blur-md border-b border-[#282C38] text-[#ECEEF3] px-4 py-2.5 shadow-xl select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2B5BFF] flex items-center justify-center font-bold text-white shadow-md shadow-[#2B5BFF]/30">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-[#ECEEF3]">
                Citymapper EduTransit
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#2B5BFF]/20 text-[#4D7BFF] border border-[#2B5BFF]/40">
                Design System
              </span>
            </div>
            <p className="text-[11px] text-[#98A0AE] hidden sm:block">
              100% Software • Zero Hardware • Multimodal Transit Spec
            </p>
          </div>
        </div>

        {/* Port navigation pill bar */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          {apps.map((app) => {
            const Icon = app.icon;
            const isPathActive = pathname === app.path;
            const isPortActive = currentPort === app.port;
            const isActive = isPortActive || isPathActive;

            return (
              <Link
                key={app.port}
                href={app.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 border whitespace-nowrap ${
                  isActive
                    ? "bg-[#1E212B] text-white border-[#2B5BFF] shadow-sm shadow-[#2B5BFF]/20"
                    : "bg-[#15171F] text-[#98A0AE] border-[#282C38] hover:bg-[#1E212B] hover:text-[#ECEEF3] hover:border-[#4D7BFF]"
                }`}
                title={`Open ${app.name} (${app.role})`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? "text-[#4D7BFF]" : "text-[#646C7A]"
                  }`}
                />
                <span className="font-semibold">{app.name}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isActive
                      ? "bg-[#2B5BFF] text-white font-bold"
                      : "bg-[#0C0E14] text-[#646C7A]"
                  }`}
                >
                  :{app.port}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Live System Indicator */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#282C38] text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#00C281]/10 border border-[#00C281]/30 text-[#00C281] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#00C281] animate-pulse" />
            <span>LIVE API :8000</span>
          </div>
        </div>
      </div>
    </header>
  );
}
