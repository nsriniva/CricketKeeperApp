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
    // First, always check for local storage data - this takes priority
    const localData = getLocalData();
    
    if (localData) {
      console.log("Found local storage data, checking if it needs to be imported...");
      
      // Check if server data matches local storage data
      const serverDataMatches = await isServerDataSameAsLocal(localData);
      
      if (!serverDataMatches) {
        console.log("Local storage data differs from server, clearing server and importing local data...");
        await clearServerData();
        await importData(localData);
        console.log("Local storage data imported successfully");
        return true;
      } else {
        console.log("Server data matches local storage, no import needed");
        return false;
      }
    }

    // No local storage data, check if server has any data
    const [teamsResponse, playersResponse, matchesResponse] = await Promise.all([
      apiRequest("GET", "/api/teams"),
      apiRequest("GET", "/api/players"),
      apiRequest("GET", "/api/matches"),
    ]);

    const teams = await teamsResponse.json();
    const players = await playersResponse.json();
    const matches = await matchesResponse.json();

    // If we already have data, don't import defaults
    if (teams.length > 0 || players.length > 0 || matches.length > 0) {
      console.log("Server has data and no local storage override, keeping existing data");
      return false;
    }

    // No data anywhere, import defaults
    console.log("No data found anywhere, importing default teams...");
    await importData(DEFAULT_DATA);
    console.log("Default data imported successfully");
    return true;
  } catch (error) {
    console.error("Auto-import failed:", error);
    return false;
  }
}

async function isServerDataSameAsLocal(localData: AutoImportData): Promise<boolean> {
  try {
    const [teamsResponse, playersResponse, matchesResponse] = await Promise.all([
      apiRequest("GET", "/api/teams"),
      apiRequest("GET", "/api/players"),
      apiRequest("GET", "/api/matches"),
    ]);

    const serverTeams = await teamsResponse.json();
    const serverPlayers = await playersResponse.json();
    const serverMatches = await matchesResponse.json();

    // Simple comparison - if counts differ, data is different
    if (serverTeams.length !== localData.teams.length ||
        serverPlayers.length !== localData.players.length ||
        serverMatches.length !== localData.matches.length) {
      return false;
    }

    // Check if team names match (basic comparison)
    const serverTeamNames = new Set(serverTeams.map((t: any) => t.name));
    const localTeamNames = new Set(localData.teams.map(t => t.name));
    
    for (const name of localTeamNames) {
      if (!serverTeamNames.has(name)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error comparing server and local data:", error);
    return false;
  }
}

async function clearServerData(): Promise<void> {
  try {
    // Get all data first
    const [teamsResponse, playersResponse, matchesResponse] = await Promise.all([
      apiRequest("GET", "/api/teams"),
      apiRequest("GET", "/api/players"),
      apiRequest("GET", "/api/matches"),
    ]);

    const teams = await teamsResponse.json();
    const players = await playersResponse.json();
    const matches = await matchesResponse.json();

    // Delete all matches first
    for (const match of matches) {
      try {
        await apiRequest("DELETE", `/api/matches/${match.id}`);
      } catch (error) {
        console.error(`Failed to delete match ${match.id}:`, error);
      }
    }

    // Delete all players
    for (const player of players) {
      try {
        await apiRequest("DELETE", `/api/players/${player.id}`);
      } catch (error) {
        console.error(`Failed to delete player ${player.id}:`, error);
      }
    }

    // Delete all teams
    for (const team of teams) {
      try {
        await apiRequest("DELETE", `/api/teams/${team.id}`);
      } catch (error) {
        console.error(`Failed to delete team ${team.id}:`, error);
      }
    }

    console.log("Server data cleared successfully");
  } catch (error) {
    console.error("Failed to clear server data:", error);
    throw error;
  }
}

async function importData(dataToImport: AutoImportData): Promise<void> {
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

export function clearLocalData(): void {
  try {
    localStorage.removeItem("cricketpro-data");
    console.log("Local storage data cleared");
  } catch (error) {
    console.error("Failed to clear local storage data:", error);
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