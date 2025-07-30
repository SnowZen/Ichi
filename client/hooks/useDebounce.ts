// client/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

// Ce hook prend une valeur et ne la renvoie qu'après un délai sans nouveau changement.
// Il est parfait pour empêcher des actions répétitives comme la sauvegarde.
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Met en place un minuteur. Si la "value" change, l'ancien minuteur est nettoyé
    // et un nouveau est lancé.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Fonction de nettoyage qui s'exécute quand le composant est démonté
    // ou si la dépendance (value) change.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Ne se ré-exécute que si la valeur ou le délai change

  return debouncedValue;
}