/**
 * Sync Manager - Gerencia sincronização online/offline
 */

import { supabase } from '@/integrations/supabase/client';
import {
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  addSyncLog,
  getLocalCredits,
  setLocalCredits,
  PendingOperation,
} from './offlineStorage';
import { toast } from 'sonner';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  currentCredits?: number;
  error?: string;
}

class SyncManager {
  private isOnlineState: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncCallbacks: Array<(result: SyncResult) => void> = [];
  private onlineCallbacks: Array<() => void> = [];
  private offlineCallbacks: Array<() => void> = [];

  constructor() {
    this.startConnectionMonitor();
  }

  /**
   * Inicia monitoramento de conexão
   */
  startConnectionMonitor(): void {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Verifica conexão a cada 30 segundos
    setInterval(() => this.checkConnection(), 30000);
  }

  /**
   * Verifica se está online
   */
  isOnline(): boolean {
    return this.isOnlineState;
  }

  /**
   * Handler quando fica online
   */
  private async handleOnline(): Promise<void> {
    console.log('🟢 Conexão restaurada');
    this.isOnlineState = true;
    
    toast.success('Conexão restaurada', {
      description: 'Sincronizando dados pendentes...',
    });

    // Notifica callbacks
    this.onlineCallbacks.forEach(cb => cb());

    // Sincroniza automaticamente
    await this.syncPendingOperations();
  }

  /**
   * Handler quando fica offline
   */
  private handleOffline(): void {
    console.log('🔴 Conexão perdida');
    this.isOnlineState = false;
    
    toast.warning('Modo Offline', {
      description: 'Suas ações serão sincronizadas quando a conexão voltar.',
    });

    // Notifica callbacks
    this.offlineCallbacks.forEach(cb => cb());
  }

  /**
   * Verifica conexão real (não apenas navigator.onLine)
   */
  private async checkConnection(): Promise<void> {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      const wasOffline = !this.isOnlineState;
      this.isOnlineState = response.ok;

      if (wasOffline && this.isOnlineState) {
        await this.handleOnline();
      } else if (!wasOffline && !this.isOnlineState) {
        this.handleOffline();
      }
    } catch {
      if (this.isOnlineState) {
        this.handleOffline();
      }
    }
  }

  /**
   * Registra operação para sincronizar depois
   */
  async queueOperation(
    type: PendingOperation['type'],
    data: any,
    userId?: string
  ): Promise<void> {
    await addPendingOperation({
      type,
      data,
      timestamp: new Date().toISOString(),
      userId,
    });

    console.log(`📝 Operação ${type} adicionada à fila`);
  }

  /**
   * Sincroniza todas as operações pendentes
   */
  async syncPendingOperations(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⏳ Sincronização já em andamento');
      return { success: false, syncedCount: 0, failedCount: 0, error: 'Sync in progress' };
    }

    if (!this.isOnline()) {
      console.log('🔴 Não é possível sincronizar offline');
      return { success: false, syncedCount: 0, failedCount: 0, error: 'Offline' };
    }

    this.isSyncing = true;
    console.log('🔄 Iniciando sincronização...');

    try {
      const operations = await getPendingOperations();

      if (operations.length === 0) {
        console.log('✅ Nenhuma operação pendente');
        this.isSyncing = false;
        return { success: true, syncedCount: 0, failedCount: 0 };
      }

      // Agrupa operações por usuário
      const operationsByUser = operations.reduce((acc, op) => {
        const userId = op.userId || 'anonymous';
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(op);
        return acc;
      }, {} as Record<string, PendingOperation[]>);

      let syncedCount = 0;
      let failedCount = 0;
      let currentCredits: number | undefined;

      // Sincroniza operações de cada usuário
      for (const [userId, userOps] of Object.entries(operationsByUser)) {
        try {
          const result = await this.syncUserOperations(userId, userOps);
          
          if (result.success) {
            syncedCount += userOps.length;
            currentCredits = result.currentCredits;

            // Remove operações sincronizadas
            for (const op of userOps) {
              await removePendingOperation(op.id);
            }

            // Atualiza créditos locais
            if (userId !== 'anonymous' && result.currentCredits !== undefined) {
              await setLocalCredits(userId, result.currentCredits);
            }
          } else {
            failedCount += userOps.length;
          }
        } catch (error) {
          console.error('Erro ao sincronizar operações do usuário:', error);
          failedCount += userOps.length;
        }
      }

      // Registra log
      await addSyncLog({
        timestamp: new Date().toISOString(),
        status: failedCount === 0 ? 'success' : 'error',
        message: `Sincronizadas ${syncedCount} operações, ${failedCount} falharam`,
        operationsCount: syncedCount,
      });

      const result: SyncResult = {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        currentCredits,
      };

      // Notifica callbacks
      this.syncCallbacks.forEach(cb => cb(result));

      if (syncedCount > 0) {
        toast.success('Sincronização concluída', {
          description: `${syncedCount} operação(ões) sincronizada(s)`,
        });
      }

      console.log(`✅ Sincronização concluída: ${syncedCount} sucesso, ${failedCount} falhas`);
      this.isSyncing = false;
      return result;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      this.isSyncing = false;
      
      await addSyncLog({
        timestamp: new Date().toISOString(),
        status: 'error',
        message: `Erro: ${error}`,
        operationsCount: 0,
      });

      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        error: String(error),
      };
    }
  }

  /**
   * Sincroniza operações de um usuário específico
   */
  private async syncUserOperations(
    userId: string,
    operations: PendingOperation[]
  ): Promise<{ success: boolean; currentCredits?: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('sync-offline-data', {
        body: {
          userId: userId !== 'anonymous' ? userId : undefined,
          operations: operations.map(op => ({
            type: op.type,
            data: op.data,
            timestamp: op.timestamp,
          })),
          lastSync: new Date().toISOString(),
        },
      });

      if (error) throw error;

      return {
        success: data?.status === 'ok',
        currentCredits: data?.currentCredits,
      };
    } catch (error) {
      console.error('Erro ao sincronizar com servidor:', error);
      return { success: false };
    }
  }

  /**
   * Registra callback para quando sincronização terminar
   */
  onSyncComplete(callback: (result: SyncResult) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Registra callback para quando ficar online
   */
  onOnline(callback: () => void): () => void {
    this.onlineCallbacks.push(callback);
    return () => {
      this.onlineCallbacks = this.onlineCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Registra callback para quando ficar offline
   */
  onOffline(callback: () => void): () => void {
    this.offlineCallbacks.push(callback);
    return () => {
      this.offlineCallbacks = this.offlineCallbacks.filter(cb => cb !== callback);
    };
  }
}

// Singleton instance
export const syncManager = new SyncManager();
