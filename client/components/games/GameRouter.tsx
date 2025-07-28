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
  const { room, currentPlayer, onLeaveRoom, updateRoom, hasConnectionIssues } =
    props;

  if (room.gameType === "uno") {
    return <GameBoard {...props} />;
  }

  if (room.gameType === "skyjo") {
    // Detect Netlify environment and force offline mode for Skyjo
    const isNetlify =
      window.location.hostname.includes("netlify.app") ||
      window.location.hostname.includes("netlify.com");

    // Use offline version if connection issues, no updateRoom, or on Netlify
    if (hasConnectionIssues || !updateRoom || isNetlify) {
      return <SkyjoOfflineGame />;
    }

    // Type assertion for Skyjo
    const skyjoRoom = room as any as SkyjoGameRoom;
    const skyjoPlayer = currentPlayer as any as SkyjoPlayer;

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
