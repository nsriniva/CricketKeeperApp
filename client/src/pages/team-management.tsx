import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Users, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTeamSchema, insertPlayerSchema, insertMatchSchema } from "@shared/schema";
import type { Team, Player, InsertTeam, InsertPlayer, InsertMatch } from "@shared/schema";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const teamFormSchema = insertTeamSchema.extend({
  name: z.string().min(1, "Team name is required"),
  shortName: z.string().min(1, "Short name is required").max(5, "Short name must be 5 characters or less"),
});

const playerFormSchema = insertPlayerSchema.extend({
  name: z.string().min(1, "Player name is required"),
  role: z.string().min(1, "Role is required"),
  teamId: z.string().optional(),
});

const matchFormSchema = insertMatchSchema.extend({
  team1Id: z.string().min(1, "Team 1 is required"),
  team2Id: z.string().min(1, "Team 2 is required"),
  format: z.string().min(1, "Format is required"),
  venue: z.string().optional(),
}).refine((data) => {
  console.log("=== SCHEMA VALIDATION ===", data);
  return data.team1Id !== data.team2Id;
}, {
  message: "Please select different teams",
  path: ["team2Id"],
});

export default function TeamManagement() {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  
  // Debug logging
  console.log("=== TEAM MANAGEMENT COMPONENT LOADED ===");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { toast } = useToast();

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const teamForm = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      shortName: "",
    },
  });

  const playerForm = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "",
      role: "batsman",
      teamId: "",
    },
  });

  const matchForm = useForm<z.infer<typeof matchFormSchema>>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      team1Id: "",
      team2Id: "",
      format: "T20",
      venue: "",
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: InsertTeam) => {
      const response = await apiRequest("POST", "/api/teams", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setShowTeamDialog(false);
      teamForm.reset();
      toast({
        title: "Success",
        description: "Team created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (data: InsertPlayer) => {
      const response = await apiRequest("POST", "/api/players", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowPlayerDialog(false);
      playerForm.reset();
      toast({
        title: "Success",
        description: "Player added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive",
      });
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: InsertMatch) => {
      console.log("=== MUTATION STARTING ===", data);
      const team1 = teams.find(t => t.id === data.team1Id);
      const team2 = teams.find(t => t.id === data.team2Id);
      
      const matchData = {
        ...data,
        team1Name: team1?.name || "",
        team2Name: team2?.name || "",
        status: "not_started",
      };
      
      console.log("=== SENDING MATCH DATA ===", matchData);
      const response = await apiRequest("POST", "/api/matches", matchData);
      return response.json();
    },
    onSuccess: (result) => {
      console.log("=== MATCH CREATED SUCCESS ===", result);
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      setShowMatchDialog(false);
      matchForm.reset();
      toast({
        title: "Success",
        description: "Match created successfully",
      });
    },
    onError: (error) => {
      console.error("=== MATCH CREATION ERROR ===", error);
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      });
    },
  });

  const onCreateTeam = (data: z.infer<typeof teamFormSchema>) => {
    createTeamMutation.mutate(data);
  };

  const onCreatePlayer = (data: z.infer<typeof playerFormSchema>) => {
    createPlayerMutation.mutate(data);
  };

  const onCreateMatch = (data: z.infer<typeof matchFormSchema>) => {
    console.log("=== FORM SUBMITTED ===", data);
    if (data.team1Id === data.team2Id) {
      console.log("=== SAME TEAM SELECTED ERROR ===");
      toast({
        title: "Error",
        description: "Please select different teams",
        variant: "destructive",
      });
      return;
    }
    console.log("=== CALLING MUTATION ===");
    createMatchMutation.mutate(data);
  };

  const getTeamStats = (teamId: string) => {
    const teamMatches = matches.filter(
      (match) => match.team1Id === teamId || match.team2Id === teamId
    );
    const completedMatches = teamMatches.filter((match) => match.status === "completed");
    const wins = completedMatches.filter((match) => match.winner === teamId);
    
    return {
      matches: completedMatches.length,
      wins: wins.length,
      losses: completedMatches.length - wins.length,
    };
  };

  const getTeamPlayers = (teamId: string) => {
    return players.filter(player => player.teamId === teamId);
  };

  if (teamsLoading) {
    return (
      <div className="p-4 space-y-4 pb-20">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
        <div className="flex space-x-2">
          <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="cricket-green-600 hover:bg-cricket-green-700 touch-feedback">
                <Plus className="w-4 h-4 mr-1" />
                Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <Form {...teamForm}>
                <form onSubmit={teamForm.handleSubmit(onCreateTeam)} className="space-y-4">
                  <FormField
                    control={teamForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter team name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={teamForm.control}
                    name="shortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MI, CSK" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full cricket-green-600 hover:bg-cricket-green-700"
                    disabled={createTeamMutation.isPending}
                  >
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="cricket-green-600 hover:bg-cricket-green-700 touch-feedback"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("=== MATCH BUTTON CLICKED IN TEAM MANAGEMENT ===");
                  console.log("Available teams:", teams.length);
                  console.log("Teams data:", teams);
                  console.log("Current showMatchDialog state:", showMatchDialog);
                  setShowMatchDialog(true);
                  console.log("Setting showMatchDialog to true");
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Match
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Match</DialogTitle>
              </DialogHeader>
              <Form {...matchForm}>
                <form onSubmit={matchForm.handleSubmit(onCreateMatch, (errors) => {
                  console.error("=== FORM VALIDATION ERRORS ===", errors);
                  console.error("Form state:", matchForm.formState.errors);
                })} className="space-y-4">
                  <FormField
                    control={matchForm.control}
                    name="team1Id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 1</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team 1" />
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
                    control={matchForm.control}
                    name="team2Id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 2</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team 2" />
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
                    control={matchForm.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
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
                    control={matchForm.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter venue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full cricket-green-600 hover:bg-cricket-green-700"
                    disabled={createMatchMutation.isPending || teams.length < 2}
                    onClick={() => console.log("=== CREATE MATCH FORM SUBMIT BUTTON CLICKED ===")}
                  
                  >
                    {createMatchMutation.isPending ? "Creating..." : "Create Match"}
                  </Button>
                  {teams.length < 2 && (
                    <p className="text-sm text-gray-500 text-center">
                      You need at least 2 teams to create a match
                    </p>
                  )}
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team List */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <div className="text-4xl mb-2">👥</div>
              <h3 className="font-semibold mb-2">No Teams Yet</h3>
              <p className="text-sm">Create your first team to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => {
            const stats = getTeamStats(team.id);
            const teamPlayers = getTeamPlayers(team.id);
            
            return (
              <Card key={team.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 cricket-green-100 rounded-full flex items-center justify-center">
                        <span className="text-cricket-green-600 font-bold">
                          {team.shortName}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-500">
                          {teamPlayers.length} players
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="touch-feedback"
                            onClick={() => {
                              setSelectedTeam(team);
                              playerForm.setValue("teamId", team.id);
                            }}
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Player to {selectedTeam?.name}</DialogTitle>
                          </DialogHeader>
                          <Form {...playerForm}>
                            <form onSubmit={playerForm.handleSubmit(onCreatePlayer)} className="space-y-4">
                              <FormField
                                control={playerForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Player Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter player name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={playerForm.control}
                                name="role"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="batsman">Batsman</SelectItem>
                                        <SelectItem value="bowler">Bowler</SelectItem>
                                        <SelectItem value="all-rounder">All-rounder</SelectItem>
                                        <SelectItem value="wicket-keeper">Wicket-keeper</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                className="w-full cricket-green-600 hover:bg-cricket-green-700"
                                disabled={createPlayerMutation.isPending}
                              >
                                {createPlayerMutation.isPending ? "Adding..." : "Add Player"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="outline" className="text-cricket-green-600 touch-feedback">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{stats.matches}</div>
                      <div className="text-xs text-gray-500">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-cricket-green-600">{stats.wins}</div>
                      <div className="text-xs text-gray-500">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-cricket-red">{stats.losses}</div>
                      <div className="text-xs text-gray-500">Losses</div>
                    </div>
                  </div>
                  
                  {/* Key Players */}
                  {teamPlayers.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-2">Players</div>
                      <div className="flex flex-wrap gap-2">
                        {teamPlayers.slice(0, 3).map((player) => (
                          <span key={player.id} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                            {player.name}
                          </span>
                        ))}
                        {teamPlayers.length > 3 && (
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                            +{teamPlayers.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
