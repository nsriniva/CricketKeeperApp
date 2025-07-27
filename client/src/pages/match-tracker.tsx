import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Play, Clock, Trophy, Users, Calendar, MapPin, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Match, Team, InsertMatch } from "@shared/schema";

const matchFormSchema = z.object({
  team1Id: z.string().min(1, "Please select Team 1"),
  team2Id: z.string().min(1, "Please select Team 2"),
  format: z.enum(["T20", "ODI", "Test"]),
  venue: z.string().optional(),
  tossWinner: z.string().optional(),
  tossDecision: z.enum(["bat", "bowl"]).optional(),
}).refine(data => data.team1Id !== data.team2Id, {
  message: "Teams must be different",
  path: ["team2Id"],
});

type MatchFormData = z.infer<typeof matchFormSchema>;

export default function MatchTracker() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("upcoming");

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      format: "T20",
      tossDecision: "bat",
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: InsertMatch) => {
      const response = await apiRequest("POST", "/api/matches", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      setIsCreateOpen(false);
      form.reset();
    },
  });

  const startMatchMutation = useMutation({
    mutationFn: async (data: { matchId: string; match: Match }) => {
      const { matchId, match } = data;
      const updates = { 
        status: "in_progress" as const,
        currentInnings: 1,
        battingTeam: match.tossDecision === 'bat' ? match.team1Id : match.team2Id,
        bowlingTeam: match.tossDecision === 'bat' ? match.team2Id : match.team1Id
      };
      const response = await apiRequest("PATCH", `/api/matches/${matchId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });

  const onSubmit = (data: MatchFormData) => {
    console.log("Form submitted:", data);
    const team1 = teams.find(t => t.id === data.team1Id);
    const team2 = teams.find(t => t.id === data.team2Id);
    
    if (!team1 || !team2) {
      console.log("Teams not found:", { team1, team2 });
      return;
    }

    const matchData: InsertMatch = {
      team1Id: data.team1Id,
      team2Id: data.team2Id,
      team1Name: team1.name,
      team2Name: team2.name,
      format: data.format,
      venue: data.venue,
      tossWinner: data.tossWinner,
      tossDecision: data.tossDecision,
      status: "not_started",
    };

    console.log("Creating match:", matchData);
    createMatchMutation.mutate(matchData);
  };

  const upcomingMatches = matches.filter(m => m.status === "not_started");
  const liveMatches = matches.filter(m => m.status === "in_progress");
  const completedMatches = matches.filter(m => m.status === "completed");

  const getMatchResult = (match: Match) => {
    if (match.status !== "completed") return "";
    
    const team1Score = `${match.team1Score || 0}/${match.team1Wickets || 0}`;
    const team2Score = `${match.team2Score || 0}/${match.team2Wickets || 0}`;
    
    return match.result || `${match.team1Name}: ${team1Score}, ${match.team2Name}: ${team2Score}`;
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={match.status === "in_progress" ? "default" : "secondary"}>
                {match.format}
              </Badge>
              {match.status === "in_progress" && (
                <Badge className="bg-green-500 text-white">Live</Badge>
              )}
            </div>
            {match.venue && (
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="w-3 h-3 mr-1" />
                {match.venue}
              </div>
            )}
          </div>
          <div className="text-right text-xs text-gray-500">
            {new Date(match.date || '').toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-3">
          {/* Teams */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{match.team1Name}</span>
              {match.status !== "not_started" && (
                <span className="font-mono text-sm">
                  {match.team1Score || 0}/{match.team1Wickets || 0}
                  {match.team1Overs ? ` (${match.team1Overs})` : ''}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">{match.team2Name}</span>
              {match.status !== "not_started" && (
                <span className="font-mono text-sm">
                  {match.team2Score || 0}/{match.team2Wickets || 0}
                  {match.team2Overs ? ` (${match.team2Overs})` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Result or Status */}
          {match.status === "completed" && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <Trophy className="w-4 h-4 inline mr-1" />
              {getMatchResult(match)}
            </div>
          )}

          {match.status === "in_progress" && (
            <div className="text-sm text-cricket-green-600 bg-cricket-green-50 p-2 rounded">
              <Target className="w-4 h-4 inline mr-1" />
              Innings {match.currentInnings} - {match.currentInnings === 1 ? match.team1Name : match.team2Name} batting
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {match.status === "not_started" && (
              <Button
                size="sm"
                className="cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
                onClick={() => startMatchMutation.mutate({ matchId: match.id, match })}
                disabled={startMatchMutation.isPending}
              >
                <Play className="w-3 h-3 mr-1" />
                Start Match
              </Button>
            )}
            {match.status === "in_progress" && (
              <Button
                size="sm"
                variant="outline"
                className="touch-feedback"
              >
                <Activity className="w-3 h-3 mr-1" />
                Live Score
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="touch-feedback"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Match Tracker</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              className="cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
              onClick={() => {
                console.log("Create Match button clicked");
                setIsCreateOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Match
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Match</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log("Form validation errors:", errors);
              })} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="team1Id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 1</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="team2Id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 2</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Format</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="T20">T20</SelectItem>
                          <SelectItem value="ODI">ODI</SelectItem>
                          <SelectItem value="Test">Test</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Match venue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tossWinner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toss Winner (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tossDecision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toss Decision</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bat">Bat First</SelectItem>
                            <SelectItem value="bowl">Bowl First</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
                    disabled={createMatchMutation.isPending}
                    onClick={(e) => {
                      console.log("Create Match button clicked");
                      console.log("Form values:", form.getValues());
                      console.log("Form errors:", form.formState.errors);
                    }}
                  >
                    {createMatchMutation.isPending ? "Creating..." : "Create Match"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="touch-feedback"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Match Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Upcoming ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-1">
            <Play className="w-4 h-4" />
            Live ({liveMatches.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            Completed ({completedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {upcomingMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No Upcoming Matches</h3>
                <p className="text-gray-500 text-sm mb-4">Create a new match to get started</p>
                <Button 
                  onClick={() => setIsCreateOpen(true)}
                  className="cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Match
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          )}
        </TabsContent>

        <TabsContent value="live" className="space-y-3 mt-4">
          {liveMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No Live Matches</h3>
                <p className="text-gray-500 text-sm">Start a match to begin live tracking</p>
              </CardContent>
            </Card>
          ) : (
            liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No Completed Matches</h3>
                <p className="text-gray-500 text-sm">Completed matches will appear here</p>
              </CardContent>
            </Card>
          ) : (
            completedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}