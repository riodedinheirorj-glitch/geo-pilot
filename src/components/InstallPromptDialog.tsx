import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePWAContext } from '@/contexts/PWAContext';
import { toast } from 'sonner';

const INSTALL_PROMPT_DISMISSED_KEY = 'rotasmart-install-prompt-dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

export function InstallPromptDialog() {
  const { isInstalled, isInstallable, promptInstall } = usePWAContext();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Não mostrar se já está instalado
    if (isInstalled) {
      return;
    }

    // Não mostrar se não é instalável
    if (!isInstallable) {
      return;
    }

    // Verificar se o usuário já dispensou o prompt recentemente
    const dismissedData = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    if (dismissedData) {
      try {
        const { timestamp } = JSON.parse(dismissedData);
        const now = Date.now();
        
        // Se não passou o tempo de dismiss, não mostrar
        if (now - timestamp < DISMISS_DURATION) {
          return;
        } else {
          // Passou o tempo, remover o registro
          localStorage.removeItem(INSTALL_PROMPT_DISMISSED_KEY);
        }
      } catch (error) {
        // Se houver erro ao ler, remover o registro
        localStorage.removeItem(INSTALL_PROMPT_DISMISSED_KEY);
      }
    }

    // Mostrar o prompt após um pequeno delay para melhor UX
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled, isInstallable]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const accepted = await promptInstall();
      
      if (accepted) {
        toast.success('RotaSmart instalado com sucesso!');
        setShowPrompt(false);
      } else {
        toast.info('Instalação cancelada. Você pode instalar mais tarde.');
        handleDismiss();
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
      toast.error('Erro ao instalar. Tente novamente mais tarde.');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    // Salvar que o usuário dispensou o prompt
    localStorage.setItem(
      INSTALL_PROMPT_DISMISSED_KEY,
      JSON.stringify({ timestamp: Date.now() })
    );
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/rotasmart-logo-192x192.png" 
              alt="RotaSmart Logo" 
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          <DialogTitle className="text-center text-xl">
            Instalar RotaSmart
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Instale o RotaSmart no seu dispositivo para acesso rápido e uma experiência completa de aplicativo.
          </DialogDescription>
        </DialogHeader>

        {/* Conteúdo removido conforme solicitado */}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {isInstalling ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-bounce" />
                Instalando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Instalar Agora
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={isInstalling}
            className="w-full"
          >
            Agora Não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}