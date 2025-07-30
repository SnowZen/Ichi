// client/hooks/useRoomSync.ts
import { useState, useEffect, useCallback } from "react";
import { GameRoom } from "@shared/uno";
import { usePlayerSession } from "./usePlayerSession";

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

  const fetchRoom = useCallback(
    async (isInitialLoad = false) => {
      if (!roomId) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`/api/rooms/${roomId}`, { headers: { "Cache-Control": "no-cache" }, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          // La logique de restauration est maintenant dans GameRoom.tsx
          throw new Error(`Erreur ${response.status}`);
        }
        
        const roomData = await response.json();
        setRoom(roomData);
        setError(null);
        setConsecutiveErrors(0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur de connexion";
        setConsecutiveErrors(prev => prev + 1);
        if (consecutiveErrors + 1 >= 3) setAutoDisablePolling(true);
        if (isInitialLoad) setError(errorMessage);
        else console.warn("Erreur de synchronisation:", errorMessage);
      } finally {
        if (isInitialLoad) setIsLoading(false);
      }
    },
    // CORRECTION : La dépendance est stable, ce qui casse la boucle de GET.
    [roomId] 
  );

  const sendHeartbeat = useCallback(async () => {
    if (!roomId || !session?.playerId) return;
    try { await fetch(`/api/rooms/${roomId}/heartbeat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: session.playerId }) });
    } catch (err) { console.warn("Heartbeat a échoué:", err); }
  }, [roomId, session?.playerId]);

  useEffect(() => { fetchRoom(true); }, [fetchRoom]);

  useEffect(() => {
    if (!roomId || disablePolling || autoDisablePolling) return;
    const interval = setInterval(() => { fetchRoom(false); sendHeartbeat(); }, 5000);
    return () => clearInterval(interval);
  }, [fetchRoom, roomId, sendHeartbeat, disablePolling, autoDisablePolling]);

  const refetch = useCallback(() => {
    setAutoDisablePolling(false);
    setConsecutiveErrors(0);
    setIsLoading(true);
    fetchRoom(true);
  }, [fetchRoom]);

  // On retourne 'setRoom' pour les mises à jour optimistes
  return { room, isLoading, error, refetch, setRoom, isPollingDisabled: autoDisablePolling, consecutiveErrors };
}