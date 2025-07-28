import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Plus, LogIn, Trophy, Zap } from "lucide-react";
import { usePlayerSession } from "@/hooks/usePlayerSession";

export default function Index() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { saveSession } = usePlayerSession();

  const createRoom = async () => {
    if (!playerName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim(),
          maxPlayers: 4,
        }),
      });

      if (response.ok) {
        const { roomId, playerId, playerName: name } = await response.json();
        saveSession(playerId, roomId, name);
        navigate(`/room/${roomId}`);
      }
    } catch (error) {
      console.error("Erreur lors de la création du salon:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;

    setIsJoining(true);
    try {
      const response = await fetch(`/api/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName.trim() }),
      });

      if (response.ok) {
        const { roomId, playerId, playerName: name } = await response.json();
        saveSession(playerId, roomId, name);
        navigate(`/room/${roomCode}`);
      }
    } catch (error) {
      console.error("Erreur lors de la connexion au salon:", error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <div className="text-center py-8 sm:py-12">
        <div className="flex justify-center items-center gap-3 sm:gap-4 mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-uno-red via-uno-blue to-uno-green rounded-xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
            U
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-uno-red via-uno-blue to-uno-green bg-clip-text text-transparent">
            UNO
          </h1>
        </div>
        <p className="text-xl text-muted-foreground mb-2">
          Jeu de cartes multijoueur en ligne
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            2-4 joueurs
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Zap className="w-3 h-3" />
            Parties rapides
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Trophy className="w-3 h-3" />
            Compétitif
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8 sm:pb-12">
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
          {/* Create Room */}
          <Card className="p-8 bg-card/70 backdrop-blur-sm border-primary/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Créer un salon</h2>
              <p className="text-muted-foreground">
                Créez une nouvelle partie et invitez vos amis
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="player-name-create">Votre nom</Label>
                <Input
                  id="player-name-create"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Entrez votre nom"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={createRoom}
                disabled={!playerName.trim() || isCreating}
                className="w-full py-3 text-lg"
                size="lg"
              >
                {isCreating ? "Création..." : "Créer un salon"}
              </Button>
            </div>
          </Card>

          {/* Join Room */}
          <Card className="p-8 bg-card/70 backdrop-blur-sm border-accent/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Rejoindre un salon
              </h2>
              <p className="text-muted-foreground">
                Rejoignez une partie existante avec le code
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="player-name-join">Votre nom</Label>
                <Input
                  id="player-name-join"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Entrez votre nom"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="room-code">Code du salon</Label>
                <Input
                  id="room-code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  className="mt-1 font-mono"
                />
              </div>

              <Button
                onClick={joinRoom}
                disabled={!playerName.trim() || !roomCode.trim() || isJoining}
                variant="secondary"
                className="w-full py-3 text-lg"
                size="lg"
              >
                {isJoining ? "Connexion..." : "Rejoindre"}
              </Button>
            </div>
          </Card>
        </div>

        <Separator className="my-12" />

        {/* How to Play */}
        <Card className="p-8 bg-card/50 backdrop-blur-sm">
          <h3 className="text-2xl font-semibold mb-6 text-center">
            Comment jouer
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-uno-red rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Créez ou rejoignez</h4>
              <p className="text-sm text-muted-foreground">
                Créez un nouveau salon ou rejoignez-en un avec un code
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-uno-blue rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Jouez vos cartes</h4>
              <p className="text-sm text-muted-foreground">
                Associez les couleurs ou les numéros pour vous débarrasser de
                vos cartes
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-uno-green rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Criez UNO!</h4>
              <p className="text-sm text-muted-foreground">
                N'oubliez pas de dire UNO quand il vous reste une carte
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
