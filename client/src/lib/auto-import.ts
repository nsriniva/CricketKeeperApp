import { apiRequest } from "./queryClient";
import type { InsertTeam, InsertPlayer, InsertMatch } from "@shared/schema";

interface AutoImportData {
  teams: InsertTeam[];
  players: InsertPlayer[];
  matches: InsertMatch[];
}

const DEFAULT_DATA: AutoImportData = {
  teams: [
    {
      name: "Mumbai Indians",
      shortName: "MI",
      players: [],
      matches: 0,
      wins: 0,
      losses: 0,
    },
    {
      name: "Chennai Super Kings",
      shortName: "CSK",
      players: [],
      matches: 0,
      wins: 0,
      losses: 0,
    },
    {
      name: "Royal Challengers Bangalore",
      shortName: "RCB",
      players: [],
      matches: 0,
      wins: 0,
      losses: 0,
    },
    {
      name: "Kolkata Knight Riders",
      shortName: "KKR",
      players: [],
      matches: 0,
      wins: 0,
      losses: 0,
    },
  ],
  players: [],
  matches: [],
};

export async function checkAndImportData(): Promise<boolean> {
  try {
    // Check if data already exists
    const [teamsResponse, playersResponse, matchesResponse] = await Promise.all([
      apiRequest("GET", "/api/teams"),
      apiRequest("GET", "/api/players"),
      apiRequest("GET", "/api/matches"),
    ]);

    const teams = await teamsResponse.json();
    const players = await playersResponse.json();
    const matches = await matchesResponse.json();

    // If we already have data, don't import
    if (teams.length > 0 || players.length > 0 || matches.length > 0) {
      console.log("Data already exists, skipping auto-import");
      return false;
    }

    // Check for local data in localStorage
    const localData = getLocalData();
    const dataToImport = localData || DEFAULT_DATA;

    // Import teams first
    const createdTeams = [];
    for (const team of dataToImport.teams) {
      try {
        const response = await apiRequest("POST", "/api/teams", team);
        const createdTeam = await response.json();
        createdTeams.push(createdTeam);
        console.log(`Imported team: ${team.name}`);
      } catch (error) {
        console.error(`Failed to import team ${team.name}:`, error);
      }
    }

    // Import players with team assignments
    for (const player of dataToImport.players) {
      try {
        await apiRequest("POST", "/api/players", player);
        console.log(`Imported player: ${player.name}`);
      } catch (error) {
        console.error(`Failed to import player ${player.name}:`, error);
      }
    }

    // Import matches
    for (const match of dataToImport.matches) {
      try {
        await apiRequest("POST", "/api/matches", match);
        console.log(`Imported match: ${match.team1Name} vs ${match.team2Name}`);
      } catch (error) {
        console.error(`Failed to import match:`, error);
      }
    }

    console.log("Auto-import completed successfully");
    return true;
  } catch (error) {
    console.error("Auto-import failed:", error);
    return false;
  }
}

function getLocalData(): AutoImportData | null {
  try {
    const stored = localStorage.getItem("cricketpro-data");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to parse local data:", error);
  }
  return null;
}

export function saveLocalData(data: AutoImportData): void {
  try {
    localStorage.setItem("cricketpro-data", JSON.stringify(data));
    console.log("Data saved to local storage");
  } catch (error) {
    console.error("Failed to save data to local storage:", error);
  }
}

export function exportCurrentData(): Promise<AutoImportData> {
  return new Promise(async (resolve, reject) => {
    try {
      const [teamsResponse, playersResponse, matchesResponse] = await Promise.all([
        apiRequest("GET", "/api/teams"),
        apiRequest("GET", "/api/players"),
        apiRequest("GET", "/api/matches"),
      ]);

      const teams = await teamsResponse.json();
      const players = await playersResponse.json();
      const matches = await matchesResponse.json();

      const exportData: AutoImportData = {
        teams: teams.map((team: any) => ({
          name: team.name,
          shortName: team.shortName,
          players: team.players || [],
          matches: team.matches || 0,
          wins: team.wins || 0,
          losses: team.losses || 0,
        })),
        players: players.map((player: any) => ({
          name: player.name,
          role: player.role,
          teamId: player.teamId,
          matches: player.matches || 0,
          runs: player.runs || 0,
          ballsFaced: player.ballsFaced || 0,
          fours: player.fours || 0,
          sixes: player.sixes || 0,
          fifties: player.fifties || 0,
          hundreds: player.hundreds || 0,
          highScore: player.highScore || 0,
          wickets: player.wickets || 0,
          ballsBowled: player.ballsBowled || 0,
          runsConceded: player.runsConceded || 0,
          maidens: player.maidens || 0,
          bestBowling: player.bestBowling || "0/0",
        })),
        matches: matches.map((match: any) => ({
          team1Id: match.team1Id,
          team2Id: match.team2Id,
          team1Name: match.team1Name,
          team2Name: match.team2Name,
          format: match.format,
          venue: match.venue || "",
          status: match.status || "not_started",
          battingTeam: match.battingTeam,
          bowlingTeam: match.bowlingTeam,
          team1Score: match.team1Score || 0,
          team1Wickets: match.team1Wickets || 0,
          team1Overs: match.team1Overs || 0,
          team2Score: match.team2Score || 0,
          team2Wickets: match.team2Wickets || 0,
          team2Overs: match.team2Overs || 0,
          winner: match.winner,
          result: match.result,
          currentInnings: match.currentInnings || 1,
          currentBatsman1: match.currentBatsman1,
          currentBatsman2: match.currentBatsman2,
          currentBowler: match.currentBowler,
          onStrike: match.onStrike,
          ballByBall: match.ballByBall || [],
          playerStats: match.playerStats || {},
        })),
      };

      resolve(exportData);
    } catch (error) {
      reject(error);
    }
  });
}