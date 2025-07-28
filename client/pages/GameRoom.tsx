import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameRouter } from "@/components/games/GameRouter";
import { RoomLobby } from "@/components/uno/RoomLobby";
import { ColorPicker } from "@/components/uno/ColorPicker";
import { GameOver } from "@/components/uno/GameOver";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { Player, UnoCard, UnoColor } from "@shared/uno";
import { useRoomSync } from "@/hooks/useRoomSync";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { useGameBackup } from "@/hooks/useGameBackup";

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { session, clearSession } = usePlayerSession();
  const { room, isLoading, error, updateRoom, refetch } = useRoomSync(roomId, manualMode);
  const { restoreGame, clearBackup } = useGameBackup(roomId, room);
  const [selectedCard, setSelectedCard] = useState<string | undefined>();
  const [playableCards, setPlayableCards] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  const [connectionFailures, setConnectionFailures] = useState(0);
  const [manualMode, setManualMode] = useState(false);

  // Find current player based on session
  const currentPlayer =
    room?.players.find((p) => p.id === session?.playerId) || null;
  const isHost = room?.players.length
    ? room.players[0].id === session?.playerId
    : false;

  // Calculate playable cards when room updates
  useEffect(() => {
    if (!room || !currentPlayer || !room.isStarted || !room.topCard) {
      setPlayableCards([]);
      return;
    }

    // If there's a draw penalty, player can only play specific counter cards
    if (room.drawPenalty && room.drawPenalty > 0) {
      const playable = currentPlayer.cards
        .filter((card) => {
          // If last card was +2, only +2 and +4 can counter
          if (room.topCard?.type === "draw2") {
            return card.type === "draw2" || card.type === "wild_draw4";
          }
          // If last card was +4, only +4 can counter
          if (room.topCard?.type === "wild_draw4") {
            return card.type === "wild_draw4";
          }
          return false;
        })
        .map((card) => card.id);
      setPlayableCards(playable);
      return;
    }

    // Normal playable card logic
    const playable = currentPlayer.cards
      .filter((card) => {
        // Wild cards can always be played
        if (card.color === "wild") return true;

        // If top card is wild, use the chosen wild color
        const effectiveColor =
          room.topCard!.color === "wild" ? room.wildColor : room.topCard!.color;

        // Match color (including wild color)
        if (card.color === effectiveColor) return true;

        // Match number/type
        if (card.type === "number" && room.topCard!.type === "number") {
          return card.value === room.topCard!.value;
        }

        // Match action type (but not for wild cards)
        if (
          card.type === room.topCard!.type &&
          card.type !== "number" &&
          room.topCard!.color !== "wild"
        )
          return true;

        return false;
      })
      .map((card) => card.id);

    setPlayableCards(playable);
  }, [room, currentPlayer]);

  // Redirect if no session
  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/");
    }
  }, [session, isLoading, navigate]);

  // Track connection failures (only count real connection errors, not local restoration messages)
  useEffect(() => {
    if (error && !error.includes("restauré") && !error.includes("sauvegarde")) {
      setConnectionFailures((prev) => {
        const newCount = prev + 1;
        // Activate manual mode after 5 failures
        if (newCount >= 5 && !manualMode) {
          setManualMode(true);
          console.log("Mode manuel activé automatiquement après échecs répétés");
        }
        return newCount;
      });
    } else if (room && !error) {
      setConnectionFailures(0);
    }
  }, [error, room, manualMode]);

  const handleStartGame = async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: "POST",
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        updateRoom(updatedRoom);
      }
    } catch (error) {
      console.error("Erreur lors du démarrage de la partie:", error);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !currentPlayer) return;

    try {
      await fetch(`/api/rooms/${roomId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayer.id,
        }),
      });
    } catch (error) {
      console.error("Erreur lors de la sortie de la partie:", error);
    } finally {
      clearSession();
      navigate("/");
    }
  };

  const handleCardPlay = async (card: UnoCard, wildColor?: UnoColor) => {
    if (
      !room ||
      !currentPlayer ||
      room.currentPlayer !== currentPlayer.id ||
      !playableCards.includes(card.id)
    ) {
      return;
    }

    // If it's a wild card and no color is provided, show color picker
    if ((card.type === "wild" || card.type === "wild_draw4") && !wildColor) {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          cardId: card.id,
          wildColor: wildColor,
        }),
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        updateRoom(updatedRoom);
        setSelectedCard(undefined);
        setPendingWildCard(null);
        setShowColorPicker(false);
      }
    } catch (error) {
      console.error("Erreur lors du jeu de carte:", error);
    }
  };

  const handleColorSelect = (color: UnoColor) => {
    if (pendingWildCard) {
      handleCardPlay(pendingWildCard, color);
    }
  };

  const handleColorCancel = () => {
    setShowColorPicker(false);
    setPendingWildCard(null);
    setSelectedCard(undefined);
  };

  const handleDrawCard = async () => {
    if (!room || !currentPlayer || room.currentPlayer !== currentPlayer.id)
      return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayer.id,
        }),
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        updateRoom(updatedRoom);
      }
    } catch (error) {
      console.error("Erreur lors du piochage:", error);
    }
  };

  const handleCallUno = async () => {
    if (!room || !currentPlayer) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/uno`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayer.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.room) {
          updateRoom(result.room);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'appel UNO:", error);
    }
  };

  const handleChallengeUno = async (challengedPlayerId: string) => {
    if (!room || !currentPlayer) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengerId: currentPlayer.id,
          challengedPlayerId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.room) {
          updateRoom(result.room);
        }
      }
    } catch (error) {
      console.error("Erreur lors du défi UNO:", error);
    }
  };

  const handleReturnToLobby = async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/restart`, {
        method: "POST",
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        updateRoom(updatedRoom);
      }
    } catch (error) {
      console.error("Erreur lors du retour au lobby:", error);
    }
  };

  const handleGameSelect = async (gameType: any) => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/change-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameType }),
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        updateRoom(updatedRoom);
      }
    } catch (error) {
      console.error("Erreur lors du changement de jeu:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du salon...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Erreur</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Salon introuvable
          </h2>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!room.isStarted) {
    return (
      <RoomLobby
        room={room}
        currentPlayerId={currentPlayer.id}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        onGameSelect={handleGameSelect}
        isHost={isHost}
      />
    );
  }

  if (room.isFinished) {
    return (
      <GameOver
        room={room}
        currentPlayer={currentPlayer}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  return (
    <>
      <ConnectionStatus isConnected={!error} lastError={error} />

      <GameRouter
        room={room}
        currentPlayer={currentPlayer}
        onCardPlay={handleCardPlay}
        onDrawCard={handleDrawCard}
        onCallUno={handleCallUno}
        onChallengeUno={handleChallengeUno}
        onLeaveRoom={handleLeaveRoom}
        updateRoom={updateRoom}
        selectedCard={selectedCard}
        onCardSelect={setSelectedCard}
        playableCards={playableCards}
        hasConnectionIssues={connectionFailures >= 3}
      />

      {showColorPicker && (
        <ColorPicker
          onColorSelect={handleColorSelect}
          onCancel={handleColorCancel}
        />
      )}
    </>
  );
}
