import { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Escuta mensagens do service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        console.log('🆕 Nova versão disponível');
        setShowUpdate(true);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    // Verifica se já existe uma atualização pendente
    navigator.serviceWorker?.ready.then((registration) => {
      if (registration.waiting) {
        setShowUpdate(true);
      }
    });

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      const registration = await navigator.serviceWorker?.ready;
      
      if (registration?.waiting) {
        // Envia mensagem para o service worker ativar
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Aguarda o novo service worker assumir controle
        navigator.serviceWorker?.addEventListener('controllerchange', () => {
          console.log('🔄 Recarregando página com nova versão');
          window.location.reload();
        });
      } else {
        // Se não há worker esperando, apenas recarrega
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setIsUpdating(false);
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 shadow-lg shadow-primary/10">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse">
                <RefreshCw className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">
                Nova Versão Disponível
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Há uma nova versão do RotaSmart. Atualize agora para ter acesso às melhorias mais recentes.
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="sm"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Agora'
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpdate(false)}
                  disabled={isUpdating}
                >
                  Mais Tarde
                </Button>
              </div>
            </div>

            <button
              onClick={() => setShowUpdate(false)}
              disabled={isUpdating}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
