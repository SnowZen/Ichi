import { useState, useEffect, useCallback } from "react";
import { GameRoom } from "@shared/uno";
import { usePlayerSession } from "./usePlayerSession";
import { useRobustStorage } from "./useRobustStorage";

export function useRoomSync(roomId: string | undefined) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = usePlayerSession();
  const { saveGameState, loadGameState, syncWithServer, restoreFromServer } = useRobustStorage();

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
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur de connexion";

        // Only set error on initial load or if we had a successful connection before
        if (isInitialLoad || !room) {
          setError(errorMessage);
        } else {
          // For subsequent polls, just log the error but don't break the UI
          console.warn("Erreur de synchronisation:", errorMessage);
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

  // Auto-refresh every 5 seconds for real-time sync (reduced frequency for serverless stability)
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      fetchRoom(false);
      sendHeartbeat(); // Send heartbeat with each poll
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRoom, roomId, sendHeartbeat]);

  const updateRoom = useCallback((updatedRoom: GameRoom) => {
    setRoom(updatedRoom);
  }, []);

  return {
    room,
    isLoading,
    error,
    refetch: () => fetchRoom(true),
    updateRoom,
  };
}
