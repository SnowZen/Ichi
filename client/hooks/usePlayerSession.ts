import { useState, useEffect } from 'react';

interface PlayerSession {
  playerId: string;
  roomId: string;
  playerName: string;
}

export function usePlayerSession() {
  const [session, setSession] = useState<PlayerSession | null>(null);

  useEffect(() => {
    // Load session from localStorage
    const savedSession = localStorage.getItem('unoPlayerSession');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (err) {
        localStorage.removeItem('unoPlayerSession');
      }
    }
  }, []);

  const saveSession = (playerId: string, roomId: string, playerName: string) => {
    const newSession = { playerId, roomId, playerName };
    setSession(newSession);
    localStorage.setItem('unoPlayerSession', JSON.stringify(newSession));
  };

  const clearSession = () => {
    setSession(null);
    localStorage.removeItem('unoPlayerSession');
  };

  return {
    session,
    saveSession,
    clearSession
  };
}
