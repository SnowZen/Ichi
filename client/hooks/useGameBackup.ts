// client/hooks/useGameBackup.ts
import { useEffect } from "react";
import { useDebounce } from "./useDebounce";

export function useGameBackup(roomId: string | undefined, gameData: any) {
  const debouncedGameData = useDebounce(gameData, 500);

  useEffect(() => {
    if (!roomId || !debouncedGameData) return;
    try {
      const backup = {
        roomId,
        gameData: debouncedGameData,
        timestamp: Date.now(),
      };
      console.log("Game state saved to localStorage (debounced).");
      localStorage.setItem(`game_backup_${roomId}`, JSON.stringify(backup));
    } catch (err) {
      console.warn("Failed to save game backup:", err);
    }
  }, [roomId, debouncedGameData]);

  const restoreGame = (roomId: string) => {
    // ... votre logique de restore ...
    return null;
  };
  const clearBackup = (roomId: string) => {
    // ... votre logique de clear ...
  };
  return { restoreGame, clearBackup };
}