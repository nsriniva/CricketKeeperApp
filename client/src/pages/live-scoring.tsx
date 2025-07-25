import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Match, Player } from "@shared/schema";

export default function LiveScoring() {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  
  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const liveMatches = matches.filter(match => match.status === "in_progress");
  const selectedMatch = matches.find(match => match.id === selectedMatchId) || liveMatches[0];

  const updateMatchMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Match> }) => {
      const response = await apiRequest("PATCH", `/api/matches/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });

  const addRuns = (runs: number) => {
    if (!selectedMatch) return;
    
    const updates: Partial<Match> = {
      team1Score: selectedMatch.currentInnings === 1 
        ? selectedMatch.team1Score + runs 
        : selectedMatch.team1Score,
      team2Score: selectedMatch.currentInnings === 2 
        ? selectedMatch.team2Score + runs 
        : selectedMatch.team2Score,
    };
    
    updateMatchMutation.mutate({ id: selectedMatch.id, updates });
  };

  const addWicket = () => {
    if (!selectedMatch) return;
    
    const updates: Partial<Match> = {
      team1Wickets: selectedMatch.currentInnings === 1 
        ? selectedMatch.team1Wickets + 1 
        : selectedMatch.team1Wickets,
      team2Wickets: selectedMatch.currentInnings === 2 
        ? selectedMatch.team2Wickets + 1 
        : selectedMatch.team2Wickets,
    };
    
    updateMatchMutation.mutate({ id: selectedMatch.id, updates });
  };

  const endOver = () => {
    if (!selectedMatch) return;
    
    const currentOvers = selectedMatch.currentInnings === 1 
      ? selectedMatch.team1Overs 
      : selectedMatch.team2Overs;
    
    const updates: Partial<Match> = {
      team1Overs: selectedMatch.currentInnings === 1 
        ? Math.floor(currentOvers) + 1 
        : selectedMatch.team1Overs,
      team2Overs: selectedMatch.currentInnings === 2 
        ? Math.floor(currentOvers) + 1 
        : selectedMatch.team2Overs,
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
                    ? `${selectedMatch.team1Score}/${selectedMatch.team1Wickets}`
                    : `${selectedMatch.team2Score}/${selectedMatch.team2Wickets}`
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
                  <div className="text-lg font-semibold">{selectedMatch.team1Score + 1}</div>
                  <div className="text-sm opacity-90">
                    Need {(selectedMatch.team1Score + 1) - selectedMatch.team2Score} runs
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
              <div className="font-mono text-sm">1 . 4 6 .</div>
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
            onClick={() => addRuns(1)}
            disabled={updateMatchMutation.isPending}
          >
            WD
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 touch-feedback"
            onClick={() => addRuns(1)}
            disabled={updateMatchMutation.isPending}
          >
            NB
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 touch-feedback"
            onClick={addWicket}
            disabled={updateMatchMutation.isPending}
          >
            Wicket
          </Button>
          <Button
            className="cricket-green-600 hover:bg-cricket-green-700 text-white font-semibold py-3 touch-feedback"
            onClick={endOver}
            disabled={updateMatchMutation.isPending}
          >
            End Over
          </Button>
        </div>
      </div>
    </div>
  );
}
