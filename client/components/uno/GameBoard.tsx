import { UnoCard } from "./UnoCard";
import { PlayerHand } from "./PlayerHand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Player, UnoCard as UnoCardType, GameRoom } from "@shared/uno";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  room: GameRoom;
  currentPlayer: Player;
  onCardPlay: (card: UnoCardType) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onChallengeUno?: (playerId: string) => void;
  selectedCard?: string;
  onCardSelect?: (cardId: string) => void;
  playableCards?: string[];
}

export function GameBoard({
  room,
  currentPlayer,
  onCardPlay,
  onDrawCard,
  onCallUno,
  onChallengeUno,
  selectedCard,
  onCardSelect,
  playableCards = [],
}: GameBoardProps) {
  const otherPlayers = room.players.filter((p) => p.id !== currentPlayer.id);
  const isMyTurn = room.currentPlayer === currentPlayer.id;

  const playersWithOneCard = room.players.filter(
    (p) =>
      p.cards.length === 1 &&
      room.unoCalledBy !== p.id &&
      p.id !== currentPlayer.id,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-2 sm:p-4 relative">
      {/* Floating UNO Challenge Notification */}
      {playersWithOneCard.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {playersWithOneCard.map((player) => (
            <div
              key={player.id}
              className="bg-red-600 text-white p-4 rounded-lg shadow-2xl border-2 border-red-400 animate-bounce"
            >
              <p className="font-bold text-center">
                ⚠️ {player.name} n'a pas appelé UNO!
              </p>
              <Button
                onClick={() => onChallengeUno?.(player.id)}
                className="w-full mt-2 bg-red-800 hover:bg-red-900 font-bold text-sm"
                size="sm"
              >
                DÉFIER MAINTENANT!
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Other Players */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {otherPlayers.map((player) => (
            <Card key={player.id} className="p-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      player.isConnected ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  <span className="font-medium">{player.name}</span>
                  {room.currentPlayer === player.id && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Tour
                    </span>
                  )}
                  {player.cards.length === 1 &&
                    room.unoCalledBy !== player.id && (
                      <Button
                        onClick={() => onChallengeUno?.(player.id)}
                        size="sm"
                        variant="destructive"
                        className="text-sm px-3 py-2 font-bold bg-red-600 hover:bg-red-700 border-2 border-red-400 shadow-lg animate-bounce"
                      >
                        ⚠️ CONTRE UNO!
                      </Button>
                    )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {player.cards.length} carte
                  {player.cards.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Player's card backs */}
              <div className="flex gap-2 flex-wrap">
                {player.cards
                  .slice(0, Math.min(7, player.cards.length))
                  .map((_, index) => (
                    <div
                      key={index}
                      className="w-10 h-14 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 rounded-lg border-2 border-slate-500 relative flex items-center justify-center shadow-lg"
                    >
                      <div className="absolute inset-1 border border-slate-400/30 rounded-md" />
                      <span className="text-slate-300 text-xs font-bold">
                        UNO
                      </span>
                    </div>
                  ))}
                {player.cards.length > 7 && (
                  <span className="self-center text-xs text-muted-foreground ml-2">
                    +{player.cards.length - 7}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Draw Penalty Warning */}
        {room.gameType === 'uno' && room.drawPenalty && room.drawPenalty > 0 && (
          <div className="text-center mb-4">
            <div className="bg-destructive/20 border border-destructive rounded-lg p-3 max-w-md mx-auto">
              <p className="text-destructive font-semibold">
                ⚠️ Pénalité active : {room.drawPenalty} carte
                {room.drawPenalty > 1 ? "s" : ""} à piocher
              </p>
              <p className="text-sm text-destructive/80">
                Jouez une carte +2 ou +4 pour contrer, ou piochez les cartes
              </p>
            </div>
          </div>
        )}

        {/* Game Center */}
        <div className="flex justify-center items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
          {/* Draw Pile */}
          <div className="text-center">
            <div className="relative mb-3">
              {/* Stack effect */}
              <div className="w-16 h-24 sm:w-20 sm:h-28 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl border-2 border-slate-500 absolute top-1 left-1" />
              <div
                className={cn(
                  "w-16 h-24 sm:w-20 sm:h-28 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl border-2 border-slate-400 relative flex items-center justify-center cursor-pointer transition-transform shadow-lg",
                  {
                    "hover:scale-105": isMyTurn,
                    "opacity-50 cursor-not-allowed": !isMyTurn,
                  },
                )}
                onClick={isMyTurn ? onDrawCard : undefined}
              >
                <div className="absolute inset-2 border border-slate-300 rounded-lg opacity-30" />
                <div className="absolute inset-4 border border-slate-300 rounded opacity-20" />
                <span className="text-slate-300 font-bold text-sm">UNO</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {room.drawPenalty && room.drawPenalty > 0
                ? `Piocher ${room.drawPenalty} carte${room.drawPenalty > 1 ? "s" : ""}`
                : `Piocher (${room.deck.length})`}
            </p>
          </div>

          {/* Discard Pile */}
          <div className="text-center">
            {room.topCard && (
              <UnoCard
                card={room.topCard}
                size="lg"
                className="mx-auto"
                wildColor={room.wildColor}
              />
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Pile de défausse
              {room.wildColor && room.topCard?.color === "wild" && (
                <span className="block text-xs">
                  Couleur:{" "}
                  {room.wildColor === "red"
                    ? "Rouge"
                    : room.wildColor === "blue"
                      ? "Bleu"
                      : room.wildColor === "green"
                        ? "Vert"
                        : "Jaune"}
                </span>
              )}
            </p>
          </div>

          {/* Game Info */}
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              {room.direction === 1 ? "→" : "←"}
            </div>
            <p className="text-sm text-muted-foreground">Direction</p>
          </div>
        </div>

        {/* Current Player's Hand */}
        <Card className="p-6 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{currentPlayer.name}</h3>
              {isMyTurn && (
                <span className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded">
                  Votre tour
                </span>
              )}
            </div>

            <div className="flex gap-3 items-center">
              {currentPlayer.cards.length === 1 &&
                room.unoCalledBy !== currentPlayer.id && (
                  <Button
                    onClick={onCallUno}
                    variant="destructive"
                    size="lg"
                    className="px-6 py-3 text-xl font-black bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-3 border-yellow-400 shadow-2xl animate-pulse transform hover:scale-105"
                  >
                    🚨 UNO! 🚨
                  </Button>
                )}
              {currentPlayer.cards.length === 1 &&
                room.unoCalledBy === currentPlayer.id && (
                  <div className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-lg border-2 border-green-300 shadow-lg">
                    ✅ UNO appelé!
                  </div>
                )}
              <span className="text-lg font-semibold text-foreground">
                {currentPlayer.cards.length} carte
                {currentPlayer.cards.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <PlayerHand
            cards={currentPlayer.cards}
            onCardPlay={onCardPlay}
            selectedCard={selectedCard}
            onCardSelect={onCardSelect}
            isCurrentPlayer={isMyTurn}
            playableCards={playableCards}
            className="justify-center"
          />
        </Card>
      </div>
    </div>
  );
}
