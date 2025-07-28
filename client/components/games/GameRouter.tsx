import { GameBoard } from "@/components/uno/GameBoard";
import { SkyjoGame } from "@/pages/SkyjoGame";
import { SkyjoOfflineGame } from "@/pages/SkyjoOfflineGame";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player, UnoCard, GameRoom } from "@shared/uno";
import { SkyjoPlayer, SkyjoGameRoom } from "@shared/skyjo";

interface GameRouterProps {
  room: GameRoom;
  currentPlayer: Player;
  onCardPlay: (card: UnoCard) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onChallengeUno?: (playerId: string) => void;
  onLeaveRoom?: () => void;
  updateRoom?: (room: any) => void;
  selectedCard?: string;
  onCardSelect?: (cardId: string) => void;
  playableCards?: string[];
  hasConnectionIssues?: boolean;
}

export function GameRouter(props: GameRouterProps) {
  const { room, currentPlayer, onLeaveRoom, updateRoom } = props;

  if (room.gameType === "uno") {
    return <GameBoard {...props} />;
  }

  if (room.gameType === "skyjo") {
    // Type assertion for Skyjo
    const skyjoRoom = room as any as SkyjoGameRoom;
    const skyjoPlayer = currentPlayer as any as SkyjoPlayer;

    if (!updateRoom) {
      // Fallback if updateRoom is not provided
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
          <Card className="p-8 bg-card/90 backdrop-blur-sm border-2 border-primary/20 shadow-2xl max-w-md w-full text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold mb-4">Erreur</h1>
              <p className="text-muted-foreground mb-6">
                Impossible de charger le jeu Skyjo.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <SkyjoGame
        room={skyjoRoom}
        currentPlayer={skyjoPlayer}
        onLeaveRoom={onLeaveRoom}
        updateRoom={updateRoom}
      />
    );
  }

  // Fallback
  return <GameBoard {...props} />;
}
