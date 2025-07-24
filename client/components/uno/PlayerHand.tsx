import { UnoCard } from "./UnoCard";
import { UnoCard as UnoCardType } from "@shared/uno";
import { cn } from "@/lib/utils";

interface PlayerHandProps {
  cards: UnoCardType[];
  onCardPlay?: (card: UnoCardType) => void;
  selectedCard?: string;
  onCardSelect?: (cardId: string) => void;
  isCurrentPlayer?: boolean;
  playableCards?: string[];
  className?: string;
}

export function PlayerHand({ 
  cards, 
  onCardPlay, 
  selectedCard, 
  onCardSelect, 
  isCurrentPlayer = false,
  playableCards = [],
  className 
}: PlayerHandProps) {
  const handleCardClick = (card: UnoCardType) => {
    if (!isCurrentPlayer) return;
    
    if (onCardSelect) {
      onCardSelect(card.id);
    } else if (onCardPlay && playableCards.includes(card.id)) {
      onCardPlay(card);
    }
  };

  return (
    <div className={cn("flex gap-1 sm:gap-2 flex-wrap justify-center", className)}>
      {cards.map((card, index) => (
        <div
          key={card.id}
          className="relative"
          style={{
            marginLeft: index > 0 ? (window.innerWidth < 640 ? '-8px' : '-12px') : '0',
            zIndex: cards.length - index
          }}
        >
          <UnoCard
            card={card}
            onClick={() => handleCardClick(card)}
            isPlayable={isCurrentPlayer && (playableCards.length === 0 || playableCards.includes(card.id))}
            isSelected={selectedCard === card.id}
            size="md"
            className={cn({
              "hover:z-50": isCurrentPlayer
            })}
          />
        </div>
      ))}
    </div>
  );
}
