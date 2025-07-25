import { useQuery } from "@tanstack/react-query";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Team, Match, Player } from "@shared/schema";

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const currentMatch = matches.find(match => match.status === "in_progress");
  const recentMatches = matches.filter(match => match.status === "completed").slice(0, 3);
  
  const totalMatches = matches.length;
  const completedMatches = matches.filter(match => match.status === "completed");
  const winRate = completedMatches.length > 0 
    ? Math.round((completedMatches.filter(match => match.winner).length / completedMatches.length) * 100)
    : 0;

  if (matchesLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-200 animate-pulse rounded-xl h-20"></div>
          <div className="bg-gray-200 animate-pulse rounded-xl h-20"></div>
        </div>
        <div className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="cricket-green-50 border-cricket-green-100">
          <CardContent className="p-4">
            <div className="text-cricket-green-600 text-sm font-medium">Matches Played</div>
            <div className="text-2xl font-bold text-cricket-green-700">{totalMatches}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="text-blue-600 text-sm font-medium">Win Rate</div>
            <div className="text-2xl font-bold text-blue-700">{winRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Match Card */}
      {currentMatch ? (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Current Match</h3>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                Live
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{currentMatch.team1Name}</span>
                <span className="font-semibold">
                  {currentMatch.team1Score}/{currentMatch.team1Wickets}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{currentMatch.team2Name}</span>
                <span className="font-semibold">
                  {currentMatch.team2Score}/{currentMatch.team2Wickets}
                </span>
              </div>
              <div className="text-sm text-gray-500 text-center pt-2 border-t">
                {currentMatch.format} • {currentMatch.venue}
              </div>
            </div>
            <Button 
              className="w-full mt-3 cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
              onClick={() => onNavigate("live-scoring")}
            >
              Continue Scoring
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-gray-500 mb-3">No active matches</div>
            <Button 
              className="cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
              onClick={() => onNavigate("team-management")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start New Match
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="cricket-green-600 hover:bg-cricket-green-700 p-4 h-auto flex-col space-y-2 touch-feedback"
            onClick={() => onNavigate("team-management")}
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">New Match</span>
          </Button>
          <Button 
            variant="outline"
            className="p-4 h-auto flex-col space-y-2 touch-feedback"
            onClick={() => onNavigate("player-stats")}
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-sm font-medium">Statistics</span>
          </Button>
        </div>
      </div>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Matches</h3>
            <Button 
              variant="ghost" 
              className="text-cricket-green-600 text-sm font-medium h-auto p-0"
              onClick={() => onNavigate("match-history")}
            >
              View All
            </Button>
          </div>
          
          {recentMatches.map((match) => (
            <Card key={match.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{match.team1Name}</div>
                    <div className="text-sm text-gray-500">vs {match.team2Name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      match.winner ? "text-cricket-green-600" : "text-cricket-red"
                    }`}>
                      {match.result || "Match Completed"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {match.date ? new Date(match.date).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {match.team1Name} {match.team1Score}/{match.team1Wickets} vs {match.team2Name} {match.team2Score}/{match.team2Wickets}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state for no matches */}
      {matches.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <div className="text-4xl mb-2">🏏</div>
              <h3 className="font-semibold mb-2">Welcome to CricketPro</h3>
              <p className="text-sm">Start by creating teams and organizing your first match</p>
            </div>
            <Button 
              className="cricket-green-600 hover:bg-cricket-green-700"
              onClick={() => onNavigate("team-management")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
