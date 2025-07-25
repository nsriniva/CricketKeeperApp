import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Dashboard from "@/pages/dashboard";
import LiveScoring from "@/pages/live-scoring";
import PlayerStats from "@/pages/player-stats";
import MatchHistory from "@/pages/match-history";
import TeamManagement from "@/pages/team-management";
import { useLocalStorage } from "@/hooks/use-local-storage";

function App() {
  const [currentTab, setCurrentTab] = useLocalStorage("cricket_app_current_tab", "dashboard");

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  const renderCurrentPage = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard onNavigate={handleTabChange} />;
      case "live-scoring":
        return <LiveScoring />;
      case "player-stats":
        return <PlayerStats />;
      case "match-history":
        return <MatchHistory />;
      case "team-management":
        return <TeamManagement />;
      default:
        return <Dashboard onNavigate={handleTabChange} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="container mx-auto bg-white min-h-screen">
          {/* Status Bar Spacer for iOS */}
          <div className="safe-top cricket-green-600"></div>
          
          <Navigation currentTab={currentTab} onTabChange={handleTabChange} />
          
          <main className="flex-1 overflow-y-auto">
            {renderCurrentPage()}
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
