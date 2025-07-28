import { useState, useEffect, useCallback } from "react";
import { GameRoom } from "@shared/uno";

export function useRoomSync(roomId: string | undefined) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = useCallback(
    async (isInitialLoad = false) => {
      if (!roomId) return;

      try {
        const response = await fetch(`/api/rooms/${roomId}`, {
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Salon non trouvé");
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

  // Initial fetch
  useEffect(() => {
    fetchRoom(true);
  }, [fetchRoom]);

  // Auto-refresh every 5 seconds for real-time sync (reduced frequency for serverless stability)
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      fetchRoom(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRoom, roomId]);

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
