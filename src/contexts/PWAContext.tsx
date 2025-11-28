import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { syncManager } from '@/pwa/syncManager';
import { getPendingOperations } from '@/pwa/offlineStorage';
import { usePWA } from '@/pwa/usePWA';

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  hasUpdate: boolean;
  pendingOperationsCount: number;
  promptInstall: () => Promise<boolean>;
  syncNow: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0);
  const { isInstalled, isInstallable, promptInstall } = usePWA();

  useEffect(() => {
    // Monitora status online/offline
    const unsubscribeOnline = syncManager.onOnline(() => {
      setIsOnline(true);
      updatePendingCount();
    });

    const unsubscribeOffline = syncManager.onOffline(() => {
      setIsOnline(false);
    });

    const unsubscribeSync = syncManager.onSyncComplete(() => {
      updatePendingCount();
    });

    // Monitora atualizações do service worker
    const handleUpdateAvailable = () => {
      setHasUpdate(true);
    };

    window.addEventListener('swUpdateAvailable', handleUpdateAvailable);

    // Atualiza contador de operações pendentes
    const updatePendingCount = async () => {
      const operations = await getPendingOperations();
      setPendingOperationsCount(operations.length);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeSync();
      window.removeEventListener('swUpdateAvailable', handleUpdateAvailable);
      clearInterval(interval);
    };
  }, []);

  const syncNow = async () => {
    await syncManager.syncPendingOperations();
  };

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        isInstalled,
        isInstallable,
        hasUpdate,
        pendingOperationsCount,
        promptInstall,
        syncNow,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWAContext() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
}
