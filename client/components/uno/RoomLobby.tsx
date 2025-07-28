import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GameRoom } from "@shared/uno";
import { GameSelection } from "@/components/common/GameSelection";
import { GameType, AVAILABLE_GAMES } from "@shared/games";
import { cn } from "@/lib/utils";
import { Users, Play, Copy, Check } from "lucide-react";

interface RoomLobbyProps {
  room: GameRoom;
  currentPlayerId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onGameSelect?: (gameType: GameType) => void;
  isHost: boolean;
}

export function RoomLobby({
  room,
  currentPlayerId,
  onStartGame,
  onLeaveRoom,
  onGameSelect,
  isHost,
}: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);
  const roomUrl = `${window.location.origin}/room/${room.id}`;

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = room.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStartGame = room.players.length >= 2 && isHost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Salon: {room.name}
          </h1>
          <p className="text-muted-foreground">En attente des joueurs...</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Room Info */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
              <Users className="w-6 h-6" />
              Informations du salon
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <span className="font-medium">Code du salon:</span>
                <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <code className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg text-2xl font-bold font-mono tracking-wider text-primary border-2 border-primary/30 flex-1 text-center">
                    {room.id}
                  </code>
                  <Button
                    onClick={copyRoomCode}
                    size="lg"
                    variant="outline"
                    className="px-4 py-3 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Partagez ce code avec vos amis pour qu'ils rejoignent la
                  partie
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span>Joueurs:</span>
                <span>
                  {room.players.length}/{room.maxPlayers}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Statut:</span>
                <Badge variant={room.isStarted ? "destructive" : "secondary"}>
                  {room.isStarted ? "En cours" : "En attente"}
                </Badge>
              </div>
            </div>

            <div className="mt-6 p-4 bg-secondary/20 border border-secondary/30 rounded-lg">
              <p className="text-sm font-medium mb-3 text-center">
                🔗 Lien direct de la partie
              </p>
              <div className="flex gap-2">
                <Input
                  value={roomUrl}
                  readOnly
                  className="text-sm font-mono bg-white dark:bg-slate-800 border-secondary/30"
                />
                <Button
                  onClick={() => navigator.clipboard.writeText(roomUrl)}
                  size="sm"
                  variant="secondary"
                  className="px-4 whitespace-nowrap"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copier
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Vos amis peuvent cliquer directement sur ce lien
              </p>
            </div>
          </Card>

          {/* Players List */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-accent/20">
            <h3 className="text-xl font-bold mb-6 text-accent">
              👥 Joueurs connectés ({room.players.length}/{room.maxPlayers})
            </h3>

            <div className="space-y-3">
              {room.players.map((player, index) => (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
                    player.id === currentPlayerId
                      ? "bg-primary/15 border-primary shadow-lg shadow-primary/20"
                      : "bg-card/60 border-muted hover:border-accent/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 border-white shadow-sm",
                        player.isConnected ? "bg-green-500" : "bg-red-500",
                      )}
                    />
                    <span className="font-semibold text-lg">{player.name}</span>
                    {player.id === currentPlayerId && (
                      <Badge variant="default" className="text-xs font-bold">
                        👤 Vous
                      </Badge>
                    )}
                    {index === 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs font-bold border border-yellow-400 bg-yellow-50 text-yellow-800"
                      >
                        👑 Hôte
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium px-2 py-1 rounded",
                        player.isConnected
                          ? "text-green-700 bg-green-100"
                          : "text-red-700 bg-red-100",
                      )}
                    >
                      {player.isConnected ? "🟢 En ligne" : "🔴 Hors ligne"}
                    </span>
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({
                length: room.maxPlayers - room.players.length,
              }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10"
                >
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <span className="font-medium">
                      En attente d'un joueur...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            {canStartGame && (
              <Button
                onClick={onStartGame}
                size="lg"
                className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-500/25"
              >
                <Play className="w-6 h-6 mr-2" />
                🎮 Commencer la partie
              </Button>
            )}

            <Button
              onClick={onLeaveRoom}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
            >
              🚪 Quitter le salon
            </Button>
          </div>

          {!canStartGame && (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                ℹ️{" "}
                {room.players.length < 2
                  ? "Au moins 2 joueurs sont nécessaires pour commencer"
                  : "Seul l'hôte peut commencer la partie"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
