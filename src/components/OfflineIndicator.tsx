import { useEffect, useState } from 'react';
import { WifiOff, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { syncManager } from '@/pwa/syncManager';
import { getPendingOperations } from '@/pwa/offlineStorage';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Atualiza contador de operações pendentes
    const updatePendingCount = async () => {
      const operations = await getPendingOperations();
      setPendingCount(operations.length);
    };

    // Inicial
    updatePendingCount();

    // Listener para mudanças de conexão
    const unsubscribeOnline = syncManager.onOnline(() => {
      setIsOnline(true);
      updatePendingCount();
    });

    const unsubscribeOffline = syncManager.onOffline(() => {
      setIsOnline(false);
      updatePendingCount();
    });

    const unsubscribeSync = syncManager.onSyncComplete(() => {
      updatePendingCount();
    });

    // Atualiza a cada 5 segundos
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 animate-in fade-in slide-in-from-top-5">
      {!isOnline && (
        <Badge variant="destructive" className="gap-2 px-3 py-1.5">
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">Modo Offline</span>
        </Badge>
      )}

      {pendingCount > 0 && (
        <Badge variant="secondary" className="gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-amber-700">
            {pendingCount} {pendingCount === 1 ? 'operação pendente' : 'operações pendentes'}
          </span>
        </Badge>
      )}
    </div>
  );
}
