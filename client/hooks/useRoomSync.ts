import { useState, useEffect, useCallback } from 'react';
import { GameRoom } from '@shared/uno';

export function useRoomSync(roomId: string | undefined) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error('Salon non trouvé');
      }
      const roomData = await response.json();
      setRoom(roomData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Initial fetch
  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // Auto-refresh every 2 seconds for real-time sync
  useEffect(() => {
    if (!roomId) return;

    const interval = setInterval(() => {
      fetchRoom();
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchRoom, roomId]);

  const updateRoom = useCallback((updatedRoom: GameRoom) => {
    setRoom(updatedRoom);
  }, []);

  return {
    room,
    isLoading,
    error,
    refetch: fetchRoom,
    updateRoom
  };
}
