import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameBoard } from "@/components/uno/GameBoard";
import { RoomLobby } from "@/components/uno/RoomLobby";
import { GameRoom as GameRoomType, Player, UnoCard } from "@shared/uno";

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<GameRoomType | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | undefined>();
  const [playableCards, setPlayableCards] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Simulate fetching room data (replace with actual API call)
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error('Salon non trouvé');
        }
        const roomData = await response.json();
        setRoom(roomData);
        
        // For demo purposes, set current player as first player
        if (roomData.players.length > 0) {
          setCurrentPlayer(roomData.players[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();

    // Set up WebSocket connection for real-time updates
    // This would be implemented with actual WebSocket in production
    
  }, [roomId, navigate]);

  const handleStartGame = async () => {
    if (!roomId) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const updatedRoom = await response.json();
        setRoom(updatedRoom);
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de la partie:', error);
    }
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const handleCardPlay = async (card: UnoCard) => {
    if (!room || !currentPlayer || room.currentPlayer !== currentPlayer.id) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          cardId: card.id
        })
      });
      
      if (response.ok) {
        const updatedRoom = await response.json();
        setRoom(updatedRoom);
        setSelectedCard(undefined);
      }
    } catch (error) {
      console.error('Erreur lors du jeu de carte:', error);
    }
  };

  const handleDrawCard = async () => {
    if (!room || !currentPlayer || room.currentPlayer !== currentPlayer.id) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayer.id
        })
      });
      
      if (response.ok) {
        const updatedRoom = await response.json();
        setRoom(updatedRoom);
      }
    } catch (error) {
      console.error('Erreur lors du piochage:', error);
    }
  };

  const handleCallUno = async () => {
    if (!room || !currentPlayer) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/uno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayer.id
        })
      });
      
      if (response.ok) {
        console.log('UNO appelé!');
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel UNO:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du salon...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Erreur</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Salon introuvable</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const isHost = room.players.length > 0 && room.players[0].id === currentPlayer.id;

  if (!room.isStarted) {
    return (
      <RoomLobby
        room={room}
        currentPlayerId={currentPlayer.id}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        isHost={isHost}
      />
    );
  }

  return (
    <GameBoard
      room={room}
      currentPlayer={currentPlayer}
      onCardPlay={handleCardPlay}
      onDrawCard={handleDrawCard}
      onCallUno={handleCallUno}
      selectedCard={selectedCard}
      onCardSelect={setSelectedCard}
      playableCards={playableCards}
    />
  );
}
