import { cn } from "@/lib/utils";
import { SkyjoCard as SkyjoCardType } from "@shared/skyjo";

interface SkyjoCardProps {
  card: SkyjoCardType;
  isClickable?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SkyjoCard({
  card,
  isClickable = false,
  onClick,
  className,
  size = "md",
}: SkyjoCardProps) {
  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-16 h-20",
    lg: "w-20 h-28",
  };

  const getCardColor = (value: number) => {
    if (value === 999) return "bg-gray-200 border-gray-300"; // Removed card
    if (value < 0) return "bg-green-100 border-green-400 text-green-800";
    if (value === 0) return "bg-blue-100 border-blue-400 text-blue-800";
    if (value <= 6) return "bg-yellow-100 border-yellow-400 text-yellow-800";
    return "bg-red-100 border-red-400 text-red-800";
  };

  const getValueDisplay = (value: number) => {
    if (value === 999) return "✗";
    return value.toString();
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all duration-200 relative",
        {
          [getCardColor(card.value)]: card.isRevealed,
          "bg-gradient-to-br from-slate-600 to-slate-800 border-slate-500 text-white":
            !card.isRevealed,
          "cursor-pointer hover:scale-105 hover:shadow-lg": isClickable,
          "opacity-50": card.value === 999,
        },
        className,
      )}
      onClick={isClickable ? onClick : undefined}
    >
      {card.isRevealed ? (
        <span className={cn("text-center", { "text-xs": card.value === 999 })}>
          {getValueDisplay(card.value)}
        </span>
      ) : (
        <div className="text-slate-300 text-xs font-normal">?</div>
      )}

      {/* Card back pattern when not revealed */}
      {!card.isRevealed && (
        <>
          <div className="absolute inset-1 border border-slate-400 rounded opacity-30" />
          <div className="absolute inset-2 border border-slate-400 rounded opacity-20" />
        </>
      )}
    </div>
  );
}
