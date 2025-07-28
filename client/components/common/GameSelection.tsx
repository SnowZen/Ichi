import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameType, AVAILABLE_GAMES } from "@shared/games";
import { cn } from "@/lib/utils";
import { Users, Clock } from "lucide-react";

interface GameSelectionProps {
  onGameSelect: (gameType: GameType) => void;
  selectedGame?: GameType;
  disabled?: boolean;
}

export function GameSelection({ onGameSelect, selectedGame, disabled = false }: GameSelectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Choisissez un jeu</h3>
      
      <div className="grid gap-4">
        {AVAILABLE_GAMES.map((game) => (
          <Card
            key={game.id}
            className={cn(
              "p-4 cursor-pointer transition-all duration-200 hover:shadow-lg",
              selectedGame === game.id 
                ? "ring-2 ring-primary bg-primary/10" 
                : "hover:bg-accent/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onGameSelect(game.id)}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{game.icon}</div>
              
              <div className="flex-1">
                <h4 className="text-lg font-semibold mb-1">{game.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{game.description}</p>
                
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {game.minPlayers}-{game.maxPlayers} joueurs
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    15-30 min
                  </Badge>
                </div>
              </div>
              
              {selectedGame === game.id && (
                <div className="text-primary">
                  ✓
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      {selectedGame && (
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          <p className="text-sm font-medium">
            🎮 {AVAILABLE_GAMES.find(g => g.id === selectedGame)?.name} sélectionné
          </p>
        </div>
      )}
    </div>
  );
}
