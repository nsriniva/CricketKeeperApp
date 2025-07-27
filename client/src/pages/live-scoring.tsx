import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Square, Plus, Clock, Target, Users, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Match, Player, Team } from "@shared/schema";

export default function LiveScoring() {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [currentBall, setCurrentBall] = useState<number>(0);
  const [ballHistory, setBallHistory] = useState<string[]>([]);
  
  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const liveMatches = matches.filter(match => match.status === "in_progress");
  const selectedMatch = matches.find(match => match.id === selectedMatchId) || liveMatches[0];
  
  const team1 = teams.find(t => t.id === selectedMatch?.team1Id);
  const team2 = teams.find(t => t.id === selectedMatch?.team2Id);
  const battingTeamPlayers = players.filter(p => p.teamId === selectedMatch?.battingTeam);
  const bowlingTeamPlayers = players.filter(p => p.teamId === selectedMatch?.bowlingTeam);

  const updateMatchMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Match> }) => {
      const response = await apiRequest("PATCH", `/api/matches/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });

  const startMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const updates = { 
        status: "in_progress" as const,
        currentInnings: 1,
        battingTeam: selectedMatch?.team1Id,
        bowlingTeam: selectedMatch?.team2Id
      };
      const response = await apiRequest("PATCH", `/api/matches/${matchId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });

  const addRuns = (runs: number, extras?: 'wide' | 'no-ball' | 'bye' | 'leg-bye') => {
    if (!selectedMatch) return;
    
    const ballData = {
      runs,
      extras,
      over: Math.floor(currentBall / 6),
      ball: currentBall % 6 + 1,
      timestamp: new Date().toISOString()
    };
    
    const newBallHistory = [...ballHistory, `${runs}${extras ? ` (${extras})` : ''}`];
    setBallHistory(newBallHistory);
    
    const updates: Partial<Match> = {
      team1Score: selectedMatch.currentInnings === 1 
        ? (selectedMatch.team1Score || 0) + runs 
        : selectedMatch.team1Score,
      team2Score: selectedMatch.currentInnings === 2 
        ? (selectedMatch.team2Score || 0) + runs 
        : selectedMatch.team2Score,
      ballByBall: [...(selectedMatch.ballByBall || []), ballData]
    };
    
    // Only increment ball count for legal deliveries
    if (!extras || extras === 'bye' || extras === 'leg-bye') {
      setCurrentBall(prev => prev + 1);
      const newOvers = Math.floor((currentBall + 1) / 6) + ((currentBall + 1) % 6) / 10;
      updates.team1Overs = selectedMatch.currentInnings === 1 ? newOvers : selectedMatch.team1Overs;
      updates.team2Overs = selectedMatch.currentInnings === 2 ? newOvers : selectedMatch.team2Overs;
    }
    
    updateMatchMutation.mutate({ id: selectedMatch.id, updates });
  };

  const addWicket = (dismissalType?: string) => {
    if (!selectedMatch) return;
    
    const ballData = {
      runs: 0,
      wicket: true,
      dismissalType,
      over: Math.floor(currentBall / 6),
      ball: currentBall % 6 + 1,
      timestamp: new Date().toISOString()
    };
    
    const newBallHistory = [...ballHistory, `W (${dismissalType || 'out'})`];
    setBallHistory(newBallHistory);
    setCurrentBall(prev => prev + 1);
    
    const newOvers = Math.floor((currentBall + 1) / 6) + ((currentBall + 1) % 6) / 10;
    
    const updates: Partial<Match> = {
      team1Wickets: selectedMatch.currentInnings === 1 
        ? (selectedMatch.team1Wickets || 0) + 1 
        : selectedMatch.team1Wickets,
      team2Wickets: selectedMatch.currentInnings === 2 
        ? (selectedMatch.team2Wickets || 0) + 1 
        : selectedMatch.team2Wickets,
      team1Overs: selectedMatch.currentInnings === 1 ? newOvers : selectedMatch.team1Overs,
      team2Overs: selectedMatch.currentInnings === 2 ? newOvers : selectedMatch.team2Overs,
      ballByBall: [...(selectedMatch.ballByBall || []), ballData]
    };
    
    updateMatchMutation.mutate({ id: selectedMatch.id, updates });
  };

  const switchInnings = () => {
    if (!selectedMatch) return;
    
    const updates: Partial<Match> = {
      currentInnings: 2,
      battingTeam: selectedMatch.team2Id,
      bowlingTeam: selectedMatch.team1Id
    };
    
    setCurrentBall(0);
    setBallHistory([]);
    updateMatchMutation.mutate({ id: selectedMatch.id, updates });
  };

  const endMatch = () => {
    if (!selectedMatch) return;
    
    const team1Total = selectedMatch.team1Score || 0;
    const team2Total = selectedMatch.team2Score || 0;
    let result = '';
    let winner = '';
    
    if (team1Total > team2Total) {
      winner = selectedMatch.team1Id;
      result = `${selectedMatch.team1Name} won by ${team1Total - team2Total} runs`;
    } else if (team2Total > team1Total) {
      winner = selectedMatch.team2Id;
      result = `${selectedMatch.team2Name} won by ${10 - (selectedMatch.team2Wickets || 0)} wickets`;
    } else {
      result = 'Match tied';
    }
    
    const updates: Partial<Match> = {
      status: 'completed' as const,
      winner,
      result
    };
    
    updateMatchMutation.mutate({ id: selectedMatch.id, updates });
  };

  if (liveMatches.length === 0) {
    return (
      <div className="p-4 pb-20">
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="font-semibold mb-2">No Live Matches</h3>
              <p className="text-sm">Start a new match to begin live scoring</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Match Header */}
      {selectedMatch && (
        <Card className="cricket-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm opacity-90">{selectedMatch.format} Match</span>
              <span className="bg-green-500 text-xs px-2 py-1 rounded-full">Live</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">
                  {selectedMatch.currentInnings === 1 ? selectedMatch.team1Name : selectedMatch.team2Name}
                </div>
                <div className="text-2xl font-bold">
                  {selectedMatch.currentInnings === 1 
                    ? `${selectedMatch.team1Score || 0}/${selectedMatch.team1Wickets || 0}`
                    : `${selectedMatch.team2Score || 0}/${selectedMatch.team2Wickets || 0}`
                  }
                </div>
                <div className="text-sm opacity-90">
                  {selectedMatch.currentInnings === 1 
                    ? `${selectedMatch.team1Overs} overs`
                    : `${selectedMatch.team2Overs} overs`
                  }
                </div>
              </div>
              {selectedMatch.currentInnings === 2 && (
                <div className="text-right">
                  <div className="text-sm opacity-90">Target</div>
                  <div className="text-lg font-semibold">{(selectedMatch.team1Score || 0) + 1}</div>
                  <div className="text-sm opacity-90">
                    Need {((selectedMatch.team1Score || 0) + 1) - (selectedMatch.team2Score || 0)} runs
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Batsmen */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Current Batsmen</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="font-medium">Batsman 1</div>
              <div className="text-2xl font-bold text-cricket-green-600">45</div>
              <div className="text-sm text-gray-500">(32 balls)</div>
              <div className="w-2 h-2 bg-cricket-green-600 rounded-full mx-auto mt-1"></div>
              <div className="text-xs text-gray-400">On Strike</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Batsman 2</div>
              <div className="text-2xl font-bold">23</div>
              <div className="text-sm text-gray-500">(18 balls)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bowling Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Current Bowler</div>
              <div className="text-sm text-gray-500">3.2-0-28-1</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">This Over</div>
              <div className="font-mono text-sm">{ballHistory.slice(-6).join(' ')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Buttons */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((runs) => (
            <Button
              key={runs}
              variant="outline"
              className="font-semibold py-3 touch-feedback"
              onClick={() => addRuns(runs)}
              disabled={updateMatchMutation.isPending}
            >
              {runs}
            </Button>
          ))}
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 touch-feedback"
            onClick={() => addRuns(4)}
            disabled={updateMatchMutation.isPending}
          >
            4
          </Button>
          <Button
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 touch-feedback"
            onClick={() => addRuns(6)}
            disabled={updateMatchMutation.isPending}
          >
            6
          </Button>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 touch-feedback"
            onClick={() => addRuns(1, 'wide')}
            disabled={updateMatchMutation.isPending}
          >
            WD
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 touch-feedback"
            onClick={() => addRuns(1, 'no-ball')}
            disabled={updateMatchMutation.isPending}
          >
            NB
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 touch-feedback"
            onClick={() => addWicket('bowled')}
            disabled={updateMatchMutation.isPending}
          >
            Wicket
          </Button>
          <Button
            className="cricket-green-600 hover:bg-cricket-green-700 text-white font-semibold py-3 touch-feedback"
            onClick={switchInnings}
            disabled={updateMatchMutation.isPending}
          >
            End Innings
          </Button>
        </div>
      </div>
    </div>
  );
}
