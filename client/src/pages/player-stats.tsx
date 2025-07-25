import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Player } from "@shared/schema";

export default function PlayerStats() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || player.role.toLowerCase() === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roles = [
    { id: "all", label: "All Players" },
    { id: "batsman", label: "Batsmen" },
    { id: "bowler", label: "Bowlers" },
    { id: "all-rounder", label: "All-rounders" },
    { id: "wicket-keeper", label: "Wicket-keepers" },
  ];

  const calculateAverage = (runs: number, matches: number) => {
    return matches > 0 ? (runs / matches).toFixed(1) : "0.0";
  };

  const calculateStrikeRate = (runs: number, ballsFaced: number) => {
    return ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : "0.0";
  };

  const calculateBowlingAverage = (runsConceded: number, wickets: number) => {
    return wickets > 0 ? (runsConceded / wickets).toFixed(1) : "0.0";
  };

  const calculateEconomy = (runsConceded: number, ballsBowled: number) => {
    const overs = ballsBowled / 6;
    return overs > 0 ? (runsConceded / overs).toFixed(1) : "0.0";
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-20">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Search Players */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
      </div>

      {/* Player Categories */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {roles.map((role) => (
          <Button
            key={role.id}
            variant={selectedRole === role.id ? "default" : "outline"}
            size="sm"
            className={`whitespace-nowrap touch-feedback ${
              selectedRole === role.id 
                ? "cricket-green-600 hover:bg-cricket-green-700" 
                : ""
            }`}
            onClick={() => setSelectedRole(role.id)}
          >
            {role.label}
          </Button>
        ))}
      </div>

      {/* Player List */}
      {filteredPlayers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              {searchTerm || selectedRole !== "all" 
                ? "No players found matching your criteria" 
                : "No players available"
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 cricket-green-100 rounded-full flex items-center justify-center">
                    <span className="text-cricket-green-600 font-bold">
                      {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{player.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-cricket-green-600">
                      {player.matches} matches
                    </div>
                  </div>
                </div>
                
                {/* Batting Stats */}
                {(player.role === "batsman" || player.role === "all-rounder" || player.role === "wicket-keeper") && (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{player.runs}</div>
                        <div className="text-xs text-gray-500">Runs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {calculateAverage(player.runs, player.matches)}
                        </div>
                        <div className="text-xs text-gray-500">Average</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {calculateStrikeRate(player.runs, player.ballsFaced)}
                        </div>
                        <div className="text-xs text-gray-500">Strike Rate</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                      <span>50s: <span className="font-medium">{player.fifties}</span></span>
                      <span>100s: <span className="font-medium">{player.hundreds}</span></span>
                      <span>HS: <span className="font-medium">{player.highScore}</span></span>
                    </div>
                  </>
                )}

                {/* Bowling Stats */}
                {(player.role === "bowler" || player.role === "all-rounder") && (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{player.wickets}</div>
                        <div className="text-xs text-gray-500">Wickets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {calculateBowlingAverage(player.runsConceded, player.wickets)}
                        </div>
                        <div className="text-xs text-gray-500">Average</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {calculateEconomy(player.runsConceded, player.ballsBowled)}
                        </div>
                        <div className="text-xs text-gray-500">Economy</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                      <span>Maidens: <span className="font-medium">{player.maidens}</span></span>
                      <span>Best: <span className="font-medium">{player.bestBowling}</span></span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
