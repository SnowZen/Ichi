import { UnoColor } from "@shared/uno";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  onColorSelect: (color: UnoColor) => void;
  onCancel?: () => void;
}

export function ColorPicker({ onColorSelect, onCancel }: ColorPickerProps) {
  const colors: { name: UnoColor; label: string; bgClass: string }[] = [
    { name: 'red', label: 'Rouge', bgClass: 'bg-red-500 hover:bg-red-600' },
    { name: 'blue', label: 'Bleu', bgClass: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'green', label: 'Vert', bgClass: 'bg-green-500 hover:bg-green-600' },
    { name: 'yellow', label: 'Jaune', bgClass: 'bg-yellow-500 hover:bg-yellow-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 bg-card border-2 border-primary/20 shadow-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Choisissez une couleur</h3>
          <p className="text-muted-foreground text-sm">
            Sélectionnez la couleur pour votre carte Wild
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {colors.map((color) => (
            <Button
              key={color.name}
              onClick={() => onColorSelect(color.name)}
              className={cn(
                "h-16 text-white font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105",
                color.bgClass
              )}
            >
              {color.label}
            </Button>
          ))}
        </div>
        
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full"
          >
            Annuler
          </Button>
        )}
      </Card>
    </div>
  );
}
