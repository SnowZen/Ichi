import { GameRoom, Player } from "@shared/uno";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, RotateCcw } from "lucide-react";

interface GameOverProps {
  room: GameRoom;
  currentPlayer: Player;
  onReturnToLobby: () => void;
}

export function GameOver({
  room,
  currentPlayer,
  onReturnToLobby,
}: GameOverProps) {
  const winner = room.players.find((p) => p.id === room.winner);
  const isWinner = room.winner === currentPlayer.id;

  // Sort players by number of cards (ascending)
  const sortedPlayers = [...room.players].sort(
    (a, b) => a.cards.length - b.cards.length,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="p-8 bg-card/90 backdrop-blur-sm border-2 border-primary/20 shadow-2xl max-w-md w-full text-center">
        {/* Winner celebration */}
        <div className="mb-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isWinner ? "bg-yellow-500" : "bg-muted"
            }`}
          >
            <Trophy
              className={`w-10 h-10 ${isWinner ? "text-yellow-900" : "text-muted-foreground"}`}
            />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {isWinner ? "Félicitations !" : "Partie terminée"}
          </h1>

          <p className="text-xl text-muted-foreground mb-4">
            {isWinner
              ? "Vous avez gagné la partie !"
              : `${winner?.name || "Joueur"} a gagné !`}
          </p>
        </div>

        {/* Leaderboard */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            Classement final
          </h3>

          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? "bg-yellow-500/20 border border-yellow-500/50"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-yellow-900"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="font-medium">{player.name}</span>
                  {player.id === currentPlayer.id && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Vous
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {player.cards.length} carte
                  {player.cards.length > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onReturnToLobby}
            className="w-full py-3 text-lg"
            size="lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Retourner au lobby
          </Button>

          <p className="text-xs text-muted-foreground">
            Vous pouvez démarrer une nouvelle partie dans le lobby
          </p>
        </div>
      </Card>
    </div>
  );
}
