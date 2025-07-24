import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GameRoom } from "@shared/uno";
import { cn } from "@/lib/utils";
import { Users, Play, Copy, Check } from "lucide-react";

interface RoomLobbyProps {
  room: GameRoom;
  currentPlayerId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  isHost: boolean;
}

export function RoomLobby({ room, currentPlayerId, onStartGame, onLeaveRoom, isHost }: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);
  const roomUrl = `${window.location.origin}/room/${room.id}`;

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = room.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
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
          <p className="text-muted-foreground">
            En attente des joueurs...
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Room Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
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
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Partagez ce code avec vos amis pour qu'ils rejoignent la partie
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Joueurs:</span>
                <span>{room.players.length}/{room.maxPlayers}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Statut:</span>
                <Badge variant={room.isStarted ? "destructive" : "secondary"}>
                  {room.isStarted ? "En cours" : "En attente"}
                </Badge>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Partagez ce lien avec vos amis:
              </p>
              <div className="flex gap-2">
                <Input
                  value={roomUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  onClick={() => navigator.clipboard.writeText(roomUrl)}
                  size="sm"
                  variant="outline"
                >
                  Copier
                </Button>
              </div>
            </div>
          </Card>

          {/* Players List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Joueurs ({room.players.length})
            </h3>
            
            <div className="space-y-3">
              {room.players.map((player, index) => (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    player.id === currentPlayerId ? "bg-primary/10 border-primary" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      player.isConnected ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="font-medium">{player.name}</span>
                    {player.id === currentPlayerId && (
                      <Badge variant="secondary" className="text-xs">
                        Vous
                      </Badge>
                    )}
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Hôte
                      </Badge>
                    )}
                  </div>
                  
                  <span className="text-sm text-muted-foreground">
                    {player.isConnected ? "Connecté" : "Déconnecté"}
                  </span>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-dashed border-muted-foreground/30"
                >
                  <span className="text-muted-foreground">En attente d'un joueur...</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {canStartGame && (
            <Button
              onClick={onStartGame}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Commencer la partie
            </Button>
          )}
          
          <Button
            onClick={onLeaveRoom}
            variant="outline"
            size="lg"
            className="px-8 py-3"
          >
            Quitter le salon
          </Button>
        </div>

        {!canStartGame && (
          <div className="text-center mt-4">
            <p className="text-muted-foreground">
              {room.players.length < 2
                ? "Au moins 2 joueurs sont nécessaires pour commencer"
                : "Seul l'hôte peut commencer la partie"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
