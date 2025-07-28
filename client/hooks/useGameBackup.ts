import { useEffect } from "react";

export function useGameBackup(roomId: string | undefined, gameData: any) {
  // Save game state to localStorage
  useEffect(() => {
    if (!roomId || !gameData) return;

    try {
      const backup = {
        roomId,
        gameData,
        timestamp: Date.now(),
      };
      localStorage.setItem(`game_backup_${roomId}`, JSON.stringify(backup));
    } catch (err) {
      console.warn("Failed to save game backup:", err);
    }
  }, [roomId, gameData]);

  // Function to restore game state
  const restoreGame = (roomId: string) => {
    try {
      const backup = localStorage.getItem(`game_backup_${roomId}`);
      if (backup) {
        const parsed = JSON.parse(backup);
        // Only restore if backup is less than 1 hour old
        if (Date.now() - parsed.timestamp < 3600000) {
          return parsed.gameData;
        }
      }
    } catch (err) {
      console.warn("Failed to restore game backup:", err);
    }
    return null;
  };

  // Function to clear backup
  const clearBackup = (roomId: string) => {
    try {
      localStorage.removeItem(`game_backup_${roomId}`);
    } catch (err) {
      console.warn("Failed to clear game backup:", err);
    }
  };

  return {
    restoreGame,
    clearBackup,
  };
}
