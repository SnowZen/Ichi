// client/pages/GameRoom.tsx

import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { useGameWebSocket } from "@/hooks/useGameWebSocket"; // Le nouveau hook WebSocket
import { GameRouter } from "@/components/games/GameRouter";
import { RoomLobby } from "@/components/uno/RoomLobby";
import { ColorPicker } from "@/components/uno/ColorPicker";
import { GameOver } from "@/components/uno/GameOver";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { Player, UnoCard, UnoColor } from "@shared/uno";

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { session, clearSession } = usePlayerSession();

  // Utilisation du hook WebSocket pour l'état de la room et la communication
  const { room, isConnected, sendMessage } = useGameWebSocket(roomId, session?.playerId);

  // États locaux pour l'UI
  const [selectedCard, setSelectedCard] = useState<string | undefined>();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);

  // Données dérivées et mémoïsées pour optimiser les rendus
  const currentPlayer = useMemo(() => room?.players.find((p) => p.id === session?.playerId) || null, [room?.players, session?.playerId]);
  const isHost = useMemo(() => room?.players?.[0]?.id === session?.playerId, [room?.players, session?.playerId]);

  const playableCards = useMemo(() => {
    if (!room || !currentPlayer || !room.isStarted || !room.topCard) return [];
    if (room.drawPenalty && room.drawPenalty > 0) {
      return currentPlayer.cards.filter((card: UnoCard) => (room.topCard?.type === "draw2" && (card.type === "draw2" || card.type === "wild_draw4")) || (room.topCard?.type === "wild_draw4" && card.type === "wild_draw4")).map((card: UnoCard) => card.id);
    }
    return currentPlayer.cards.filter((card: UnoCard) => {
      if (card.color === "wild") return true;
      const top = room.topCard!;
      const effectiveColor = top.color === "wild" ? room.wildColor : top.color;
      if (card.color === effectiveColor) return true;
      if (card.type === "number" && top.type === "number" && card.value === top.value) return true;
      if (card.type === top.type && card.type !== "number" && top.color !== "wild") return true;
      return false;
    }).map((card: UnoCard) => card.id);
  }, [room, currentPlayer]);

  // --- GESTIONNAIRES D'ÉVÉNEMENTS : ENVOIENT DES MESSAGES WEBSOCKET ---
  const handleStartGame = () => sendMessage({ type: 'START_GAME' });
  const handleReturnToLobby = () => sendMessage({ type: 'RESTART_GAME' });
  const handleGameSelect = (gameType: 'uno' | 'skyjo') => sendMessage({ type: 'CHANGE_GAME', payload: { gameType } });
  const handleDrawCard = () => sendMessage({ type: 'DRAW_CARD' });
  const handleCallUno = () => sendMessage({ type: 'CALL_UNO' });
  const handleChallengeUno = (challengedPlayerId: string) => sendMessage({ type: 'CHALLENGE_UNO', payload: { challengedPlayerId } });
  
  const handleLeaveRoom = () => {
    sendMessage({ type: 'LEAVE_GAME' });
    clearSession();
    navigate("/");
  };
  
  const handleCardPlay = (card: UnoCard, wildColor?: UnoColor) => {
    if (!playableCards.includes(card.id)) return;
    if ((card.type === "wild" || card.type === "wild_draw4") && !wildColor) {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }
    sendMessage({
      type: 'PLAY_CARD',
      payload: { cardId: card.id, wildColor },
    });
    setPendingWildCard(null);
    setShowColorPicker(false);
    setSelectedCard(undefined);
  };

  const handleColorSelect = (color: UnoColor) => {
    if (pendingWildCard) handleCardPlay(pendingWildCard, color);
  };

  const handleColorCancel = () => {
    setPendingWildCard(null);
    setShowColorPicker(false);
    setSelectedCard(undefined);
  };

  useEffect(() => {
    if (!session?.playerId) navigate("/");
  }, [session, navigate]);

  // --- AFFICHAGE ---
  if (!isConnected && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Connexion au salon en temps réel...</p>
        </div>
      </div>
    );
  }

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Erreur de Synchronisation</h2>
          <p className="text-muted-foreground mb-4">Impossible de récupérer les données du salon. Veuillez retourner à l'accueil.</p>
          <button onClick={() => navigate("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  if (!room.isStarted) {
    return <RoomLobby room={room} currentPlayerId={currentPlayer.id} onStartGame={handleStartGame} onLeaveRoom={handleLeaveRoom} onGameSelect={handleGameSelect} isHost={isHost} />;
  }

  if (room.isFinished) {
    return <GameOver room={room} currentPlayer={currentPlayer} onReturnToLy={handleReturnToLobby} />;
  }

  return (
    <>
      <ConnectionStatus isConnected={isConnected} />
      <GameRouter
        room={room}
        currentPlayer={currentPlayer}
        onCardPlay={handleCardPlay}
        onDrawCard={handleDrawCard}
        onCallUno={handleCallUno}
        onChallengeUno={handleChallengeUno}
        onLeaveRoom={handleLeaveRoom}
        updateRoom={() => {}} // Prop obsolète, mais gardée pour la compatibilité
        selectedCard={selectedCard}
        onCardSelect={setSelectedCard}
        playableCards={playableCards}
        hasConnectionIssues={!isConnected}
      />
      {showColorPicker && <ColorPicker onColorSelect={handleColorSelect} onCancel={handleColorCancel} />}
    </>
  );
}