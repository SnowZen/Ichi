// client/hooks/useGameWebSocket.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameRoom } from '@shared/uno';

export function useGameWebSocket(roomId: string | undefined, playerId: string | undefined) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId || !playerId) return;

    // Déterminer le protocole (ws ou wss pour la production)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/rooms/${roomId}/connect?playerId=${playerId}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connecté');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const roomData = JSON.parse(event.data);
      setRoom(roomData);
    };

    ws.onclose = () => {
      console.log('WebSocket déconnecté');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      setIsConnected(false);
    };

    // Nettoyer la connexion quand le composant est démonté
    return () => {
      ws.close();
    };
  }, [roomId, playerId]);

  const sendMessage = useCallback((message: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket non connecté, impossible d\'envoyer le message.');
    }
  }, []);

  return { room, isConnected, sendMessage };
}