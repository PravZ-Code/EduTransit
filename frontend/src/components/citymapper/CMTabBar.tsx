"use client";

import React from "react";
import { Navigation, Compass, Bookmark, User, LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface CMTabBarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  tabs?: TabItem[];
  className?: string;
}

const defaultTabs: TabItem[] = [
  { id: "getme", label: "Get me", icon: Navigation },
  { id: "nearby", label: "Nearby", icon: Compass },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "you", label: "You", icon: User },
];

/**
 * Citymapper Bottom Tab Bar
 * Spec from DESIGN.md:
 * - Height: 64px + safe area
 * - Background: rgba(12,14,20,0.94) with backdrop-filter: blur(20px), 0.5pt top divider #282C38
 * - Tabs (4): Get me / Nearby / Saved / You
 * - Active icon/label: #4D7BFF (Citymapper Blue Bright), inactive: #646C7A
 * - Label: 10px weight 600
 * - No pill indicator — color + icon-fill change only
 */
export function CMTabBar({
  activeTab,
  onTabChange,
  tabs = defaultTabs,
  className = "",
}: CMTabBarProps) {
  return (
    <div
      style={{
        backgroundColor: "rgba(12,14,20,0.94)",
        borderColor: "#282C38",
      }}
      className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl h-[64px] flex items-center justify-around px-2 select-none ${className}`}
    >
      <div className="max-w-md mx-auto w-full flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer transition-colors active:scale-95"
            >
              <Icon
                className={`w-[22px] h-[22px] transition-colors ${
                  isActive ? "text-[#4D7BFF] fill-[#4D7BFF]" : "text-[#646C7A]"
                }`}
              />
              <span
                style={{
                  color: isActive ? "#4D7BFF" : "#646C7A",
                }}
                className="text-[10px] font-semibold tracking-[0.1px] mt-1"
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
