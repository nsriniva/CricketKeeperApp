import { type Team, type InsertTeam, type Player, type InsertPlayer, type Match, type InsertMatch } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;

  // Players
  getPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayersByTeam(teamId: string): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, player: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(id: string): Promise<boolean>;

  // Matches
  getMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match | undefined>;
  getMatchesByTeam(teamId: string): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: string, match: Partial<Match>): Promise<Match | undefined>;
  deleteMatch(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private teams: Map<string, Team>;
  private players: Map<string, Player>;
  private matches: Map<string, Match>;

  constructor() {
    this.teams = new Map();
    this.players = new Map();
    this.matches = new Map();
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = { 
      ...insertTeam, 
      id, 
      createdAt: new Date(),
      matches: 0,
      wins: 0,
      losses: 0,
      players: []
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }

  // Players
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.teamId === teamId);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      ...insertPlayer, 
      id, 
      createdAt: new Date(),
      matches: 0,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      fifties: 0,
      hundreds: 0,
      highScore: 0,
      wickets: 0,
      ballsBowled: 0,
      runsConceded: 0,
      maidens: 0,
      bestBowling: "0/0",
      teamId: insertPlayer.teamId || null
    };
    this.players.set(id, player);

    // Update the team's players array
    if (player.teamId) {
      const team = this.teams.get(player.teamId);
      if (team) {
        const updatedPlayers = [...(team.players || []), id];
        this.teams.set(player.teamId, { ...team, players: updatedPlayers });
      }
    }

    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async deletePlayer(id: string): Promise<boolean> {
    return this.players.delete(id);
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    return Array.from(this.matches.values()).sort((a, b) => 
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }

  async getMatch(id: string): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatchesByTeam(teamId: string): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      match => match.team1Id === teamId || match.team2Id === teamId
    );
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = randomUUID();
    const match: Match = { 
      ...insertMatch, 
      id, 
      createdAt: new Date(),
      date: new Date(),
      status: "not_started",
      team1Score: 0,
      team1Wickets: 0,
      team1Overs: 0,
      team2Score: 0,
      team2Wickets: 0,
      team2Overs: 0,
      currentInnings: 1,
      ballByBall: [],
      playerStats: {},
      venue: insertMatch.venue || null,
      tossWinner: insertMatch.tossWinner || null,
      tossDecision: insertMatch.tossDecision || null,
      winner: null,
      result: null,
      battingTeam: null,
      bowlingTeam: null,
      currentBatsman1: null,
      currentBatsman2: null,
      currentBowler: null,
      onStrike: null
    };
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...updates };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async deleteMatch(id: string): Promise<boolean> {
    return this.matches.delete(id);
  }
}

export const storage = new MemStorage();
