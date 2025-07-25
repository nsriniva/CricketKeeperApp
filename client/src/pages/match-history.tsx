import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Match } from "@shared/schema";

export default function MatchHistory() {
  const [selectedFormat, setSelectedFormat] = useState("all");
  
  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const completedMatches = matches.filter(match => match.status === "completed");
  
  const filteredMatches = completedMatches.filter(match => {
    return selectedFormat === "all" || match.format.toLowerCase() === selectedFormat;
  });

  const formats = [
    { id: "all", label: "All Formats" },
    { id: "t20", label: "T20" },
    { id: "odi", label: "ODI" },
    { id: "test", label: "Test" },
  ];

  const getFormatColor = (format: string) => {
    switch (format.toLowerCase()) {
      case "t20":
        return "bg-cricket-green-100 text-cricket-green-800";
      case "odi":
        return "bg-blue-100 text-blue-800";
      case "test":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
      {/* Filter Controls */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {formats.map((format) => (
          <Button
            key={format.id}
            variant={selectedFormat === format.id ? "default" : "outline"}
            size="sm"
            className={`whitespace-nowrap touch-feedback ${
              selectedFormat === format.id 
                ? "cricket-green-600 hover:bg-cricket-green-700" 
                : ""
            }`}
            onClick={() => setSelectedFormat(format.id)}
          >
            {format.label}
          </Button>
        ))}
      </div>

      {/* Match Cards */}
      {filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <div className="text-4xl mb-2">🏏</div>
              <h3 className="font-semibold mb-2">No Match History</h3>
              <p className="text-sm">
                {selectedFormat !== "all" 
                  ? `No ${selectedFormat.toUpperCase()} matches found`
                  : "Start playing matches to see your history here"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <Card key={match.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {match.team1Name} vs {match.team2Name}
                    </div>
                    {match.venue && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {match.venue}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getFormatColor(match.format)}`}>
                      {match.format.toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {match.date ? new Date(match.date).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>
                
                {/* Score Summary */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{match.team1Name}</span>
                    <span className="font-mono text-sm">
                      {match.team1Score}/{match.team1Wickets} ({match.team1Overs})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{match.team2Name}</span>
                    <span className="font-mono text-sm">
                      {match.team2Score}/{match.team2Wickets} ({match.team2Overs})
                    </span>
                  </div>
                </div>
                
                {/* Result */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm font-medium text-cricket-green-600">
                    {match.result || "Match completed"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-cricket-green-600 text-sm font-medium h-auto p-0 touch-feedback"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
