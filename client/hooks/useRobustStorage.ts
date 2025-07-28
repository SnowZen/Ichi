import { useCallback } from "react";

interface GameStateData {
  roomId: string;
  playerId: string;
  playerName: string;
  gameData: any;
  timestamp: number;
  checksum: string;
}

export function useRobustStorage() {
  // Generate a simple checksum for data integrity
  const generateChecksum = useCallback((data: any): string => {
    return btoa(JSON.stringify(data)).slice(0, 8);
  }, []);

  // Save to multiple storage locations
  const saveGameState = useCallback(
    (roomId: string, playerId: string, playerName: string, gameData: any) => {
      const stateData: GameStateData = {
        roomId,
        playerId,
        playerName,
        gameData,
        timestamp: Date.now(),
        checksum: generateChecksum(gameData),
      };

      const serialized = JSON.stringify(stateData);

      try {
        // Save to localStorage
        localStorage.setItem(`game_${roomId}`, serialized);
        localStorage.setItem(`player_${playerId}`, serialized);

        // Save to sessionStorage as backup
        sessionStorage.setItem(`game_${roomId}`, serialized);

        // Save to cookie (smaller data, just basics)
        const cookieData = {
          roomId,
          playerId,
          playerName,
          timestamp: stateData.timestamp,
        };
        document.cookie = `game_state=${encodeURIComponent(JSON.stringify(cookieData))}; max-age=86400; path=/`;

        console.log("Game state saved successfully");
      } catch (error) {
        console.warn("Failed to save game state:", error);
      }
    },
    [generateChecksum],
  );

  // Load from any available storage
  const loadGameState = useCallback(
    (roomId: string): GameStateData | null => {
      const sources = [
        () => localStorage.getItem(`game_${roomId}`),
        () => sessionStorage.getItem(`game_${roomId}`),
      ];

      for (const getSource of sources) {
        try {
          const data = getSource();
          if (data) {
            const parsed: GameStateData = JSON.parse(data);

            // Verify data integrity
            if (parsed.checksum === generateChecksum(parsed.gameData)) {
              // Only return data that's less than 24 hours old
              if (Date.now() - parsed.timestamp < 86400000) {
                return parsed;
              }
            }
          }
        } catch (error) {
          console.warn("Failed to parse game state from source:", error);
        }
      }

      return null;
    },
    [generateChecksum],
  );

  // Load player session from cookie
  const loadPlayerSession = useCallback(() => {
    try {
      const cookies = document.cookie.split(";");
      const gameStateCookie = cookies.find((c) =>
        c.trim().startsWith("game_state="),
      );

      if (gameStateCookie) {
        const cookieValue = decodeURIComponent(gameStateCookie.split("=")[1]);
        return JSON.parse(cookieValue);
      }
    } catch (error) {
      console.warn("Failed to load player session from cookie:", error);
    }
    return null;
  }, []);

  // Clear all stored data for a room
  const clearGameState = useCallback((roomId: string) => {
    try {
      localStorage.removeItem(`game_${roomId}`);
      sessionStorage.removeItem(`game_${roomId}`);

      // Clear cookie
      document.cookie = `game_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    } catch (error) {
      console.warn("Failed to clear game state:", error);
    }
  }, []);

  // Send state to server for backup
  const syncWithServer = useCallback(async (roomId: string, gameData: any) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameData,
          timestamp: Date.now(),
        }),
      });

      if (response.ok) {
        console.log("Game state synced with server");
      }
    } catch (error) {
      // Ignore server sync errors
      console.warn("Server sync failed:", error);
    }
  }, []);

  // Restore from server
  const restoreFromServer = useCallback(
    async (roomId: string): Promise<any | null> => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/restore`);

        if (response.ok) {
          const data = await response.json();
          return data.gameData;
        }
      } catch (error) {
        console.warn("Server restore failed:", error);
      }
      return null;
    },
    [],
  );

  return {
    saveGameState,
    loadGameState,
    loadPlayerSession,
    clearGameState,
    syncWithServer,
    restoreFromServer,
  };
}
