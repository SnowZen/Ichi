import { cn } from "@/lib/utils";
import { UnoCard as UnoCardType } from "@shared/uno";

interface UnoCardProps {
  card: UnoCardType;
  className?: string;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
  size?: "sm" | "md" | "lg";
  showBack?: boolean;
  wildColor?: "red" | "blue" | "green" | "yellow";
}

export function UnoCard({
  card,
  className,
  onClick,
  isPlayable = true,
  isSelected = false,
  size = "md",
  showBack = false,
  wildColor,
}: UnoCardProps) {
  const sizeClasses = {
    sm: "w-10 h-14 text-xs sm:w-12 sm:h-16",
    md: "w-14 h-20 text-sm sm:w-16 sm:h-24 sm:text-base",
    lg: "w-18 h-26 text-base sm:w-20 sm:h-28 sm:text-lg",
  };

  const colorClasses = {
    red: "bg-gradient-to-br from-red-500 to-red-600 border-red-700 shadow-red-500/25",
    blue: "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-700 shadow-blue-500/25",
    green:
      "bg-gradient-to-br from-green-500 to-green-600 border-green-700 shadow-green-500/25",
    yellow:
      "bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 shadow-yellow-500/25",
    wild: "bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 border-purple-700 shadow-purple-500/25",
  };

  // Use wild color if available for wild cards
  const effectiveColor =
    card.color === "wild" && wildColor ? wildColor : card.color;

  const getCardContent = () => {
    if (card.type === "number") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-4xl sm:text-5xl font-black drop-shadow-lg">
            {card.value}
          </span>
        </div>
      );
    }
    if (card.type === "skip")
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-white rounded-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-1 bg-white rotate-45"></div>
            </div>
          </div>
        </div>
      );
    if (card.type === "reverse")
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-2xl sm:text-3xl font-black">↺</div>
        </div>
      );
    if (card.type === "draw2")
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-lg sm:text-xl font-black">+2</div>
          <div className="flex gap-1 mt-1">
            <div className="w-2 h-3 bg-white rounded-sm"></div>
            <div className="w-2 h-3 bg-white rounded-sm"></div>
          </div>
        </div>
      );
    if (card.type === "wild")
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-lg sm:text-xl font-black text-white drop-shadow-lg">
            WILD
          </div>
        </div>
      );
    if (card.type === "wild_draw4")
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-sm sm:text-base font-black text-white">WILD</div>
          <div className="text-lg sm:text-xl font-black text-white">+4</div>
        </div>
      );
    return "";
  };

  if (showBack) {
    return (
      <div
        className={cn(
          "rounded-xl border-2 border-slate-600 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg relative",
          sizeClasses[size],
          className,
        )}
      >
        <div className="absolute inset-2 border border-slate-400 rounded-lg opacity-30" />
        <div className="absolute inset-4 border border-slate-400 rounded opacity-20" />
        <div className="text-slate-400 font-bold text-xs sm:text-sm">UNO</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border-3 flex items-center justify-center font-bold text-white cursor-pointer transition-all duration-200 relative shadow-lg",
        sizeClasses[size],
        colorClasses[effectiveColor],
        {
          "opacity-50 cursor-not-allowed border-dashed": !isPlayable,
          "ring-4 ring-white ring-offset-2 ring-offset-background shadow-2xl":
            isSelected,
          "hover:scale-105 hover:shadow-2xl hover:shadow-current/50":
            isPlayable && onClick,
          "transform translate-y-[-6px] shadow-2xl": isSelected,
        },
        className,
      )}
      onClick={isPlayable ? onClick : undefined}
    >
      {/* Card border effect */}
      <div className="absolute inset-1 border-2 border-white/30 rounded-lg" />

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center h-full w-full">
        {getCardContent()}
      </div>

      {/* Corner indicators for number cards */}
      {card.type === "number" && (
        <>
          <div className="absolute top-1 left-1 text-xs opacity-90 font-black drop-shadow">
            {card.value}
          </div>
          <div className="absolute bottom-1 right-1 text-xs opacity-90 font-black drop-shadow rotate-180">
            {card.value}
          </div>
        </>
      )}

      {/* Playable indicator */}
      {isPlayable && onClick && !isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg" />
      )}
    </div>
  );
}
