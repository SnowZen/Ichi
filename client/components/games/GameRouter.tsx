import { GameBoard } from "@/components/uno/GameBoard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player, UnoCard, GameRoom } from "@shared/uno";

interface GameRouterProps {
  room: GameRoom;
  currentPlayer: Player;
  onCardPlay: (card: UnoCard) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onChallengeUno?: (playerId: string) => void;
  onLeaveRoom?: () => void;
  selectedCard?: string;
  onCardSelect?: (cardId: string) => void;
  playableCards?: string[];
}

export function GameRouter(props: GameRouterProps) {
  const { room, onLeaveRoom } = props;

  if (room.gameType === "uno") {
    return <GameBoard {...props} />;
  }

  if (room.gameType === "skyjo") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
        {/* Quit Game Button - Fixed position top left */}
        {onLeaveRoom && (
          <div className="fixed top-4 left-4 z-50">
            <Button
              onClick={onLeaveRoom}
              variant="outline"
              size="sm"
              className="bg-background/90 backdrop-blur-sm border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              🚪 Quitter
            </Button>
          </div>
        )}

        <Card className="p-8 bg-card/90 backdrop-blur-sm border-2 border-primary/20 shadow-2xl max-w-md w-full text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">⭐</div>
            <h1 className="text-3xl font-bold mb-4">Skyjo</h1>
            <p className="text-muted-foreground mb-6">
              Le jeu Skyjo est en cours de développement !
            </p>
            <p className="text-sm text-muted-foreground">
              🚧 Cette fonctionnalité sera bientôt disponible. En attendant,
              profitez d'UNO !
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Fallback
  return <GameBoard {...props} />;
}
