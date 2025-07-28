import { SkyjoCard } from "./SkyjoCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  SkyjoPlayer,
  SkyjoGameRoom,
  SkyjoCard as SkyjoCardType,
} from "@shared/skyjo";
import { cn } from "@/lib/utils";

interface SkyjoBoardProps {
  room: SkyjoGameRoom;
  currentPlayer: SkyjoPlayer;
  onCardClick?: (row: number, col: number) => void;
  onDrawCard?: () => void;
  onTakeFromDiscard?: () => void;
  onLeaveRoom?: () => void;
  isWaitingForDiscardExchange?: boolean;
  drawnCard?: number | null;
}

export function SkyjoBoard({
  room,
  currentPlayer,
  onCardClick,
  onDrawCard,
  onTakeFromDiscard,
  onLeaveRoom,
  isWaitingForDiscardExchange = false,
  drawnCard = null,
}: SkyjoBoardProps) {
  const otherPlayers = room.players.filter((p) => p.id !== currentPlayer.id);
  const isMyTurn = room.currentPlayer === currentPlayer.id;

  const renderPlayerGrid = (player: SkyjoPlayer, isCurrentPlayer = false) => {
    const isInitialization = (room as any).isInitialization;
    const cardsRevealed = (player as any).cardsRevealed || 0;
    const needsToRevealMore = isInitialization && cardsRevealed < 2;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">
            {player.name}
            {isCurrentPlayer && isMyTurn && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {isInitialization
                  ? `Choisissez ${2 - cardsRevealed} carte${2 - cardsRevealed > 1 ? 's' : ''}`
                  : isWaitingForDiscardExchange
                    ? "Choisissez une carte à échanger"
                    : drawnCard !== null
                      ? "Choisissez où placer la carte"
                      : "Votre tour"
                }
              </span>
            )}
          </h3>
          <div className="text-right text-xs">
            <div>Score: {player.score}</div>
            <div>Total: {player.totalScore}</div>
            {isInitialization && (
              <div className="text-primary">Cartes révélées: {cardsRevealed}/2</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 max-w-xs">
          {player.cards.map((row, rowIndex) =>
            row.map((card, colIndex) => {
              const canClick = isCurrentPlayer && isMyTurn && (
                (isInitialization && needsToRevealMore && !card.isRevealed) ||
                (!isInitialization && (isWaitingForDiscardExchange || drawnCard !== null || !card.isRevealed))
              );

              return (
                <SkyjoCard
                  key={`${player.id}-${rowIndex}-${colIndex}`}
                  card={card}
                  size={isCurrentPlayer ? "md" : "sm"}
                  isClickable={canClick}
                  onClick={() =>
                    canClick && onCardClick
                      ? onCardClick(rowIndex, colIndex)
                      : undefined
                  }
                  className={cn({
                    "ring-2 ring-primary ring-offset-1": isCurrentPlayer && isMyTurn && canClick,
                    "ring-2 ring-destructive ring-offset-1": isCurrentPlayer && isWaitingForDiscardExchange && !card.isRevealed,
                  })}
                />
              );
            }),
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-2 sm:p-4">
      {/* Quit Game Button */}
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

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Other Players */}
        {otherPlayers.length > 0 && (
          <Card className="p-4 bg-card/70 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-4">Autres joueurs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPlayers.map((player) => (
                <div key={player.id}>{renderPlayerGrid(player)}</div>
              ))}
            </div>
          </Card>
        )}

        {/* Game Center - Draw pile and discard pile */}
        <div className="flex justify-center items-center gap-8">
          {/* Draw Pile */}
          <div className="text-center">
            <div
              className={cn(
                "w-16 h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg border-2 border-slate-500 relative flex items-center justify-center cursor-pointer transition-transform shadow-lg",
                {
                  "hover:scale-105": isMyTurn && onDrawCard,
                  "opacity-50 cursor-not-allowed": !isMyTurn,
                },
              )}
              onClick={isMyTurn && onDrawCard ? onDrawCard : undefined}
            >
              <div className="absolute inset-2 border border-slate-300 rounded opacity-30" />
              <span className="text-slate-300 font-bold text-sm">SKYJO</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pioche ({room.deck.length})
            </p>
          </div>

          {/* Round indicator */}
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              Manche {room.round}
            </div>
            <p className="text-sm text-muted-foreground">
              Objectif: moins de points
            </p>
          </div>

          {/* Discard Pile */}
          <div className="text-center">
            {room.discardPile.length > 0 ? (
              <div
                className={cn(
                  "w-16 h-20 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all cursor-pointer",
                  {
                    "hover:scale-105": isMyTurn && onTakeFromDiscard,
                    "opacity-50 cursor-not-allowed": !isMyTurn,
                  },
                  getDiscardCardColor(
                    room.discardPile[room.discardPile.length - 1],
                  ),
                )}
                onClick={
                  isMyTurn && onTakeFromDiscard ? onTakeFromDiscard : undefined
                }
              >
                {room.discardPile[room.discardPile.length - 1]}
              </div>
            ) : (
              <div className="w-16 h-20 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Vide</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Défausse</p>
          </div>
        </div>

        {/* Current Player */}
        <Card className="p-6 bg-card/70 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4">Vos cartes</h2>
          {renderPlayerGrid(currentPlayer, true)}
        </Card>
      </div>
    </div>
  );
}

function getDiscardCardColor(value: number) {
  if (value < 0) return "bg-green-100 border-green-400 text-green-800";
  if (value === 0) return "bg-blue-100 border-blue-400 text-blue-800";
  if (value <= 6) return "bg-yellow-100 border-yellow-400 text-yellow-800";
  return "bg-red-100 border-red-400 text-red-800";
}
