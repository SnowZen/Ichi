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
  showBacks?: boolean;
}

export function PlayerHand({
  cards,
  onCardPlay,
  selectedCard,
  onCardSelect,
  isCurrentPlayer = false,
  playableCards = [],
  className,
  showBacks = false,
}: PlayerHandProps) {
  const handleCardClick = (card: UnoCardType) => {
    if (!isCurrentPlayer) return;

    if (onCardSelect && onCardPlay) {
      // If card is already selected, play it
      if (selectedCard === card.id && playableCards.includes(card.id)) {
        onCardPlay(card);
      } else if (playableCards.includes(card.id)) {
        // Otherwise, select it if it's playable
        onCardSelect(card.id);
      }
    } else if (onCardPlay && playableCards.includes(card.id)) {
      onCardPlay(card);
    }
  };

  return (
    <div
      className={cn("flex gap-1 sm:gap-2 flex-wrap justify-center", className)}
    >
      {cards.map((card, index) => (
        <div
          key={card.id}
          className="relative"
          className={cn(index > 0 && "-ml-2 sm:-ml-3")}
          style={{
            zIndex: cards.length - index,
          }}
        >
          <UnoCard
            card={card}
            onClick={() => handleCardClick(card)}
            isPlayable={isCurrentPlayer && playableCards.includes(card.id)}
            isSelected={selectedCard === card.id}
            size="md"
            showBack={showBacks}
            className={cn({
              "hover:z-50": isCurrentPlayer,
              "ring-2 ring-green-400":
                isCurrentPlayer &&
                playableCards.includes(card.id) &&
                selectedCard !== card.id,
            })}
          />
        </div>
      ))}
    </div>
  );
}
