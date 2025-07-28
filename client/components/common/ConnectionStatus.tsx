import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  lastError?: string | null;
}

export function ConnectionStatus({
  isConnected,
  lastError,
}: ConnectionStatusProps) {
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setShowOffline(true);
    } else {
      // Hide offline indicator after a short delay when back online
      const timer = setTimeout(() => setShowOffline(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  if (!showOffline && !lastError) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {showOffline && (
        <Alert
          variant={isConnected ? "default" : "destructive"}
          className="mb-2"
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <AlertDescription>
              {isConnected
                ? "Connexion rétablie"
                : "Connexion instable - Tentative de reconnexion..."}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {lastError && (
        <Alert variant="destructive">
          <AlertDescription>{lastError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
