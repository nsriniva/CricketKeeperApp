import { useState } from "react";
import { Home, Zap, Users, Clock, UsersIcon, Settings, Target } from "lucide-react";
import SettingsDialog from "./settings-dialog";

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ currentTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "live-scoring", label: "Live", icon: Zap },
    { id: "match-tracker", label: "Matches", icon: Target },
    { id: "player-stats", label: "Players", icon: Users },
    { id: "team-management", label: "Teams", icon: UsersIcon },
  ];

  return (
    <>
      {/* Header */}
      <header className="cricket-green-600 text-white px-4 py-3 ios-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-cricket-green-600 font-bold text-sm">🏏</span>
            </div>
            <h1 className="text-lg font-semibold">CricketPro</h1>
          </div>
          <div className="flex items-center space-x-2">
            <SettingsDialog />
          </div>
        </div>
      </header>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 ios-blur safe-bottom">
        <div className="container mx-auto">
          <div className="flex justify-around items-center py-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = currentTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  className="flex flex-col items-center space-y-1 py-2 px-3 touch-feedback"
                  onClick={() => onTabChange(tab.id)}
                >
                  <IconComponent 
                    className={`w-5 h-5 ${
                      isActive ? "text-cricket-green-600" : "text-gray-400"
                    }`}
                  />
                  <span 
                    className={`text-xs font-medium ${
                      isActive ? "text-cricket-green-600" : "text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
