import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SkyjoBoard } from "@/components/skyjo/SkyjoBoard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSkyjoGame } from "@/hooks/useSkyjoGame";
import { usePlayerSession } from "@/hooks/usePlayerSession";

export function SkyjoOfflineGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { session, clearSession } = usePlayerSession();
  const skyjoGame = useSkyjoGame();
  
  const [drawnCard, setDrawnCard] = useState<number | null>(null);
  const [isWaitingForDiscardExchange, setIsWaitingForDiscardExchange] = useState(false);

  // Try to join/restore room on mount
  useEffect(() => {
    if (!roomId || !session) return;

    if (!skyjoGame.room) {
      // Try to join existing room or create if host
      skyjoGame.joinRoom(roomId, session.playerName);
    }
  }, [roomId, session, skyjoGame]);

  if (!session || !roomId) {
    navigate("/");
    return null;
  }

  if (!skyjoGame.room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
        <Card className="p-8 bg-card/90 backdrop-blur-sm border-2 border-primary/20 shadow-2xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Salon introuvable</h2>
          <p className="text-muted-foreground mb-6">
            Ce salon n'existe pas ou a expiré.
          </p>
          <Button onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const currentPlayer = skyjoGame.room.players.find(p => p.id === session.playerId);
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
        <Card className="p-8 bg-card/90 backdrop-blur-sm border-2 border-primary/20 shadow-2xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Reconnexion...</h2>
          <p className="text-muted-foreground mb-6">
            Tentative de reconnexion au jeu...
          </p>
          <Button onClick={() => skyjoGame.joinRoom(roomId, session.playerName)}>
            Rejoindre
          </Button>
        </Card>
      </div>
    );
  }

  const isMyTurn = skyjoGame.room.currentPlayer === currentPlayer.id;

  // Show lobby if game hasn't started
  if (!skyjoGame.room.isStarted) {
    const isHost = skyjoGame.room.players[0].id === currentPlayer.id;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
        <Card className="p-8 bg-card/90 backdrop-blur-sm border-2 border-primary/20 shadow-2xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Salon Skyjo</h2>
          <p className="text-muted-foreground mb-4">
            Code: <span className="font-mono font-bold">{roomId}</span>
          </p>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Joueurs ({skyjoGame.room.players.length}/{skyjoGame.room.maxPlayers})</h3>
            <div className="space-y-1">
              {skyjoGame.room.players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-center gap-2">
                  {index === 0 && <span className="text-yellow-500">👑</span>}
                  <span>{player.name}</span>
                  {player.id === currentPlayer.id && <span className="text-sm text-muted-foreground">(vous)</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {isHost && skyjoGame.room.players.length >= 2 && (
              <Button onClick={skyjoGame.startGame} className="w-full">
                Commencer la partie
              </Button>
            )}
            
            {!isHost && (
              <p className="text-sm text-muted-foreground">
                En attente que l'hôte démarre la partie...
              </p>
            )}

            <Button 
              variant="outline" 
              onClick={() => {
                skyjoGame.leaveRoom(currentPlayer.id);
                clearSession();
                navigate("/");
              }}
            >
              Quitter le salon
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleCardClick = (row: number, col: number) => {
    if (!isMyTurn) return;

    if (isWaitingForDiscardExchange) {
      skyjoGame.takeFromDiscard(currentPlayer.id, row, col);
      setIsWaitingForDiscardExchange(false);
    } else if (drawnCard !== null) {
      skyjoGame.exchangeCard(currentPlayer.id, row, col, drawnCard);
      setDrawnCard(null);
    } else {
      skyjoGame.revealCard(currentPlayer.id, row, col);
    }
  };

  const handleDrawCard = () => {
    if (!isMyTurn || drawnCard !== null) return;
    const drawn = skyjoGame.drawCard(currentPlayer.id);
    if (drawn !== null) {
      setDrawnCard(drawn);
    }
  };

  const handleTakeFromDiscard = () => {
    if (!isMyTurn || drawnCard !== null) return;
    setIsWaitingForDiscardExchange(true);
  };

  const handleCancelAction = () => {
    setIsWaitingForDiscardExchange(false);
    setDrawnCard(null);
  };

  const handleLeaveRoom = () => {
    skyjoGame.leaveRoom(currentPlayer.id);
    clearSession();
    navigate("/");
  };

  return (
    <SkyjoBoard
      room={skyjoGame.room}
      currentPlayer={currentPlayer}
      onCardClick={handleCardClick}
      onDrawCard={handleDrawCard}
      onTakeFromDiscard={handleTakeFromDiscard}
      onLeaveRoom={handleLeaveRoom}
      onCancelAction={handleCancelAction}
      isWaitingForDiscardExchange={isWaitingForDiscardExchange}
      drawnCard={drawnCard}
    />
  );
}
