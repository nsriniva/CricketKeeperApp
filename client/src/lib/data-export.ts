import type { Team, Player, Match } from "@shared/schema";

export interface AppData {
  teams: Team[];
  players: Player[];
  matches: Match[];
  exportDate: string;
  version: string;
}

export class DataExportManager {
  async exportData(): Promise<AppData> {
    try {
      // Fetch all data from API
      const [teamsResponse, playersResponse, matchesResponse] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/players'),
        fetch('/api/matches')
      ]);

      const teams = await teamsResponse.json();
      const players = await playersResponse.json();
      const matches = await matchesResponse.json();

      return {
        teams,
        players,
        matches,
        exportDate: new Date().toISOString(),
        version: "1.0.0"
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  }

  downloadDataAsFile(data: AppData, filename?: string) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `cricket-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async saveToLocalStorage(data: AppData) {
    try {
      localStorage.setItem('cricket_app_backup', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save to local storage:', error);
      return false;
    }
  }

  loadFromLocalStorage(): AppData | null {
    try {
      const data = localStorage.getItem('cricket_app_backup');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load from local storage:', error);
      return null;
    }
  }

  async importData(data: AppData): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Validate data structure
      if (!data.teams || !data.players || !data.matches) {
        throw new Error('Invalid data format');
      }

      // Clear existing data first (optional - could be made configurable)
      await this.clearAllData();

      // Import teams first
      for (const team of data.teams) {
        try {
          const { id, createdAt, ...teamData } = team;
          await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamData)
          });
        } catch (error) {
          errors.push(`Failed to import team: ${team.name}`);
        }
      }

      // Import players
      for (const player of data.players) {
        try {
          const { id, createdAt, ...playerData } = player;
          await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(playerData)
          });
        } catch (error) {
          errors.push(`Failed to import player: ${player.name}`);
        }
      }

      // Import matches
      for (const match of data.matches) {
        try {
          const { id, createdAt, ...matchData } = match;
          await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchData)
          });
        } catch (error) {
          errors.push(`Failed to import match between ${match.team1Name} and ${match.team2Name}`);
        }
      }

      return { success: errors.length === 0, errors };
    } catch (error) {
      return { success: false, errors: [`Import failed: ${error.message}`] };
    }
  }

  private async clearAllData() {
    // Note: This would require additional API endpoints to clear data
    // For now, we'll rely on manual deletion or restart of the in-memory storage
    console.warn('Data clearing not implemented - imported data will be added to existing data');
  }

  parseImportFile(file: File): Promise<AppData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const dataExportManager = new DataExportManager();