import { useState, useEffect, useCallback } from "react";
import { GameRoom } from "@shared/uno";
import { usePlayerSession } from "./usePlayerSession";
import { useRobustStorage } from "./useRobustStorage";

export function useRoomSync(
  roomId: string | undefined,
  disablePolling = false,
) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [autoDisablePolling, setAutoDisablePolling] = useState(false);
  const { session } = usePlayerSession();
  const { saveGameState, loadGameState, syncWithServer, restoreFromServer } =
    useRobustStorage();

  const fetchRoom = useCallback(
    async (isInitialLoad = false) => {
      if (!roomId) return;

      try {
        // Add timeout for serverless functions
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(`/api/rooms/${roomId}`, {
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            // Only restore from local storage on initial load, not during polling
            if (isInitialLoad) {
              const localData = loadGameState(roomId);
              if (localData) {
                setRoom(localData.gameData);
                setError("Salon restauré depuis la sauvegarde locale");
                setConsecutiveErrors(0);
                return;
              }
            }
            throw new Error("Salon non trouvé");
          }
          if (response.status >= 500) {
            throw new Error("Erreur serveur temporaire");
          }
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const roomData = await response.json();
        setRoom(roomData);
        setError(null);
        setConsecutiveErrors(0); // Reset error count on success

        // Save to local storage only on successful fetch
        if (session && roomData) {
          saveGameState(roomId, session.playerId, session.playerName, roomData);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur de connexion";

        // Increment consecutive errors counter
        setConsecutiveErrors((prev) => {
          const newCount = prev + 1;
          // Disable polling after 3 consecutive errors
          if (newCount >= 3) {
            setAutoDisablePolling(true);
            console.log(
              "Auto-désactivation du polling après 3 échecs consécutifs",
            );
          }
          return newCount;
        });

        // Only set error on initial load
        if (isInitialLoad) {
          // Try local restoration only on first load
          const localData = loadGameState(roomId);
          if (localData) {
            setRoom(localData.gameData);
            setError("Salon restauré depuis la sauvegarde locale");
            return;
          }
          setError(errorMessage);
        } else {
          // For subsequent polls, just log the error but keep existing room data
          console.warn("Erreur de synchronisation:", errorMessage);
          // Don't change the error state during polling to avoid UI flickering
        }
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    },
    [roomId, room],
  );

  const sendHeartbeat = useCallback(async () => {
    if (!roomId || !session?.playerId) return;

    try {
      await fetch(`/api/rooms/${roomId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: session.playerId }),
      });
    } catch (err) {
      // Ignore heartbeat errors
      console.warn("Heartbeat failed:", err);
    }
  }, [roomId, session?.playerId]);

  // Initial fetch
  useEffect(() => {
    fetchRoom(true);
  }, [fetchRoom]);

  // Auto-refresh every 5 seconds for real-time sync (can be disabled)
  useEffect(() => {
    if (!roomId || disablePolling || autoDisablePolling) return;

    const interval = setInterval(() => {
      fetchRoom(false);
      sendHeartbeat(); // Send heartbeat with each poll
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRoom, roomId, sendHeartbeat, disablePolling, autoDisablePolling]);

  const updateRoom = useCallback(
    (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);

      // Auto-save when room updates (debounced to avoid excessive saves)
      if (session && roomId && updatedRoom) {
        saveGameState(
          roomId,
          session.playerId,
          session.playerName,
          updatedRoom,
        );
      }
    },
    [session, roomId, saveGameState],
  );

  const refetch = useCallback(() => {
    setAutoDisablePolling(false); // Re-enable polling on manual refetch
    setConsecutiveErrors(0); // Reset error count
    fetchRoom(true);
  }, [fetchRoom]);

  return {
    room,
    isLoading,
    error,
    refetch,
    updateRoom,
    isPollingDisabled: autoDisablePolling,
    consecutiveErrors,
  };
}
