import { cn } from "@/lib/utils";
import { UnoCard as UnoCardType } from "@shared/uno";

interface UnoCardProps {
  card: UnoCardType;
  className?: string;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UnoCard({ 
  card, 
  className, 
  onClick, 
  isPlayable = true, 
  isSelected = false,
  size = 'md'
}: UnoCardProps) {
  const sizeClasses = {
    sm: 'w-8 h-12 text-xs sm:w-12 sm:h-16',
    md: 'w-12 h-18 text-xs sm:w-16 sm:h-24 sm:text-sm',
    lg: 'w-16 h-24 text-sm sm:w-20 sm:h-28 sm:text-base'
  };

  const colorClasses = {
    red: 'bg-uno-red border-red-700',
    blue: 'bg-uno-blue border-blue-700',
    green: 'bg-uno-green border-green-700',
    yellow: 'bg-uno-yellow border-yellow-600',
    wild: 'bg-gradient-to-br from-uno-red via-uno-blue to-uno-green border-purple-700'
  };

  const getCardContent = () => {
    if (card.type === 'number') {
      return card.value?.toString() || '0';
    }
    if (card.type === 'skip') return '⊘';
    if (card.type === 'reverse') return '⟲';
    if (card.type === 'draw2') return '+2';
    if (card.type === 'wild') return '🌈';
    if (card.type === 'wild_draw4') return '+4';
    return '';
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 flex items-center justify-center font-bold text-white cursor-pointer transition-all duration-200 relative shadow-lg",
        sizeClasses[size],
        colorClasses[card.color],
        {
          "opacity-50 cursor-not-allowed": !isPlayable,
          "ring-2 ring-white ring-offset-2 ring-offset-background": isSelected,
          "hover:scale-105 hover:shadow-xl": isPlayable && onClick,
          "transform translate-y-[-4px]": isSelected
        },
        className
      )}
      onClick={isPlayable ? onClick : undefined}
    >
      <span className="drop-shadow-sm">{getCardContent()}</span>
      
      {/* Corner number for number cards */}
      {card.type === 'number' && (
        <>
          <span className="absolute top-1 left-1 text-xs opacity-80">
            {card.value}
          </span>
          <span className="absolute bottom-1 right-1 text-xs opacity-80 rotate-180">
            {card.value}
          </span>
        </>
      )}
    </div>
  );
}
