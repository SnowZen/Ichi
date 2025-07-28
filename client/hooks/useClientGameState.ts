import { useState, useEffect, useCallback } from "react";

interface ClientGameState {
  roomId: string;
  gameData: any;
  lastUpdated: number;
  version: number;
}

export function useClientGameState(roomId: string | undefined) {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    try {
      const saved = localStorage.getItem(`game_state_${roomId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only load if less than 1 hour old
        if (Date.now() - parsed.lastUpdated < 3600000) {
          setGameState(parsed);
        }
      }
    } catch (err) {
      console.warn("Failed to load game state:", err);
    }
    setIsLoading(false);
  }, [roomId]);

  // Save state to localStorage whenever it changes
  const updateGameState = useCallback(
    (newData: any) => {
      if (!roomId) return;

      const newState: ClientGameState = {
        roomId,
        gameData: newData,
        lastUpdated: Date.now(),
        version: (gameState?.version || 0) + 1,
      };

      setGameState(newState);

      try {
        localStorage.setItem(`game_state_${roomId}`, JSON.stringify(newState));
      } catch (err) {
        console.warn("Failed to save game state:", err);
      }
    },
    [roomId, gameState?.version],
  );

  // Clear state
  const clearGameState = useCallback(() => {
    if (!roomId) return;

    setGameState(null);
    try {
      localStorage.removeItem(`game_state_${roomId}`);
    } catch (err) {
      console.warn("Failed to clear game state:", err);
    }
  }, [roomId]);

  // Sync with server (optional, for validation)
  const syncWithServer = useCallback(async () => {
    if (!roomId || !gameState) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: gameState.version,
          gameData: gameState.gameData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.needsUpdate) {
          updateGameState(result.gameData);
        }
      }
    } catch (err) {
      // Ignore sync errors
      console.warn("Sync failed:", err);
    }
  }, [roomId, gameState, updateGameState]);

  return {
    gameState: gameState?.gameData || null,
    isLoading,
    error,
    updateGameState,
    clearGameState,
    syncWithServer,
  };
}
