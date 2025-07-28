import { useState, useEffect } from "react";
import { SkyjoBoard } from "@/components/skyjo/SkyjoBoard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkyjoPlayer, SkyjoGameRoom } from "@shared/skyjo";

interface SkyjoGameProps {
  room: SkyjoGameRoom;
  currentPlayer: SkyjoPlayer;
  onLeaveRoom?: () => void;
  updateRoom: (room: any) => void;
}

export function SkyjoGame({
  room,
  currentPlayer,
  onLeaveRoom,
  updateRoom,
}: SkyjoGameProps) {
  const [drawnCard, setDrawnCard] = useState<number | null>(null);
  const [isWaitingForAction, setIsWaitingForAction] = useState(false);
  const [isWaitingForDiscardExchange, setIsWaitingForDiscardExchange] = useState(false);

  const isMyTurn = room.currentPlayer === currentPlayer.id;

  const handleCardClick = async (row: number, col: number) => {
    if (!isMyTurn) return;

    try {
      if (isWaitingForDiscardExchange) {
        // Player is exchanging with discard pile
        const response = await fetch(`/api/rooms/${room.id}/skyjo/take-discard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: currentPlayer.id,
            row,
            col,
          }),
        });

        if (response.ok) {
          const updatedRoom = await response.json();
          updateRoom(updatedRoom);
          setIsWaitingForDiscardExchange(false);
        }
      } else if (drawnCard !== null) {
        // Player has drawn a card and needs to decide: exchange or discard+reveal
        // For simplicity, let's assume they want to exchange
        const response = await fetch(`/api/rooms/${room.id}/skyjo/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: currentPlayer.id,
            row,
            col,
          }),
        });

        if (response.ok) {
          const updatedRoom = await response.json();
          updateRoom(updatedRoom);
          setDrawnCard(null);
          setIsWaitingForAction(false);
        }
      } else {
        // Regular card reveal
        const response = await fetch(`/api/rooms/${room.id}/skyjo/reveal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: currentPlayer.id,
            row,
            col,
          }),
        });

        if (response.ok) {
          const updatedRoom = await response.json();
          updateRoom(updatedRoom);
        }
      }
    } catch (error) {
      console.error("Erreur lors du clic sur carte:", error);
    }
  };

  const handleDrawCard = async () => {
    if (!isMyTurn || drawnCard !== null) return;

    try {
      const response = await fetch(`/api/rooms/${room.id}/skyjo/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayer.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        updateRoom(result.room);
        setDrawnCard(result.drawnCard);
        setIsWaitingForAction(true);
      }
    } catch (error) {
      console.error("Erreur lors du piochage:", error);
    }
  };

  const handleTakeFromDiscard = async () => {
    if (!isMyTurn || drawnCard !== null || isWaitingForDiscardExchange) return;

    // Enter discard exchange mode
    setIsWaitingForDiscardExchange(true);
  };

  const handleCancelAction = () => {
    setIsWaitingForDiscardExchange(false);
    setIsWaitingForAction(false);
    setDrawnCard(null);
  };

  const handleDiscardDrawn = async (row: number, col: number) => {
    if (!drawnCard) return;

    try {
      const response = await fetch(`/api/rooms/${room.id}/skyjo/discard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          row,
          col,
        }),
      });

      if (response.ok) {
        const updatedRoom = await response.json();
        updateRoom(updatedRoom);
        setDrawnCard(null);
        setIsWaitingForAction(false);
      }
    } catch (error) {
      console.error("Erreur lors de la défausse:", error);
    }
  };

  // Show drawn card interface
  if (drawnCard !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
        <Card className="p-8 bg-card/90 backdrop-blur-sm border-2 border-primary/20 shadow-2xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Carte piochée</h2>
          <div className="mb-6">
            <div className="w-20 h-28 mx-auto rounded-lg border-2 flex items-center justify-center font-bold text-2xl bg-blue-100 border-blue-400 text-blue-800">
              {drawnCard}
            </div>
          </div>
          <p className="text-muted-foreground mb-6">
            Que voulez-vous faire avec cette carte ?
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                // Let user click on their cards to exchange
                alert("Cliquez sur une de vos cartes pour l'échanger");
              }}
              className="w-full"
            >
              Échanger avec une de mes cartes
            </Button>
            <Button
              onClick={() => {
                // Let user click on their cards to reveal after discarding
                alert("Cliquez sur une de vos cartes cachées pour la révéler");
                setIsWaitingForAction(true);
              }}
              variant="outline"
              className="w-full"
            >
              Défausser et révéler une carte
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <SkyjoBoard
      room={room}
      currentPlayer={currentPlayer}
      onCardClick={handleCardClick}
      onDrawCard={handleDrawCard}
      onTakeFromDiscard={handleTakeFromDiscard}
      onLeaveRoom={onLeaveRoom}
      isWaitingForDiscardExchange={isWaitingForDiscardExchange}
      drawnCard={drawnCard}
    />
  );
}
